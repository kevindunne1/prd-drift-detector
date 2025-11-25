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
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
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
        return "text-green-600";
      case "in_progress":
        return "text-blue-600";
      case "partial":
        return "text-yellow-600";
      case "missing":
        return "text-red-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Metadata */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-2">Repository Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-600">Repository</p>
            <p className="font-medium text-slate-900">{metadata.repository}</p>
          </div>
          <div>
            <p className="text-slate-600">PRD Path</p>
            <p className="font-medium text-slate-900">{metadata.prdPath}</p>
          </div>
          <div>
            <p className="text-slate-600">Requirements</p>
            <p className="font-medium text-slate-900">{metadata.totalRequirements}</p>
          </div>
          <div>
            <p className="text-slate-600">Issues</p>
            <p className="font-medium text-slate-900">{metadata.totalIssues}</p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Completion</h3>
          <p className="text-3xl font-bold text-slate-900">
            {analysis.completionPercentage}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Risk Score</h3>
          <p className="text-3xl font-bold text-slate-900">
            {analysis.riskScore}/100
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-slate-600 mb-1">Timeline</h3>
          <p className="text-lg font-semibold text-slate-900">
            {analysis.timelineDrift}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Executive Summary</h3>
        <p className="text-slate-700">{analysis.summary}</p>
      </div>

      {/* Requirements Drift Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Requirements Drift Analysis</h3>
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
                    <p className="font-medium text-slate-900">
                      {drift.requirement.text}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
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

              <p className="text-sm text-slate-700 mt-2">{drift.driftDescription}</p>

              {drift.matchedIssues.length > 0 && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs text-slate-600">Matched Issues:</span>
                  {drift.matchedIssues.map((issueNum) => (
                    <a
                      key={issueNum}
                      href={`https://github.com/${metadata.repository}/issues/${issueNum}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded"
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
