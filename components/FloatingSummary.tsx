"use client";

import { useState, useEffect } from "react";
import { OverallAnalysis } from "@/lib/claude";
import { useTheme } from "./ThemeProvider";
import { getRandomLoadingVerb } from "@/lib/loading-verbs";
import Tooltip from "./Tooltip";

interface FloatingSummaryProps {
  analysis: OverallAnalysis | null;
  onAnalysisComplete?: (analysis: OverallAnalysis, metadata: any) => void;
  onViewDetails: () => void;
}

type WidgetState = "collapsed" | "summary" | "config";

interface PreviousAnalysis {
  completionPercentage: number;
  riskScore: number;
  timestamp: string;
}

export default function FloatingSummary({ analysis: initialAnalysis, onAnalysisComplete, onViewDetails }: FloatingSummaryProps) {
  const { theme, toggleTheme } = useTheme();
  const [widgetState, setWidgetState] = useState<WidgetState>("collapsed");
  const [analysis, setAnalysis] = useState<OverallAnalysis | null>(initialAnalysis);
  const [previousAnalysis, setPreviousAnalysis] = useState<PreviousAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Config form state
  const [demoMode, setDemoMode] = useState(true); // Default to demo mode
  const [githubToken, setGithubToken] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [repository, setRepository] = useState("");
  const [prdPath, setPrdPath] = useState("docs/prd.md");
  const [issueLabels, setIssueLabels] = useState("");
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string | null>(null);
  const [loadingVerb, setLoadingVerb] = useState("Analysing");

  // Load saved config and previous analysis from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("lastAnalysisConfig");
      const savedTimestamp = localStorage.getItem("lastAnalysisTimestamp");
      const savedPreviousAnalysis = localStorage.getItem("previousAnalysis");

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

      if (savedPreviousAnalysis) {
        try {
          setPreviousAnalysis(JSON.parse(savedPreviousAnalysis));
        } catch (e) {
          console.error("Failed to load previous analysis:", e);
        }
      }
    }
  }, []);

  // Update analysis when prop changes (main form ran analysis)
  useEffect(() => {
    if (initialAnalysis) {
      // Store current analysis as previous before updating (same as handleAnalyze)
      if (analysis && typeof window !== "undefined") {
        const prev: PreviousAnalysis = {
          completionPercentage: analysis.completionPercentage,
          riskScore: analysis.riskScore,
          timestamp: lastAnalysisTime || new Date().toISOString(),
        };
        localStorage.setItem("previousAnalysis", JSON.stringify(prev));
        setPreviousAnalysis(prev);
      }

      setAnalysis(initialAnalysis);
      setWidgetState("summary");

      // Sync timestamp from localStorage when parent updates
      if (typeof window !== "undefined") {
        const savedTimestamp = localStorage.getItem("lastAnalysisTimestamp");
        if (savedTimestamp) {
          setLastAnalysisTime(savedTimestamp);
        }
      }
    }
  }, [initialAnalysis, analysis, lastAnalysisTime]);

  const handleAnalyze = async () => {
    setLoadingVerb(getRandomLoadingVerb());
    setLoading(true);
    setError(null);

    try {
      // Choose endpoint based on demo mode
      const endpoint = demoMode ? "/api/analyze-public" : "/api/analyze";

      // Prepare config (exclude anthropicKey if using public API)
      const config = demoMode
        ? {
            githubToken,
            repository,
            prdPath,
            issueLabels: issueLabels.split(",").map((l) => l.trim()).filter(Boolean),
          }
        : {
            githubToken,
            anthropicKey,
            repository,
            prdPath,
            issueLabels: issueLabels.split(",").map((l) => l.trim()).filter(Boolean),
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle rate limit error specially
        if (response.status === 429) {
          const resetDate = result.resetAt ? new Date(result.resetAt).toLocaleString() : "later";
          throw new Error(`${result.message || "Rate limit exceeded. Please try again after " + resetDate}`);
        }
        throw new Error(result.error || "Failed to analyze");
      }

      const newAnalysis = result.data.analysis;

      // Store current analysis as previous before updating
      if (analysis && typeof window !== "undefined") {
        const prev: PreviousAnalysis = {
          completionPercentage: analysis.completionPercentage,
          riskScore: analysis.riskScore,
          timestamp: lastAnalysisTime || new Date().toISOString(),
        };
        localStorage.setItem("previousAnalysis", JSON.stringify(prev));
        setPreviousAnalysis(prev);
      }

      setAnalysis(newAnalysis);

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("lastAnalysisConfig", JSON.stringify(config));
        localStorage.setItem("lastAnalysisTimestamp", new Date().toISOString());
        setLastAnalysisTime(new Date().toISOString());
      }

      // Notify parent component
      if (onAnalysisComplete) {
        onAnalysisComplete(newAnalysis, {
          repository: result.data.repository,
          prdPath: result.data.prdPath,
          totalRequirements: result.data.totalRequirements,
          totalIssues: result.data.totalIssues,
        });
      }

      setWidgetState("summary");
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis");
    } finally {
      setLoading(false);
    }
  };

  const getRiskBreakdown = () => {
    if (!analysis) return { high: 0, medium: 0, low: 0 };

    const breakdown = { high: 0, medium: 0, low: 0 };
    analysis.requirementsDrift.forEach((drift) => {
      // Only count risks for requirements that are active (not delivered or out of scope)
      // Use lowercase comparison to handle case variations
      const status = (drift.status || "").toLowerCase().trim();

      // Exclude delivered requirements and out-of-scope items
      if (status !== "delivered" && status !== "out_of_scope") {
        if (drift.riskLevel === "high") breakdown.high++;
        else if (drift.riskLevel === "medium") breakdown.medium++;
        else if (drift.riskLevel === "low") breakdown.low++;
      }
    });

    return breakdown;
  };

  const getComparison = (current: number, previous: number | undefined, unit: string = "") => {
    if (previous === undefined) return null;
    const diff = current - previous;

    // Handle zero change (neutral)
    if (diff === 0) {
      return {
        diff: 0,
        text: `0${unit} from last run`,
        color: "text-slate-600 dark:text-slate-400",
        isPositive: null
      };
    }

    const isPositive = diff > 0;
    const text = `${isPositive ? '+' : ''}${diff}${unit} from last run`;
    const color = isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    return { diff: Math.abs(diff), text, color, isPositive };
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

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return "#10b981"; // green
    if (percentage >= 50) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: "High Risk", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" };
    if (score >= 40) return { label: "Moderate Risk", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" };
    return { label: "Low Risk", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" };
  };

  const riskBreakdown = getRiskBreakdown();
  const completionComparison = analysis && previousAnalysis ? getComparison(analysis.completionPercentage, previousAnalysis.completionPercentage, "%") : null;
  const riskComparison = analysis && previousAnalysis ? getComparison(previousAnalysis.riskScore, analysis.riskScore) : null; // Inverted: lower risk is better

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {widgetState === "collapsed" && (
        // Collapsed State - Compact Pill (Grammarly-style)
        <button
          onClick={() => setWidgetState(analysis ? "summary" : "config")}
          className="bg-white dark:bg-slate-800 rounded-full shadow-lg dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3 hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          {analysis ? (
            <>
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10">
                  <svg className="transform -rotate-90" width="40" height="40">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-slate-200 dark:text-slate-700"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke={getCompletionColor(analysis.completionPercentage)}
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${(analysis.completionPercentage / 100) * 100.5} 100.5`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {analysis.completionPercentage}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Score</span>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
              <div className="flex flex-col items-start">
                <span className="text-xs text-slate-500 dark:text-slate-400">Risk Items</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-red-600 dark:text-red-400 font-semibold">{riskBreakdown.high}</span>
                  <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{riskBreakdown.medium}</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">{riskBreakdown.low}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="text-2xl">📊</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Analyse PRD Drift</span>
            </>
          )}
        </button>
      )}

      {widgetState === "summary" && analysis && (
        // Summary State - Grammarly-inspired Card
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-5 w-96 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">PRD Drift Analysis</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setWidgetState("collapsed")}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Completion Score (Grammarly-style circular gauge) */}
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24">
                <svg className="transform -rotate-90" width="96" height="96">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={getCompletionColor(analysis.completionPercentage)}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${(analysis.completionPercentage / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {analysis.completionPercentage}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Completion</p>
                {completionComparison && completionComparison.diff > 0 && (
                  <p className={`text-xs font-medium ${completionComparison.color}`}>
                    {completionComparison.text}
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Risk Breakdown</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">High Risk</span>
                  </div>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">{riskBreakdown.high}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">Medium Risk</span>
                  </div>
                  <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{riskBreakdown.medium}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">Low Risk</span>
                  </div>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">{riskBreakdown.low}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Risk Score */}
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Overall Risk Score</span>
              <div className="text-right">
                <div>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{analysis.riskScore}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">/100</span>
                </div>
                {riskComparison && riskComparison.diff > 0 && (
                  <p className={`text-xs font-medium ${riskComparison.color}`}>
                    {riskComparison.text}
                  </p>
                )}
              </div>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getRiskLevel(analysis.riskScore).color}`}>
              {getRiskLevel(analysis.riskScore).label}
            </span>
          </div>

          {/* Timeline Status */}
          <div className="mb-4">
            <div className="mb-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Timeline Status</span>

              {/* Timeline Summary - using warning icons instead of boxes */}
              {analysis.weeksBehind > 0 || analysis.featuresBlocked > 0 ? (
                <div className="space-y-1.5 mb-3">
                  {analysis.weeksBehind > 0 && (
                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-xs font-medium">{analysis.weeksBehind} {analysis.weeksBehind === 1 ? 'week' : 'weeks'} behind schedule</span>
                    </div>
                  )}
                  {analysis.featuresBlocked > 0 && (
                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-xs font-medium">{analysis.featuresBlocked} {analysis.featuresBlocked === 1 ? 'feature' : 'features'} blocked</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Planned vs Actual Timeline */}
            <div className="space-y-2">
              {/* Planned Position */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 w-14">Planned</span>
                <div className="flex-1 relative h-2">
                  <div className="absolute inset-0 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                  <div
                    className="absolute inset-y-0 left-0 bg-green-500 rounded-full"
                    style={{ width: '75%' }}
                  ></div>
                  <div className="absolute inset-0 flex items-center">
                    <div
                      className="h-3 w-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm"
                      style={{ marginLeft: '75%', transform: 'translateX(-50%)' }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-8 text-right">75%</span>
              </div>

              {/* Actual Position */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 w-14">Actual</span>
                <div className="flex-1 relative h-2">
                  <div className="absolute inset-0 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${
                      analysis.timelineDrift.toLowerCase().includes('ahead')
                        ? 'bg-green-500'
                        : analysis.timelineDrift.toLowerCase().includes('on track') || analysis.timelineDrift.toLowerCase().includes('on schedule')
                        ? 'bg-blue-500'
                        : 'bg-red-500'
                    }`}
                    style={{
                      width: analysis.timelineDrift.toLowerCase().includes('ahead')
                        ? '60%'
                        : analysis.timelineDrift.toLowerCase().includes('on track') || analysis.timelineDrift.toLowerCase().includes('on schedule')
                        ? '75%'
                        : '45%'  // Behind: show actual progress (45%) vs planned (75%) - gap shows delay
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center">
                    <div
                      className={`h-3 w-3 border-2 border-white dark:border-slate-800 rounded-full shadow-sm ${
                        analysis.timelineDrift.toLowerCase().includes('ahead')
                          ? 'bg-green-500'
                          : analysis.timelineDrift.toLowerCase().includes('on track') || analysis.timelineDrift.toLowerCase().includes('on schedule')
                          ? 'bg-blue-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        marginLeft: analysis.timelineDrift.toLowerCase().includes('ahead')
                          ? '60%'
                          : analysis.timelineDrift.toLowerCase().includes('on track') || analysis.timelineDrift.toLowerCase().includes('on schedule')
                          ? '75%'
                          : '45%',
                        transform: 'translateX(-50%)'
                      }}
                    ></div>
                  </div>
                </div>
                <span className={`text-xs font-medium w-8 text-right ${
                  analysis.timelineDrift.toLowerCase().includes('ahead')
                    ? 'text-green-600 dark:text-green-400'
                    : analysis.timelineDrift.toLowerCase().includes('on track')
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {analysis.timelineDrift.toLowerCase().includes('ahead')
                    ? '60%'
                    : analysis.timelineDrift.toLowerCase().includes('on track') || analysis.timelineDrift.toLowerCase().includes('on schedule')
                    ? '75%'
                    : '45%'}
                </span>
              </div>

              {/* Behind schedule indicator */}
              {!analysis.timelineDrift.toLowerCase().includes('ahead') && !analysis.timelineDrift.toLowerCase().includes('on track') && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  ↓ 30% behind schedule
                </p>
              )}
            </div>
          </div>

          {/* Key Concerns (condensed) */}
          {analysis.keyConcerns && analysis.keyConcerns.length > 0 && (
            <div className="mb-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Key Concerns</h4>
              <ul className="space-y-1.5">
                {analysis.keyConcerns.slice(0, 3).map((concern, index) => (
                  <li key={index} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                    <span>{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Last Analysis Banner with Re-run */}
          {lastAnalysisTime && (
            <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Last analysis</p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{formatTimestamp(lastAnalysisTime)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWidgetState("config")}
                  className="ml-3 px-3 py-1.5 text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Re-run
                </button>
              </div>
            </div>
          )}

          {/* View Details Button */}
          <button
            onClick={() => {
              setWidgetState("collapsed");
              onViewDetails();
            }}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium text-sm"
          >
            View Full Analysis
          </button>
        </div>
      )}

      {widgetState === "config" && (
        // Config State - Input Form
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-5 w-96 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>⚙️</span>
              Configure Analysis
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setWidgetState(analysis ? "summary" : "collapsed")}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }} className="space-y-4">
            {/* Demo Mode Toggle */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="widgetDemoMode"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-green-300 text-green-600 focus:ring-green-500"
                />
                <div className="flex-1">
                  <label htmlFor="widgetDemoMode" className="text-xs font-medium text-green-800 dark:text-green-200 cursor-pointer">
                    Use Public Demo (Recommended)
                  </label>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                    Free • No API key needed • 5/day
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  GitHub Repository (owner/repo)
                </label>
                <Tooltip content="Format: owner/repository (e.g., facebook/react). Find this in your GitHub repo URL.">
                  <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Tooltip>
              </div>
              <input
                type="text"
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
                placeholder="octocat/Hello-World"
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                required
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  PRD File Path
                </label>
                <Tooltip content="Path to your PRD markdown file in the repository (e.g., docs/prd.md or README.md)">
                  <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Tooltip>
              </div>
              <input
                type="text"
                value={prdPath}
                onChange={(e) => setPrdPath(e.target.value)}
                placeholder="docs/prd.md"
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Issue Labels (optional)
                </label>
                <Tooltip content="Filter GitHub issues by labels (e.g., 'feature, enhancement'). Leave empty to analyze all issues.">
                  <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Tooltip>
              </div>
              <input
                type="text"
                value={issueLabels}
                onChange={(e) => setIssueLabels(e.target.value)}
                placeholder="feature, enhancement"
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  GitHub Personal Access Token
                </label>
                <Tooltip content="Create at github.com/settings/tokens. Needs 'repo' read access to fetch issues and PRD.">
                  <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Tooltip>
              </div>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Create at: github.com/settings/tokens
              </p>
            </div>

            {!demoMode && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Anthropic API Key
                  </label>
                  <Tooltip content="Get your API key at console.anthropic.com. Used for AI-powered drift analysis.">
                    <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </Tooltip>
                </div>
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-xxxxxxxxxxxx"
                  className="w-full px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!demoMode}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Get at: console.anthropic.com
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs text-red-800 dark:text-red-200 font-medium">Error</p>
                <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed font-medium text-sm transition-colors"
            >
              {loading ? `${loadingVerb}...` : "Analyse PRD Drift"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
