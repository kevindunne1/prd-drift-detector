"use client";

import { useState } from "react";
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

type ViewMode = "cards" | "table";
type StatusFilter = "delivered" | "in_progress" | "partial" | "missing";

export default function DriftDashboard({ analysis, metadata }: DriftDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([
    "delivered",
    "in_progress",
    "partial",
    "missing",
  ]);
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

  const toggleStatusFilter = (status: StatusFilter) => {
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const filteredRequirements = analysis.requirementsDrift.filter((drift) =>
    statusFilters.includes(drift.status as StatusFilter)
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700";
      case "in_progress":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700";
      case "partial":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700";
      case "missing":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700";
      default:
        return "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600";
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Requirements Drift Analysis ({filteredRequirements.length} of {analysis.requirementsDrift.length})
          </h3>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === "cards"
                  ? "bg-blue-600 dark:bg-blue-500 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-blue-600 dark:bg-blue-500 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
              }`}
            >
              Table
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 self-center">Filter:</span>
          {[
            { status: "delivered" as StatusFilter, label: "Delivered", icon: "✅" },
            { status: "in_progress" as StatusFilter, label: "In Progress", icon: "🔄" },
            { status: "partial" as StatusFilter, label: "Partial", icon: "⚠️" },
            { status: "missing" as StatusFilter, label: "Missing", icon: "❌" },
          ].map(({ status, label, icon }) => (
            <button
              key={status}
              onClick={() => toggleStatusFilter(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                statusFilters.includes(status)
                  ? getStatusBadgeColor(status)
                  : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600 opacity-50"
              }`}
            >
              <span className="mr-1">{icon}</span>
              {label}
            </button>
          ))}
          {statusFilters.length === 0 && (
            <span className="text-sm text-slate-500 dark:text-slate-400 italic self-center">
              (Select at least one filter to view requirements)
            </span>
          )}
        </div>

        {/* Cards View */}
        {viewMode === "cards" && (
          <div className="space-y-4">
            {filteredRequirements.map((drift, index) => (
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
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-2 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="text-left py-3 px-2 font-semibold text-slate-700 dark:text-slate-300">Requirement</th>
                  <th className="text-left py-3 px-2 font-semibold text-slate-700 dark:text-slate-300">Drift Description</th>
                  <th className="text-left py-3 px-2 font-semibold text-slate-700 dark:text-slate-300">Risk</th>
                  <th className="text-left py-3 px-2 font-semibold text-slate-700 dark:text-slate-300">Issues</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequirements.map((drift, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="py-3 px-2">
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{getStatusIcon(drift.status)}</span>
                        <span className={`text-xs font-medium ${getStatusColor(drift.status)}`}>
                          {drift.status.replace("_", " ").toUpperCase()}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <p className="font-medium text-slate-900 dark:text-white">{drift.requirement.text}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Section: {drift.requirement.section}
                      </p>
                    </td>
                    <td className="py-3 px-2 text-slate-700 dark:text-slate-300">
                      {drift.driftDescription}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRiskColor(
                          drift.riskLevel
                        )}`}
                      >
                        {drift.riskLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {drift.matchedIssues.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
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
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRequirements.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No requirements match the selected filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
