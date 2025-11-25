"use client";

import { useState } from "react";

interface ConfigFormProps {
  onAnalyze: (config: {
    githubToken: string;
    anthropicKey: string;
    repository: string;
    prdPath: string;
    issueLabels: string[];
  }) => void;
  loading: boolean;
}

export default function ConfigForm({ onAnalyze, loading }: ConfigFormProps) {
  const [githubToken, setGithubToken] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [repository, setRepository] = useState("");
  const [prdPath, setPrdPath] = useState("docs/prd.md");
  const [issueLabels, setIssueLabels] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze({
      githubToken,
      anthropicKey,
      repository,
      prdPath,
      issueLabels: issueLabels.split(",").map((l) => l.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div>
        <label htmlFor="repository" className="block text-sm font-medium text-slate-700 mb-1">
          GitHub Repository (owner/repo)
        </label>
        <input
          type="text"
          id="repository"
          value={repository}
          onChange={(e) => setRepository(e.target.value)}
          placeholder="octocat/Hello-World"
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="prdPath" className="block text-sm font-medium text-slate-700 mb-1">
          PRD File Path
        </label>
        <input
          type="text"
          id="prdPath"
          value={prdPath}
          onChange={(e) => setPrdPath(e.target.value)}
          placeholder="docs/prd.md"
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="issueLabels" className="block text-sm font-medium text-slate-700 mb-1">
          Issue Labels (comma-separated, optional)
        </label>
        <input
          type="text"
          id="issueLabels"
          value={issueLabels}
          onChange={(e) => setIssueLabels(e.target.value)}
          placeholder="feature, enhancement"
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="githubToken" className="block text-sm font-medium text-slate-700 mb-1">
          GitHub Personal Access Token
        </label>
        <input
          type="password"
          id="githubToken"
          value={githubToken}
          onChange={(e) => setGithubToken(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxx"
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="text-xs text-slate-500 mt-1">
          Create at: github.com/settings/tokens (needs repo read access)
        </p>
      </div>

      <div>
        <label htmlFor="anthropicKey" className="block text-sm font-medium text-slate-700 mb-1">
          Anthropic API Key
        </label>
        <input
          type="password"
          id="anthropicKey"
          value={anthropicKey}
          onChange={(e) => setAnthropicKey(e.target.value)}
          placeholder="sk-ant-xxxxxxxxxxxx"
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="text-xs text-slate-500 mt-1">
          Get your key at: console.anthropic.com
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed font-medium"
      >
        {loading ? "Analyzing..." : "Analyze PRD Drift"}
      </button>
    </form>
  );
}
