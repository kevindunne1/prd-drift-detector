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
          Your PRD vs reality. Instant clarity on what&apos;s actually being built.
        </p>
      </div>
      <ThemeToggle />
    </header>
  );
}
