"use client";

import { useState, useEffect } from "react";
import { getRandomLoadingVerb } from "@/lib/loading-verbs";
import Tooltip from "./Tooltip";

interface ConfigFormProps {
  onAnalyze: (config: {
    githubToken: string;
    anthropicKey: string;
    repository: string;
    prdPath: string;
    issueLabels: string[];
    usePublicAPI: boolean;
  }) => void;
  loading: boolean;
}

export default function ConfigForm({ onAnalyze, loading }: ConfigFormProps) {
  const [demoMode, setDemoMode] = useState(true); // Default to demo mode
  const [githubToken, setGithubToken] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [repository, setRepository] = useState("");
  const [prdPath, setPrdPath] = useState("docs/prd.md");
  const [issueLabels, setIssueLabels] = useState("");
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string | null>(null);
  const [loadingVerb, setLoadingVerb] = useState("Analysing");

  // Load saved config from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("lastAnalysisConfig");
      const savedTimestamp = localStorage.getItem("lastAnalysisTimestamp");

      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          setGithubToken(config.githubToken || "");
          setAnthropicKey(config.anthropicKey || "");
          setRepository(config.repository || "");
          setPrdPath(config.prdPath || "docs/prd.md");
          setIssueLabels(config.issueLabels?.join(", ") || "");
        } catch (e) {
          console.error("Failed to load saved config:", e);
        }
      }

      if (savedTimestamp) {
        setLastAnalysisTime(savedTimestamp);
      }
    }
  }, []);

  // Update timestamp when analysis completes (loading becomes false after being true)
  useEffect(() => {
    if (!loading && typeof window !== "undefined") {
      const savedTimestamp = localStorage.getItem("lastAnalysisTimestamp");
      if (savedTimestamp) {
        setLastAnalysisTime(savedTimestamp);
      }
    }
  }, [loading]);

  // Listen for localStorage changes (when widget runs analysis)
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        const savedTimestamp = localStorage.getItem("lastAnalysisTimestamp");
        if (savedTimestamp) {
          setLastAnalysisTime(savedTimestamp);
        }
      }
    };

    // Poll every 1 second to check for localStorage updates
    const interval = setInterval(handleStorageChange, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingVerb(getRandomLoadingVerb());
    onAnalyze({
      githubToken,
      anthropicKey,
      repository,
      prdPath,
      issueLabels: issueLabels.split(",").map((l) => l.trim()).filter(Boolean),
      usePublicAPI: demoMode,
    });
  };

  const handleRerun = () => {
    // In demo mode, only require githubToken and repository
    // In private mode, also require anthropicKey
    const hasRequiredFields = demoMode
      ? (githubToken && repository)
      : (githubToken && anthropicKey && repository);

    if (hasRequiredFields) {
      setLoadingVerb(getRandomLoadingVerb());
      onAnalyze({
        githubToken,
        anthropicKey,
        repository,
        prdPath,
        issueLabels: issueLabels.split(",").map((l) => l.trim()).filter(Boolean),
        usePublicAPI: demoMode,
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/50 p-6 space-y-4">
      {lastAnalysisTime && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Last analysis</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">{formatTimestamp(lastAnalysisTime)}</p>
            </div>
            <button
              type="button"
              onClick={handleRerun}
              disabled={loading || !githubToken || !repository || (!demoMode && !anthropicKey)}
              className="ml-3 px-3 py-1.5 text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? `${loadingVerb}...` : "Re-run"}
            </button>
          </div>
        </div>
      )}

      {/* Demo Mode Toggle */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="demoMode"
            checked={demoMode}
            onChange={(e) => setDemoMode(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
          />
          <div className="flex-1">
            <label htmlFor="demoMode" className="text-sm font-medium text-green-800 dark:text-green-200 cursor-pointer">
              Use Public Demo (Recommended)
            </label>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Free to use • No Anthropic API key needed • 5 analyses per day
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <label htmlFor="repository" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            GitHub Repository (owner/repo)
          </label>
          <Tooltip content="Format: owner/repository (e.g., facebook/react). Find this in your GitHub repo URL.">
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Tooltip>
        </div>
        <input
          type="text"
          id="repository"
          value={repository}
          onChange={(e) => setRepository(e.target.value)}
          placeholder="octocat/Hello-World"
          className="w-full px-3 py-2.5 text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          required
        />
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <label htmlFor="prdPath" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            PRD File Path
          </label>
          <Tooltip content="Path to your PRD markdown file in the repository (e.g., docs/prd.md or README.md)">
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Tooltip>
        </div>
        <input
          type="text"
          id="prdPath"
          value={prdPath}
          onChange={(e) => setPrdPath(e.target.value)}
          placeholder="docs/prd.md"
          className="w-full px-3 py-2.5 text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
        />
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <label htmlFor="issueLabels" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Issue Labels (comma-separated, optional)
          </label>
          <Tooltip content="Filter GitHub issues by labels (e.g., 'feature, enhancement'). Leave empty to analyze all issues.">
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Tooltip>
        </div>
        <input
          type="text"
          id="issueLabels"
          value={issueLabels}
          onChange={(e) => setIssueLabels(e.target.value)}
          placeholder="feature, enhancement"
          className="w-full px-3 py-2.5 text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
        />
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <label htmlFor="githubToken" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            GitHub Personal Access Token
          </label>
          <Tooltip content="Create at github.com/settings/tokens. Needs 'repo' read access to fetch issues and PRD.">
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Tooltip>
        </div>
        <div className="relative">
          <input
            type={showGithubToken ? "text" : "password"}
            id="githubToken"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            className="w-full px-3 py-2.5 pr-10 text-base font-medium text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button
            type="button"
            onClick={() => setShowGithubToken(!showGithubToken)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            {showGithubToken ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Create at: github.com/settings/tokens (needs repo read access)
        </p>
      </div>

      {!demoMode && (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <label htmlFor="anthropicKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Anthropic API Key
            </label>
            <Tooltip content="Get your API key at console.anthropic.com. Used for AI-powered drift analysis.">
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Tooltip>
          </div>
          <div className="relative">
            <input
              type={showAnthropicKey ? "text" : "password"}
              id="anthropicKey"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-xxxxxxxxxxxx"
              className="w-full px-3 py-2.5 pr-10 text-base font-medium text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={!demoMode}
            />
            <button
              type="button"
              onClick={() => setShowAnthropicKey(!showAnthropicKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              {showAnthropicKey ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Get your key at: console.anthropic.com
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed font-medium"
      >
        {loading ? `${loadingVerb}...` : "Analyse PRD Drift"}
      </button>
    </form>
  );
}
