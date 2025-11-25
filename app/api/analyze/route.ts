import { NextResponse } from "next/server";
import { GitHubClient } from "@/lib/github";
import { ClaudeAnalyzer } from "@/lib/claude";

export async function POST(request: Request) {
  try {
    const { githubToken, anthropicKey, repository, prdPath, issueLabels } = await request.json();

    // Validate inputs
    if (!githubToken || !anthropicKey || !repository) {
      return NextResponse.json(
        { error: "Missing required parameters: githubToken, anthropicKey, repository" },
        { status: 400 }
      );
    }

    // Initialize clients
    const githubClient = new GitHubClient(githubToken, repository);
    const claudeAnalyzer = new ClaudeAnalyzer(anthropicKey);

    // Fetch PRD and Issues
    const prd = await githubClient.getPRD(prdPath || "docs/prd.md");
    const issues = await githubClient.getIssues(issueLabels);

    // Parse requirements from PRD
    const requirements = githubClient.parsePRDRequirements(prd);

    // Analyze drift with Claude
    const analysis = await claudeAnalyzer.analyzeDrift(requirements, issues);

    return NextResponse.json({
      success: true,
      data: {
        repository,
        prdPath: prdPath || "docs/prd.md",
        totalRequirements: requirements.length,
        totalIssues: issues.length,
        analysis,
      },
    });
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to analyze repository",
        details: error.response?.data || error.toString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PRD Drift Detector API",
    endpoints: {
      POST: "/api/analyze - Analyze PRD-to-delivery drift",
    },
  });
}
