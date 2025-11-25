"use client";

import { OverallAnalysis } from "@/lib/claude";

interface DriftDashboardProps {
  analysis: OverallAnalysis;
  metadata: {
    repository: string;
    prdPath: string;
    totalRequirements: number;
    totalIssues: number;
  };
}

export default function DriftDashboard({ analysis, metadata }: DriftDashboardProps) {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800";
      case "high":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800";
      default:
        return "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return "✅";
      case "in_progress":
        return "🔄";
      case "partial":
        return "⚠️";
      case "missing":
        return "❌";
      default:
        return "❓";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600 dark:text-green-400";
      case "in_progress":
        return "text-blue-600 dark:text-blue-400";
      case "partial":
        return "text-yellow-600 dark:text-yellow-400";
      case "missing":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Metadata */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Repository Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-600 dark:text-slate-400">Repository</p>
            <p className="font-medium text-slate-900 dark:text-white">{metadata.repository}</p>
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-400">PRD Path</p>
            <p className="font-medium text-slate-900 dark:text-white">{metadata.prdPath}</p>
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-400">Requirements</p>
            <p className="font-medium text-slate-900 dark:text-white">{metadata.totalRequirements}</p>
          </div>
          <div>
            <p className="text-slate-600 dark:text-slate-400">Issues</p>
            <p className="font-medium text-slate-900 dark:text-white">{metadata.totalIssues}</p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/50 p-6 border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Completion</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {analysis.completionPercentage}%
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/50 p-6 border-l-4 border-orange-500">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Risk Score</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {analysis.riskScore}/100
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/50 p-6 border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Timeline</h3>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {analysis.timelineDrift}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Executive Summary</h3>
        <p className="text-slate-700 dark:text-slate-300">{analysis.summary}</p>
      </div>

      {/* Requirements Drift Details */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Requirements Drift Analysis</h3>
        <div className="space-y-4">
          {analysis.requirementsDrift.map((drift, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg ${getRiskColor(drift.riskLevel)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start space-x-2 flex-1">
                  <span className="text-2xl">{getStatusIcon(drift.status)}</span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {drift.requirement.text}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Section: {drift.requirement.section}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                    drift.status
                  )}`}
                >
                  {drift.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{drift.driftDescription}</p>

              {drift.matchedIssues.length > 0 && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Matched Issues:</span>
                  {drift.matchedIssues.map((issueNum) => (
                    <a
                      key={issueNum}
                      href={`https://github.com/${metadata.repository}/issues/${issueNum}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-2 py-1 rounded"
                    >
                      #{issueNum}
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-2 flex items-center space-x-2">
                <span className="text-xs font-medium">Risk:</span>
                <span className="text-xs">{drift.riskLevel.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
