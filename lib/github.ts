import { Octokit } from "octokit";

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: string[];
  created_at: string;
  closed_at: string | null;
  assignee: string | null;
}

export interface PRDRequirement {
  id: string;
  text: string;
  section: string;
}

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, repository: string) {
    this.octokit = new Octokit({ auth: token });
    const [owner, repo] = repository.split("/");
    this.owner = owner;
    this.repo = repo;
  }

  async getPRD(prdPath: string = "docs/prd.md"): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: prdPath,
      });

      if ("content" in data) {
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        return content;
      }

      throw new Error("PRD file not found or is a directory");
    } catch (error) {
      console.error("Error fetching PRD:", error);
      throw new Error(`Failed to fetch PRD from ${prdPath}`);
    }
  }

  async getIssues(labels?: string[]): Promise<GitHubIssue[]> {
    try {
      const params: any = {
        owner: this.owner,
        repo: this.repo,
        state: "all",
        per_page: 100,
      };

      if (labels && labels.length > 0) {
        params.labels = labels.join(",");
      }

      const { data } = await this.octokit.rest.issues.listForRepo(params);

      return data
        .filter((issue) => !issue.pull_request) // Filter out PRs
        .map((issue) => ({
          number: issue.number,
          title: issue.title,
          body: issue.body || null,
          state: issue.state,
          labels: issue.labels.map((label) =>
            typeof label === "string" ? label : label.name || ""
          ),
          created_at: issue.created_at,
          closed_at: issue.closed_at,
          assignee: issue.assignee?.login || null,
        }));
    } catch (error) {
      console.error("Error fetching issues:", error);
      throw new Error("Failed to fetch GitHub issues");
    }
  }

  parsePRDRequirements(prdContent: string): PRDRequirement[] {
    const requirements: PRDRequirement[] = [];
    const lines = prdContent.split("\n");
    let currentSection = "General";

    lines.forEach((line, index) => {
      // Detect section headers (e.g., ## Requirements, ### User Stories)
      const headerMatch = line.match(/^#+\s+(.+)/);
      if (headerMatch) {
        currentSection = headerMatch[1].trim();
        return;
      }

      // Extract bullet points or numbered lists as requirements
      const reqMatch = line.match(/^[-*]\s+(.+)|^\d+\.\s+(.+)/);
      if (reqMatch) {
        const text = reqMatch[1] || reqMatch[2];
        if (text && text.length > 10) { // Filter out very short items
          requirements.push({
            id: `req-${index}`,
            text: text.trim(),
            section: currentSection,
          });
        }
      }

      // Extract user stories
      const userStoryMatch = line.match(/As a (.+), I want (.+)/i);
      if (userStoryMatch) {
        requirements.push({
          id: `req-${index}`,
          text: line.trim(),
          section: "User Stories",
        });
      }
    });

    return requirements;
  }
}
