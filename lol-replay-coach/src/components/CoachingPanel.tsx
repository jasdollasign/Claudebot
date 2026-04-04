"use client";

import { CoachingInsight } from "@/types/replay";

const categoryIcons: Record<string, string> = {
  cs: "\uD83C\uDF3E",
  vision: "\uD83D\uDC41\uFE0F",
  positioning: "\uD83C\uDFAF",
  objective: "\uD83C\uDFC6",
  trading: "\u2694\uFE0F",
  macro: "\uD83D\uDDFA\uFE0F",
  teamfight: "\uD83D\uDCA5",
  itemization: "\uD83D\uDEE1\uFE0F",
};

const severityStyles: Record<
  string,
  { bg: string; border: string; icon: string; label: string }
> = {
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "\uD83D\uDED1",
    label: "Critical",
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    icon: "\u26A0\uFE0F",
    label: "Improve",
  },
  info: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: "\u2705",
    label: "Good",
  },
};

export default function CoachingPanel({
  insights,
  onTimestampClick,
}: {
  insights: CoachingInsight[];
  onTimestampClick?: (time: number) => void;
}) {
  const criticals = insights.filter((i) => i.severity === "critical");
  const warnings = insights.filter((i) => i.severity === "warning");
  const infos = insights.filter((i) => i.severity === "info");

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">
          AI Coach Analysis
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-red-400">{criticals.length} critical</span>
          <span className="text-yellow-400">{warnings.length} to improve</span>
          <span className="text-green-400">{infos.length} good</span>
        </div>
      </div>

      <div className="divide-y divide-zinc-800/50 max-h-[600px] overflow-y-auto">
        {insights.map((insight, i) => {
          const style = severityStyles[insight.severity];
          return (
            <div
              key={i}
              className={`p-4 ${style.bg} transition-colors hover:bg-white/[0.02]`}
            >
              <div className="flex items-start gap-3">
                <div className="text-lg mt-0.5 flex-shrink-0">
                  {categoryIcons[insight.category]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${style.border} text-zinc-400`}
                    >
                      {style.icon} {style.label}
                    </span>
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                      {insight.category}
                    </span>
                    {insight.timestamp && onTimestampClick && (
                      <button
                        onClick={() => onTimestampClick(insight.timestamp!)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-mono"
                      >
                        @{Math.floor(insight.timestamp / 60)}:
                        {(insight.timestamp % 60).toString().padStart(2, "0")}
                      </button>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-zinc-200">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {insight.description}
                  </p>
                  <div className="mt-2 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      <span className="text-yellow-400 font-medium">
                        Suggestion:
                      </span>{" "}
                      {insight.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
