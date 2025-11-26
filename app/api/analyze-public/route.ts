import { NextResponse } from "next/server";
import { GitHubClient } from "@/lib/github";
import { ClaudeAnalyzer } from "@/lib/claude";

// In-memory rate limiting (resets on server restart)
// For production, use Redis/Vercel KV for persistent rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 5; // requests per day
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function getClientIP(request: Request): string {
  // Try to get real IP from Vercel headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  // Fallback (shouldn't happen on Vercel)
  return "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // No record or expired - create new
  if (!record || now > record.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW;
    rateLimitMap.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt };
  }

  // Check if over limit
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  // Increment count
  record.count++;
  rateLimitMap.set(ip, record);

  return { allowed: true, remaining: RATE_LIMIT - record.count, resetAt: record.resetAt };
}

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Check rate limit
    const rateLimit = checkRateLimit(clientIP);

    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetAt);
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `You've reached the limit of ${RATE_LIMIT} analyses per day. Please try again after ${resetDate.toLocaleString()}.`,
          resetAt: resetDate.toISOString()
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString()
          }
        }
      );
    }

    const { githubToken, repository, prdPath, issueLabels } = await request.json();

    // Validate inputs (no anthropicKey needed - using server-side key)
    if (!githubToken || !repository) {
      return NextResponse.json(
        { error: "Missing required parameters: githubToken, repository" },
        { status: 400 }
      );
    }

    // Check for server-side Anthropic API key
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json(
        {
          error: "Server configuration error",
          message: "Public demo is not configured. Please use your own API key or contact the administrator."
        },
        { status: 503 }
      );
    }

    // Initialize clients (using server-side Anthropic key)
    const githubClient = new GitHubClient(githubToken, repository);
    const claudeAnalyzer = new ClaudeAnalyzer(anthropicKey);

    // Fetch PRD and Issues
    const prd = await githubClient.getPRD(prdPath || "docs/prd.md");
    const issues = await githubClient.getIssues(issueLabels);

    // Parse requirements from PRD
    const requirements = githubClient.parsePRDRequirements(prd);

    // Analyze drift with Claude
    const analysis = await claudeAnalyzer.analyzeDrift(requirements, issues);

    return NextResponse.json(
      {
        success: true,
        data: {
          repository,
          prdPath: prdPath || "docs/prd.md",
          totalRequirements: requirements.length,
          totalIssues: issues.length,
          analysis,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString()
        }
      }
    );
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to analyse repository",
        details: error.response?.data || error.toString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PRD Drift Detector Public API (Rate Limited)",
    rateLimit: {
      requests: RATE_LIMIT,
      window: "24 hours"
    },
    note: "This endpoint uses a server-side Anthropic API key. You only need to provide your GitHub token."
  });
}
