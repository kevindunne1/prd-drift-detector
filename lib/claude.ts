import Anthropic from "@anthropic-ai/sdk";
import { PRDRequirement, GitHubIssue } from "./github";

export interface DriftAnalysis {
  requirement: PRDRequirement;
  status: "delivered" | "partial" | "missing" | "in_progress";
  matchedIssues: number[];
  driftDescription: string;
  riskLevel: "low" | "medium" | "high";
}

export interface OverallAnalysis {
  completionPercentage: number;
  riskScore: number;
  timelineDrift: string;
  requirementsDrift: DriftAnalysis[];
  summary: string;
}

export class ClaudeAnalyzer {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async analyzeDrift(
    requirements: PRDRequirement[],
    issues: GitHubIssue[]
  ): Promise<OverallAnalysis> {
    const prompt = this.buildAnalysisPrompt(requirements, issues);

    try {
      const message = await this.client.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === "text"
        ? message.content[0].text
        : "";

      return this.parseAnalysisResponse(responseText, requirements);
    } catch (error: any) {
      console.error("Error calling Claude API:", error);
      // Pass through the actual error details
      throw new Error(
        error.message ||
        error.error?.message ||
        "Failed to analyze drift with Claude"
      );
    }
  }

  private buildAnalysisPrompt(
    requirements: PRDRequirement[],
    issues: GitHubIssue[]
  ): string {
    const requirementsText = requirements
      .map((req, idx) => `${idx + 1}. [${req.section}] ${req.text}`)
      .join("\n");

    const issuesText = issues
      .map(
        (issue) =>
          `#${issue.number} [${issue.state}] ${issue.title}\n  Labels: ${issue.labels.join(", ")}\n  Body: ${issue.body?.substring(0, 200) || "No description"}...`
      )
      .join("\n\n");

    return `You are analyzing PRD-to-delivery alignment for a product team.

## PRD REQUIREMENTS:
${requirementsText}

## GITHUB ISSUES (Delivery):
${issuesText}

## YOUR TASK:
Analyze the drift between the PRD requirements and the actual GitHub issues (delivery).

For each requirement, determine:
1. **Status**: delivered (requirement fully met), partial (requirement partially met), missing (not started), or in_progress (work ongoing)
2. **Matched Issues**: Which GitHub issue numbers correspond to this requirement (if any)
3. **Drift Description**: Explain any scope drift, timeline changes, or misalignment between what was planned and what was/is being delivered
4. **Risk Level**: low (on track, no concerns), medium (minor issues, scope reduction), high (major drift, blocked, or not started)

Also provide:
- **Completion Percentage**: What % of PRD requirements are fully delivered?
- **Risk Score**: 0-100 (0 = no risk, 100 = critical risk)
- **Timeline Drift**: Brief assessment of whether delivery is on track, behind, or ahead
- **Summary**: 2-3 sentence overall assessment

Return your analysis as JSON in this exact format:
\`\`\`json
{
  "completionPercentage": 75,
  "riskScore": 35,
  "timelineDrift": "2 weeks behind schedule, 3 features blocked",
  "summary": "Overall delivery is progressing but with moderate drift...",
  "requirementsDrift": [
    {
      "requirementId": "req-1",
      "status": "delivered",
      "matchedIssues": [1, 5],
      "driftDescription": "Requirement delivered as planned",
      "riskLevel": "low"
    },
    {
      "requirementId": "req-2",
      "status": "partial",
      "matchedIssues": [7],
      "driftDescription": "PRD specified CSV export, but only PDF was delivered",
      "riskLevel": "medium"
    }
  ]
}
\`\`\`

Be precise, objective, and focus on identifying genuine drift (not minor implementation details).`;
  }

  private parseAnalysisResponse(
    responseText: string,
    requirements: PRDRequirement[]
  ): OverallAnalysis {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : responseText;

      const parsed = JSON.parse(jsonString);

      // Map requirementIds back to full PRDRequirement objects
      const requirementsDrift: DriftAnalysis[] = parsed.requirementsDrift.map(
        (drift: any) => {
          const requirement = requirements.find((r) => r.id === drift.requirementId);
          return {
            requirement: requirement || requirements[0], // Fallback
            status: drift.status,
            matchedIssues: drift.matchedIssues || [],
            driftDescription: drift.driftDescription,
            riskLevel: drift.riskLevel,
          };
        }
      );

      return {
        completionPercentage: parsed.completionPercentage,
        riskScore: parsed.riskScore,
        timelineDrift: parsed.timelineDrift,
        requirementsDrift,
        summary: parsed.summary,
      };
    } catch (error) {
      console.error("Error parsing Claude response:", error);
      console.error("Raw response:", responseText);

      // Return fallback analysis
      return {
        completionPercentage: 0,
        riskScore: 100,
        timelineDrift: "Unable to analyze",
        requirementsDrift: requirements.map((req) => ({
          requirement: req,
          status: "missing" as const,
          matchedIssues: [],
          driftDescription: "Analysis failed",
          riskLevel: "high" as const,
        })),
        summary: "Failed to parse analysis from Claude API",
      };
    }
  }
}
