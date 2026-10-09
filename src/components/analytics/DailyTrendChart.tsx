"use client";

import React, { useState, useId } from "react";
import { DailyRevenueMetric } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { Calendar, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

interface DailyTrendChartProps {
  data: DailyRevenueMetric[];
  privacyMode?: boolean;
}

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({
  data,
  privacyMode = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [rangeMode, setRangeMode] = useState<"14_DAYS" | "30_DAYS">("14_DAYS");
  const uniqueId = useId();

  const displayData = rangeMode === "14_DAYS" ? data.slice(-14) : data.slice(-30);
  const hoveredItem = hoveredIndex !== null ? displayData[hoveredIndex] : displayData[displayData.length - 1];

  const maxVal = Math.max(...displayData.map((d) => Math.max(d.netRevenue, d.targetDaily)), 5000000);
  const chartHeight = 240;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 24;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // Coordinate mapper
  const getX = (index: number) => {
    if (displayData.length <= 1) return paddingX + innerWidth / 2;
    return paddingX + (index / (displayData.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const ratio = Math.min(1, Math.max(0, val / maxVal));
    return paddingY + innerHeight - ratio * innerHeight;
  };

  // Moving average line path
  const linePoints = displayData.map((d, i) => `${getX(i)},${getY(d.movingAverage7Day)}`).join(" ");

  // Target line coordinate
  const targetY = getY(displayData[0]?.targetDaily || 4500000);

  const renderAmount = (amount: number, color = "text-[#1C1C1E] dark:text-white") => {
    if (privacyMode) return <span className="font-mono text-[#8E8E93]">••••••••</span>;
    return <span className={`tabular-nums font-bold ${color}`}>{formatRupiah(amount)}</span>;
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
      {/* Header with Title and Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[8px] bg-teal-50 dark:bg-teal-950/50 text-[#008B94]">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="text-[17px] font-bold text-[#1C1C1E] dark:text-white">
              Tren Pendapatan & Laba Kotor Harian
            </h3>
          </div>
          <p className="text-[12px] text-[#8E8E93] mt-0.5">
            Analisis omzet per hari terhadap target harian & garis rata-rata bergerak 7-hari (7-Day Moving Average)
          </p>
        </div>

        {/* Range Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-[12px] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setRangeMode("14_DAYS")}
            className={`px-3 py-1 text-[12px] font-semibold rounded-[9px] transition-all ${
              rangeMode === "14_DAYS"
                ? "bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white shadow-sm"
                : "text-[#8E8E93] hover:text-[#1C1C1E]"
            }`}
          >
            14 Hari
          </button>
          <button
            type="button"
            onClick={() => setRangeMode("30_DAYS")}
            className={`px-3 py-1 text-[12px] font-semibold rounded-[9px] transition-all ${
              rangeMode === "30_DAYS"
                ? "bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white shadow-sm"
                : "text-[#8E8E93] hover:text-[#1C1C1E]"
            }`}
          >
            30 Hari
          </button>
        </div>
      </div>

      {/* Active Point Highlight Bar */}
      {hoveredItem && (
        <div className="p-3.5 rounded-[14px] bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1C1C1E] dark:text-white">
              {hoveredItem.dayNameIndo}, {new Date(hoveredItem.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}:
            </span>
            <span className="text-[#008B94] font-bold text-[14px]">
              {renderAmount(hoveredItem.netRevenue, "text-[#008B94]")}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[#8E8E93]">
            <span>Laba Kotor: <strong className="text-emerald-600 dark:text-emerald-400">{renderAmount(hoveredItem.grossProfit)}</strong></span>
            <span>HPP: {renderAmount(hoveredItem.totalHPP)}</span>
            <span>{hoveredItem.transactionCount} Transaksi</span>
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                hoveredItem.targetAchievedPercent >= 100
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {hoveredItem.targetAchievedPercent >= 100 ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              {hoveredItem.targetAchievedPercent}% Target
            </span>
          </div>
        </div>
      )}

      {/* SVG Interactive Chart Canvas */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[640px]">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-[240px] overflow-visible select-none"
          >
            <defs>
              <linearGradient id={`dailyBarGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#008B94" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#008B94" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            {/* Background Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const yVal = paddingY + innerHeight - ratio * innerHeight;
              const nominal = Math.round(ratio * maxVal);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={yVal}
                    x2={chartWidth - paddingX}
                    y2={yVal}
                    stroke="currentColor"
                    strokeOpacity={0.07}
                    strokeDasharray={ratio > 0 ? "3 3" : undefined}
                  />
                  <text
                    x={paddingX - 8}
                    y={yVal + 3}
                    textAnchor="end"
                    className="text-[9px] fill-[#8E8E93] font-mono"
                  >
                    {(nominal / 1000000).toFixed(1)}M
                  </text>
                </g>
              );
            })}

            {/* Target Horizontal Line */}
            <g>
              <line
                x1={paddingX}
                y1={targetY}
                x2={chartWidth - paddingX}
                y2={targetY}
                stroke="#FF9500"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                strokeOpacity={0.7}
              />
              <text
                x={chartWidth - paddingX}
                y={targetY - 5}
                textAnchor="end"
                className="text-[9px] fill-[#FF9500] font-semibold"
              >
                Target Harian (4.5M)
              </text>
            </g>

            {/* Daily Bars */}
            {displayData.map((d, i) => {
              const xCenter = getX(i);
              const barWidth = Math.max(8, Math.min(22, (innerWidth / displayData.length) * 0.55));
              const barH = ((d.netRevenue / maxVal) * innerHeight);
              const barY = paddingY + innerHeight - barH;
              const isHovered = hoveredIndex === i;

              return (
                <g
                  key={d.date}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <rect
                    x={xCenter - barWidth / 2}
                    y={barY}
                    width={barWidth}
                    height={Math.max(2, barH)}
                    rx={4}
                    fill={isHovered ? "#00767E" : `url(#dailyBarGrad-${uniqueId})`}
                    className="transition-all duration-200"
                  />
                  {/* Date label */}
                  {(i % (rangeMode === "30_DAYS" ? 3 : 1) === 0 || isHovered) && (
                    <text
                      x={xCenter}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      className={`text-[9px] font-mono ${
                        isHovered ? "fill-[#008B94] font-bold" : "fill-[#8E8E93]"
                      }`}
                    >
                      {d.date.split("-")[2]}/{d.date.split("-")[1]}
                    </text>
                  )}
                </g>
              );
            })}

            {/* 7-Day Moving Average Line */}
            <polyline
              fill="none"
              stroke="#007AFF"
              strokeWidth={2}
              points={linePoints}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Point Dots on Line */}
            {displayData.map((d, i) => {
              const cx = getX(i);
              const cy = getY(d.movingAverage7Day);
              const isHovered = hoveredIndex === i;

              return (
                <circle
                  key={`dot-${d.date}`}
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 4.5 : 2.5}
                  fill={isHovered ? "#007AFF" : "#FFFFFF"}
                  stroke="#007AFF"
                  strokeWidth={1.5}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-[11px] text-[#8E8E93]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-[#008B94]" />
            <span>Omzet Harian (Bar)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#007AFF]" />
            <span>Rata-Rata 7-Hari (MA)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-[#FF9500]" />
            <span>Target Harian</span>
          </span>
        </div>

        <span>Arahkan kursor ke grafik untuk rincian harian</span>
      </div>
    </div>
  );
};
