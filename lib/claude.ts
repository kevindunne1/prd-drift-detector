import Anthropic from "@anthropic-ai/sdk";
import { PRDRequirement, GitHubIssue } from "./github";

export interface DriftAnalysis {
  requirement: PRDRequirement;
  status: "delivered" | "partial" | "missing" | "in_progress" | "out_of_scope";
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
  keyConcerns: string[];
  weeksBehind: number;
  featuresBlocked: number;
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
        model: "claude-3-haiku-20240307",
        max_tokens: 4096,
        temperature: 0,
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
        "Failed to analyse drift with Claude"
      );
    }
  }

  private buildAnalysisPrompt(
    requirements: PRDRequirement[],
    issues: GitHubIssue[]
  ): string {
    const requirementsText = requirements
      .map((req) => `${req.id}. [${req.section}] ${req.text}`)
      .join("\n");

    const issuesText = issues
      .map(
        (issue) =>
          `#${issue.number} [${issue.state}] ${issue.title}\n  Labels: ${issue.labels.join(", ")}\n  Body: ${issue.body?.substring(0, 200) || "No description"}...`
      )
      .join("\n\n");

    return `You are analysing PRD-to-delivery alignment for a product team.

**IMPORTANT**: Use UK English spelling in all your responses (analyse, organisation, realise, prioritise, etc.).

## PRD REQUIREMENTS:
${requirementsText}

## GITHUB ISSUES (Delivery):
${issuesText}

## YOUR TASK:
Analyse the drift between the PRD requirements and the actual GitHub issues (delivery).

**IMPORTANT**: Each requirement should appear EXACTLY ONCE in your analysis. Do not create duplicate entries for the same requirement.

For each requirement, determine:
1. **Status**:
   - delivered: requirement fully implemented and working as specified in PRD
   - partial: requirement partially implemented (some functionality delivered, but not complete)
   - in_progress: requirement is actively being worked on (has related open issues/PRs)
   - missing: requirement not started or no evidence of work
   - out_of_scope: requirement explicitly removed from scope or marked as future work
2. **Matched Issues**: Which GitHub issue numbers correspond to this requirement (if any)
3. **Drift Description**: Explain any scope drift, timeline changes, or misalignment between what was planned and what was/is being delivered
4. **Risk Level**: low (delivered or minor issues), medium (partial delivery or moderate concerns), high (missing, blocked, or critical drift). Use "low" for out_of_scope items.

**IMPORTANT**: Be consistent with status assignments. If a requirement has a closed issue that addresses it, mark it as "delivered" unless there's clear evidence it's incomplete.

Also provide:
- **Completion Percentage**: Calculate as (number of "delivered" requirements / total requirements excluding "out_of_scope") × 100. Only count requirements with status="delivered" as complete.
- **Risk Score**: 0-100 (0 = no risk, 100 = critical risk). Base this on the count and severity of high-risk items.
- **Timeline Drift**: Brief factual assessment (e.g., "3 weeks behind schedule" or "On track")
- **Weeks Behind**: Approximate weeks behind schedule. Use PRD timeline if available, otherwise estimate from completion gap.
- **Features Blocked**: Count of requirements with status "missing" or "partial" AND risk level "high" or "medium"
- **Key Concerns**: Array of 3-5 brief concerns from high/medium risk requirements
- **Summary**: 2-3 sentence overall assessment

Return your analysis as JSON in this exact format:
\`\`\`json
{
  "completionPercentage": 75,
  "riskScore": 35,
  "timelineDrift": "3 weeks behind schedule",
  "weeksBehind": 3,
  "featuresBlocked": 5,
  "keyConcerns": [
    "Scheduled exports feature not started (high priority)",
    "Custom export templates only partially implemented",
    "Server-side generation still in progress"
  ],
  "summary": "Overall delivery is progressing but with moderate drift from the original PRD. Several key requirements are missing or only partially implemented.",
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

      // De-duplicate requirements based on requirement text
      // Keep first occurrence of each unique requirement
      const uniqueRequirementsDrift = requirementsDrift.filter(
        (drift, index, self) =>
          index === self.findIndex((d) => d.requirement.text === drift.requirement.text)
      );

      return {
        completionPercentage: parsed.completionPercentage,
        riskScore: parsed.riskScore,
        timelineDrift: parsed.timelineDrift,
        requirementsDrift: uniqueRequirementsDrift,
        summary: parsed.summary,
        keyConcerns: parsed.keyConcerns || [],
        weeksBehind: parsed.weeksBehind || 0,
        featuresBlocked: parsed.featuresBlocked || 0,
      };
    } catch (error) {
      console.error("Error parsing Claude response:", error);
      console.error("Raw response:", responseText);

      // Return fallback analysis
      return {
        completionPercentage: 0,
        riskScore: 100,
        timelineDrift: "Unable to analyse",
        requirementsDrift: requirements.map((req) => ({
          requirement: req,
          status: "missing" as const,
          matchedIssues: [],
          driftDescription: "Analysis failed",
          riskLevel: "high" as const,
        })),
        summary: "Failed to parse analysis from Claude API",
        keyConcerns: ["Analysis failed - unable to extract key concerns"],
        weeksBehind: 0,
        featuresBlocked: 0,
      };
    }
  }
}
