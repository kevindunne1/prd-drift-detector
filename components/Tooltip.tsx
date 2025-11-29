"use client";

import { ReactNode, useState } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-800 dark:border-t-slate-700",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 dark:border-b-slate-700",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-800 dark:border-l-slate-700",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-800 dark:border-r-slate-700",
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}>
          <div className="bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-md px-3 py-2 whitespace-nowrap shadow-lg">
            {content}
            <div
              className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
