"use client";

import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          PRD Drift Detector
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Real-time tracking of PRD-to-delivery alignment using GitHub Issues and Claude AI
        </p>
      </div>
      <ThemeToggle />
    </header>
  );
}
