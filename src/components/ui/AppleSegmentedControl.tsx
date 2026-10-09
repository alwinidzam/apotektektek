"use client";

import React from "react";

export interface SegmentOption {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface AppleSegmentedControlProps {
  options: SegmentOption[];
  activeId: string;
  onChange: (id: string) => void;
  size?: "sm" | "md";
  className?: string;
}

export const AppleSegmentedControl: React.FC<AppleSegmentedControlProps> = ({
  options,
  activeId,
  onChange,
  size = "md",
  className = "",
}) => {
  return (
    <div
      className={`inline-flex items-center p-1 bg-[#EBEBED] dark:bg-[#2C2C2E] rounded-[10px] select-none border border-black/[0.04] dark:border-white/[0.06] ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const isActive = opt.id === activeId;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.id)}
            className={`
              relative flex items-center justify-center gap-1.5 transition-all duration-200 ease-out rounded-[8px] font-medium
              ${size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3.5 py-1.5 text-[13px]"}
              ${
                isActive
                  ? "bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_0.5px_1px_rgba(0,0,0,0.06)] font-semibold"
                  : "text-[#636366] dark:text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              }
            `}
          >
            {opt.icon && <span className="opacity-80">{opt.icon}</span>}
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive
                    ? "bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white"
                    : "bg-black/5 dark:bg-white/10 text-[#8E8E93]"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
