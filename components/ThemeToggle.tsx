"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm
        transition-all duration-300 ease-in-out border-2
        ${theme === "light"
          ? "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
          : "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
        }
      `}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {/* Sun Icon - Light Mode */}
      <svg
        className={`w-5 h-5 transition-all duration-300 ${
          theme === "light" ? "text-yellow-500 scale-100" : "text-slate-500 scale-75 opacity-40"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* Mode Label */}
      <span className="font-semibold uppercase text-xs tracking-wide">
        {theme === "light" ? "Light Mode" : "Dark Mode"}
      </span>

      {/* Moon Icon - Dark Mode */}
      <svg
        className={`w-5 h-5 transition-all duration-300 ${
          theme === "dark" ? "text-blue-400 scale-100" : "text-slate-400 scale-75 opacity-40"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  );
}
