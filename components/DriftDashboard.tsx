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

const getRiskLevel = (score: number) => {
  if (score >= 70) return { label: "High Risk", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" };
  if (score >= 40) return { label: "Moderate Risk", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" };
  return { label: "Low Risk", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" };
};

type ViewMode = "cards" | "table";
type StatusFilter = "delivered" | "in_progress" | "partial" | "missing" | "out_of_scope";

export default function DriftDashboard({ analysis, metadata }: DriftDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([
    "delivered",
    "in_progress",
    "partial",
    "missing",
    "out_of_scope",
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
      case "out_of_scope":
        return "⊗";
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
      case "out_of_scope":
        return "text-slate-600 dark:text-slate-400";
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
      case "out_of_scope":
        return "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600";
      default:
        return "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600";
    }
  };

  // Open requirements = in_progress + partial + missing (excluding delivered and out_of_scope)
  const openRequirements = analysis.requirementsDrift.filter(r =>
    r.status === "in_progress" || r.status === "partial" || r.status === "missing"
  ).length;
  const totalRequirements = analysis.requirementsDrift.length;

  return (
    <div className="space-y-6">
      {/* Repository Analysis Section */}
      <div className="space-y-4">
        {/* Section Header with Repository Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Repository Analysis</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {metadata.repository} • {metadata.prdPath}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Requirements</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {openRequirements}
              <span className="text-base text-slate-500 dark:text-slate-400 font-normal">/{totalRequirements}</span>
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Completion Card with Circular Gauge */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/50 p-6">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">Completion</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90" width="128" height="128">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-200 dark:text-slate-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={
                    analysis.completionPercentage >= 80
                      ? "#10b981"
                      : analysis.completionPercentage >= 50
                      ? "#f59e0b"
                      : "#ef4444"
                  }
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(analysis.completionPercentage / 100) * 351.86} 351.86`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">
                  {analysis.completionPercentage}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Score Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/50 p-6">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">Overall Risk Score</h3>
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <p className="text-5xl font-bold text-slate-900 dark:text-white">
              {analysis.riskScore}
              <span className="text-2xl text-slate-500 dark:text-slate-400">/100</span>
            </p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRiskLevel(analysis.riskScore).color}`}>
              {getRiskLevel(analysis.riskScore).label}
            </span>
          </div>
        </div>

        {/* Timeline Card with Planned vs Actual */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/50 p-6">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">Timeline Status</h3>
          <div className="space-y-3">
            {/* Timeline Summary - warning icons without box */}
            {analysis.weeksBehind > 0 || analysis.featuresBlocked > 0 ? (
              <div className="space-y-2 mb-3">
                {analysis.weeksBehind > 0 && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-medium">{analysis.weeksBehind} {analysis.weeksBehind === 1 ? 'week' : 'weeks'} behind schedule</span>
                  </div>
                )}
                {analysis.featuresBlocked > 0 && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-medium">{analysis.featuresBlocked} {analysis.featuresBlocked === 1 ? 'feature' : 'features'} blocked</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Planned Position */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 w-16">Planned</span>
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
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-10 text-right">75%</span>
            </div>

            {/* Actual Position */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 w-16">Actual</span>
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
                      : '45%'
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
              <span className={`text-xs font-medium w-10 text-right ${
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
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Executive Summary</h3>

        <div className="space-y-4">
          {/* Risk-colored alert with summary */}
          <div className={`flex items-start gap-3 p-4 border rounded-lg ${
            analysis.riskScore >= 70
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : analysis.riskScore >= 40
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }`}>
            <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              analysis.riskScore >= 70
                ? 'text-red-600 dark:text-red-400'
                : analysis.riskScore >= 40
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-green-600 dark:text-green-400'
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className={`text-sm leading-relaxed ${
              analysis.riskScore >= 70
                ? 'text-red-900 dark:text-red-100'
                : analysis.riskScore >= 40
                ? 'text-amber-900 dark:text-amber-100'
                : 'text-green-900 dark:text-green-100'
            }`}>
              {analysis.summary}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            {analysis.weeksBehind > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Behind Schedule</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{analysis.weeksBehind}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {analysis.weeksBehind === 1 ? 'week behind' : 'weeks behind'} planned timeline
                </p>
              </div>
            )}

            {analysis.featuresBlocked > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">At Risk</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{analysis.featuresBlocked}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {analysis.featuresBlocked === 1 ? 'feature' : 'features'} blocked or incomplete
                </p>
              </div>
            )}
          </div>

          {/* Key Concerns */}
          {analysis.keyConcerns && analysis.keyConcerns.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Key Concerns</h4>
              <ul className="space-y-2">
                {analysis.keyConcerns.map((concern, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                    <span>{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
            { status: "out_of_scope" as StatusFilter, label: "Out of Scope", icon: "⊗" },
          ].map(({ status, label, icon }) => {
            const count = analysis.requirementsDrift.filter((r) => r.status === status).length;
            return (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  statusFilters.includes(status)
                    ? getStatusBadgeColor(status)
                    : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600 opacity-50"
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
                <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-slate-900/10 dark:bg-black/20">
                  {count}
                </span>
              </button>
            );
          })}
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
