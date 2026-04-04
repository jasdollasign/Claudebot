"use client";

import { GameEvent } from "@/types/replay";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const eventIcons: Record<string, string> = {
  KILL: "\u2694\uFE0F",
  DEATH: "\uD83D\uDC80",
  ASSIST: "\uD83E\uDD1D",
  DRAGON: "\uD83D\uDC09",
  BARON: "\uD83D\uDC1B",
  TOWER: "\uD83C\uDFF0",
  INHIBITOR: "\uD83D\uDEA7",
  RIFT_HERALD: "\uD83D\uDC1A",
  TEAM_FIGHT: "\u2694\uFE0F",
  OBJECTIVE_CONTEST: "\u26A0\uFE0F",
  WARD_PLACED: "\uD83D\uDCA1",
  WARD_KILLED: "\uD83D\uDEAB",
};

const importanceColors: Record<string, string> = {
  low: "border-zinc-700",
  medium: "border-zinc-600",
  high: "border-yellow-500/50",
  critical: "border-red-500/50",
};

const importanceBg: Record<string, string> = {
  low: "bg-zinc-900/50",
  medium: "bg-zinc-900/80",
  high: "bg-yellow-500/5",
  critical: "bg-red-500/5",
};

export default function Timeline({
  events,
  currentTime,
  onEventClick,
  filter,
}: {
  events: GameEvent[];
  currentTime: number;
  onEventClick: (time: number) => void;
  filter: string;
}) {
  const filtered =
    filter === "all"
      ? events
      : filter === "key"
        ? events.filter(
            (e) => e.importance === "high" || e.importance === "critical"
          )
        : events.filter((e) => e.type === filter);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-300">Game Timeline</h3>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">
            No events match the current filter.
          </p>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {filtered.map((event, i) => (
              <button
                key={i}
                onClick={() => onEventClick(event.timestamp)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-white/5 ${
                  importanceBg[event.importance]
                } ${
                  Math.abs(currentTime - event.timestamp) < 30
                    ? "ring-1 ring-inset ring-yellow-500/30"
                    : ""
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-lg">{eventIcons[event.type]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-500">
                      {formatTime(event.timestamp)}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${importanceColors[event.importance]} text-zinc-400`}
                    >
                      {event.importance}
                    </span>
                    {event.team && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          event.team === "blue" ? "bg-blue-500" : "bg-red-500"
                        }`}
                      />
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 mt-0.5 truncate">
                    {event.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
