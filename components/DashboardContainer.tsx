"use client";

import { useState } from "react";
import ConfigForm from "./ConfigForm";
import DriftDashboard from "./DriftDashboard";
import FloatingSummary from "./FloatingSummary";
import { OverallAnalysis } from "@/lib/claude";

export default function DashboardContainer() {
  const [analysis, setAnalysis] = useState<OverallAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  const handleAnalysisComplete = (newAnalysis: OverallAnalysis, newMetadata: any) => {
    setAnalysis(newAnalysis);
    setMetadata(newMetadata);
  };

  const handleAnalyze = async (config: {
    githubToken: string;
    anthropicKey: string;
    repository: string;
    prdPath: string;
    issueLabels: string[];
    usePublicAPI: boolean;
  }) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Choose endpoint based on usePublicAPI flag
      const endpoint = config.usePublicAPI ? "/api/analyze-public" : "/api/analyze";

      // Prepare request body (exclude anthropicKey if using public API)
      const requestBody = config.usePublicAPI
        ? {
            githubToken: config.githubToken,
            repository: config.repository,
            prdPath: config.prdPath,
            issueLabels: config.issueLabels,
          }
        : config;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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

      setAnalysis(result.data.analysis);
      setMetadata({
        repository: result.data.repository,
        prdPath: result.data.prdPath,
        totalRequirements: result.data.totalRequirements,
        totalIssues: result.data.totalIssues,
      });

      // Save successful config to localStorage for re-run
      if (typeof window !== "undefined") {
        localStorage.setItem("lastAnalysisConfig", JSON.stringify(config));
        localStorage.setItem("lastAnalysisTimestamp", new Date().toISOString());
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    // Scroll to top of page to see full dashboard
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configuration Form (sticky on desktop) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="lg:sticky lg:top-8">
            <ConfigForm onAnalyze={handleAnalyze} loading={loading} />

            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-medium">Error</p>
                <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results Dashboard */}
        <div className="lg:col-span-7 xl:col-span-8">
          {analysis && metadata ? (
            <DriftDashboard analysis={analysis} metadata={metadata} />
          ) : (
            <div className="hidden lg:flex items-center justify-center h-96 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="mt-4 text-slate-600 dark:text-slate-300 font-medium">Analysis results will appear here</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Configure and run your first drift analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Summary Widget - Always Visible */}
      <FloatingSummary
        analysis={analysis}
        onAnalysisComplete={handleAnalysisComplete}
        onViewDetails={handleViewDetails}
      />
    </>
  );
}
