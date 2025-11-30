"use client";

import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="mb-8 bg-slate-900 dark:bg-slate-950 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1.5">
            PRD Drift Detector
          </h1>
          <p className="text-slate-300 dark:text-slate-400 text-sm">
            Track alignment between your PRD and what&apos;s actually being built
          </p>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
