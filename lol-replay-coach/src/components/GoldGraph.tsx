"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { GoldSnapshot, GameEvent } from "@/types/replay";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function GoldGraph({
  goldTimeline,
  events,
  currentTime,
  onTimeClick,
}: {
  goldTimeline: GoldSnapshot[];
  events: GameEvent[];
  currentTime: number;
  onTimeClick: (time: number) => void;
}) {
  const data = goldTimeline.map((snap) => ({
    ...snap,
    goldDiff: snap.blueGold - snap.redGold,
    time: formatTime(snap.timestamp),
  }));

  const keyEvents = events.filter(
    (e) => e.importance === "critical" || e.importance === "high"
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">
        Gold Advantage Over Time
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={data}
          onClick={(e: Record<string, unknown> | null) => {
            const payload = e?.activePayload as Array<{ payload: { timestamp: number } }> | undefined;
            if (payload?.[0]) {
              onTimeClick(payload[0].payload.timestamp);
            }
          }}
        >
          <defs>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="redGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
          <XAxis
            dataKey="time"
            tick={{ fill: "#71717A", fontSize: 11 }}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fill: "#71717A", fontSize: 11 }}
            tickLine={false}
            tickFormatter={(v) => `${v > 0 ? "+" : ""}${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181B",
              border: "1px solid #3F3F46",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#A1A1AA" }}
            formatter={(value) => {
              const v = Number(value) || 0;
              return [`${v > 0 ? "+" : ""}${(v / 1000).toFixed(1)}k`, "Gold Diff"];
            }}
          />
          <ReferenceLine y={0} stroke="#3F3F46" />
          <Area
            type="monotone"
            dataKey="goldDiff"
            stroke="#3B82F6"
            fill="url(#blueGrad)"
            strokeWidth={2}
          />
          {keyEvents.map((evt, i) => (
            <ReferenceLine
              key={i}
              x={formatTime(evt.timestamp)}
              stroke={evt.importance === "critical" ? "#FBBF24" : "#6B7280"}
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          Blue advantage
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          Red advantage
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 bg-yellow-500" />
          Key events
        </div>
      </div>
    </div>
  );
}
