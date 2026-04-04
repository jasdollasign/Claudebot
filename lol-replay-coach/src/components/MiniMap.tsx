"use client";

import { GameEvent } from "@/types/replay";

export default function MiniMap({
  events,
  currentTime,
}: {
  events: GameEvent[];
  currentTime: number;
}) {
  // Show events within 60 seconds of current time
  const visibleEvents = events.filter(
    (e) =>
      e.position &&
      e.timestamp <= currentTime &&
      e.timestamp >= currentTime - 60
  );

  const eventColors: Record<string, string> = {
    KILL: "#22C55E",
    DEATH: "#EF4444",
    DRAGON: "#F59E0B",
    BARON: "#A855F7",
    TOWER: "#3B82F6",
    INHIBITOR: "#EC4899",
    RIFT_HERALD: "#06B6D4",
    TEAM_FIGHT: "#F97316",
    OBJECTIVE_CONTEST: "#FBBF24",
    WARD_PLACED: "#6EE7B7",
    WARD_KILLED: "#F87171",
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">
        Map View
      </h3>
      <div className="relative aspect-square w-full max-w-[350px] mx-auto rounded-lg overflow-hidden">
        {/* Map background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(135deg, #1a2332 0%, #0f1923 50%, #1a2332 100%)
            `,
          }}
        >
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {/* Grid */}
            {[20, 40, 60, 80].map((v) => (
              <g key={v}>
                <line
                  x1={v} y1={0} x2={v} y2={100}
                  stroke="#1E3A5F" strokeWidth="0.3" strokeDasharray="2 2"
                />
                <line
                  x1={0} y1={v} x2={100} y2={v}
                  stroke="#1E3A5F" strokeWidth="0.3" strokeDasharray="2 2"
                />
              </g>
            ))}

            {/* River */}
            <path
              d="M 0 100 Q 30 70, 50 50 Q 70 30, 100 0"
              fill="none"
              stroke="#1E4D6E"
              strokeWidth="8"
              opacity="0.3"
            />

            {/* Lanes */}
            <line x1={5} y1={5} x2={5} y2={95} stroke="#2A3F55" strokeWidth="2" opacity="0.5" />
            <line x1={5} y1={95} x2={95} y2={95} stroke="#2A3F55" strokeWidth="2" opacity="0.5" />
            <line x1={5} y1={5} x2={95} y2={5} stroke="#2A3F55" strokeWidth="2" opacity="0.5" />
            <line x1={95} y1={5} x2={95} y2={95} stroke="#2A3F55" strokeWidth="2" opacity="0.5" />
            <line x1={5} y1={5} x2={95} y2={95} stroke="#2A3F55" strokeWidth="1.5" opacity="0.3" />

            {/* Blue base */}
            <rect x={1} y={88} width={10} height={10} rx={2} fill="#1D4ED8" opacity="0.4" />
            <text x={6} y={94} textAnchor="middle" fill="#60A5FA" fontSize="3" fontWeight="bold">
              BLUE
            </text>

            {/* Red base */}
            <rect x={89} y={1} width={10} height={10} rx={2} fill="#B91C1C" opacity="0.4" />
            <text x={94} y={7} textAnchor="middle" fill="#F87171" fontSize="3" fontWeight="bold">
              RED
            </text>

            {/* Dragon pit */}
            <circle cx={48} cy={68} r={4} fill="#F59E0B" opacity="0.15" stroke="#F59E0B" strokeWidth="0.5" />
            <text x={48} y={69} textAnchor="middle" fill="#F59E0B" fontSize="3" opacity="0.6">
              D
            </text>

            {/* Baron pit */}
            <circle cx={48} cy={32} r={4} fill="#A855F7" opacity="0.15" stroke="#A855F7" strokeWidth="0.5" />
            <text x={48} y={33} textAnchor="middle" fill="#A855F7" fontSize="3" opacity="0.6">
              B
            </text>

            {/* Event markers */}
            {visibleEvents.map((event, i) => {
              const opacity =
                1 - (currentTime - event.timestamp) / 60;
              const color = eventColors[event.type] ?? "#FFFFFF";
              return (
                <g key={i}>
                  <circle
                    cx={event.position!.x}
                    cy={event.position!.y}
                    r={event.importance === "critical" ? 3.5 : 2.5}
                    fill={color}
                    opacity={Math.max(opacity, 0.3) * 0.8}
                  />
                  <circle
                    cx={event.position!.x}
                    cy={event.position!.y}
                    r={event.importance === "critical" ? 5 : 3.5}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.5"
                    opacity={Math.max(opacity, 0.2) * 0.5}
                  >
                    <animate
                      attributeName="r"
                      from={event.importance === "critical" ? "3.5" : "2.5"}
                      to={event.importance === "critical" ? "7" : "5"}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.5"
                      to="0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-500">
        {Object.entries(eventColors)
          .filter(([type]) =>
            ["KILL", "DRAGON", "BARON", "TOWER", "TEAM_FIGHT"].includes(type)
          )
          .map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {type.replace("_", " ")}
            </div>
          ))}
      </div>
    </div>
  );
}
