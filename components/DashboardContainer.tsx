"use client";

import { useState } from "react";
import ConfigForm from "./ConfigForm";
import DriftDashboard from "./DriftDashboard";
import { OverallAnalysis } from "@/lib/claude";

export default function DashboardContainer() {
  const [analysis, setAnalysis] = useState<OverallAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  const handleAnalyze = async (config: {
    githubToken: string;
    anthropicKey: string;
    repository: string;
    prdPath: string;
    issueLabels: string[];
  }) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to analyze");
      }

      setAnalysis(result.data.analysis);
      setMetadata({
        repository: result.data.repository,
        prdPath: result.data.prdPath,
        totalRequirements: result.data.totalRequirements,
        totalIssues: result.data.totalIssues,
      });
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ConfigForm onAnalyze={handleAnalyze} loading={loading} />

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {analysis && metadata && (
        <DriftDashboard analysis={analysis} metadata={metadata} />
      )}
    </div>
  );
}
