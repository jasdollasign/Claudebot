"use client";

import { Player, ReplayData } from "@/types/replay";
import { getOverallGrade } from "@/lib/coaching-engine";

function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300 font-mono">
          {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function PlayerCard({
  player,
  replay,
}: {
  player: Player;
  replay: ReplayData;
}) {
  const grade = getOverallGrade(player, replay);
  const kda = (
    (player.kills + player.assists) /
    Math.max(player.deaths, 1)
  ).toFixed(2);
  const won = replay.winner === player.team;

  const maxDmg = Math.max(...replay.players.map((p) => p.damageToChampions));
  const maxGold = Math.max(...replay.players.map((p) => p.gold));
  const maxVision = Math.max(...replay.players.map((p) => p.visionScore));
  const maxCS = Math.max(...replay.players.map((p) => p.cs));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-indigo-500/20">
            {player.championName.charAt(0)}
            {player.championName.charAt(1)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {player.championName}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">
                {player.summonerName}
              </span>
              <span className="text-xs text-zinc-600">|</span>
              <span className="text-xs text-zinc-500">{player.role}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  won
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {won ? "WIN" : "LOSS"}
              </span>
            </div>
          </div>
        </div>

        {/* Grade */}
        <div className="text-center">
          <div
            className="text-4xl font-black"
            style={{ color: grade.color }}
          >
            {grade.grade}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {grade.summary}
          </div>
        </div>
      </div>

      {/* KDA Strip */}
      <div className="flex items-center justify-center gap-1 py-3 rounded-lg bg-zinc-800/50 mb-4">
        <span className="text-2xl font-bold text-green-400">
          {player.kills}
        </span>
        <span className="text-xl text-zinc-600">/</span>
        <span className="text-2xl font-bold text-red-400">
          {player.deaths}
        </span>
        <span className="text-xl text-zinc-600">/</span>
        <span className="text-2xl font-bold text-blue-400">
          {player.assists}
        </span>
        <span className="text-sm text-zinc-500 ml-2">
          {kda} KDA
        </span>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <StatBar label="Damage to Champions" value={player.damageToChampions} max={maxDmg} color="#EF4444" />
        <StatBar label="Gold Earned" value={player.gold} max={maxGold} color="#F59E0B" />
        <StatBar label="CS" value={player.cs} max={maxCS} color="#22C55E" />
        <StatBar label="Vision Score" value={player.visionScore} max={maxVision} color="#3B82F6" />
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="text-center p-2 rounded-lg bg-zinc-800/30">
          <div className="text-xs text-zinc-500">CS/min</div>
          <div className="text-sm font-semibold text-zinc-200">
            {player.csPerMin}
          </div>
        </div>
        <div className="text-center p-2 rounded-lg bg-zinc-800/30">
          <div className="text-xs text-zinc-500">Gold/min</div>
          <div className="text-sm font-semibold text-zinc-200">
            {player.goldPerMin}
          </div>
        </div>
        <div className="text-center p-2 rounded-lg bg-zinc-800/30">
          <div className="text-xs text-zinc-500">Dmg Taken</div>
          <div className="text-sm font-semibold text-zinc-200">
            {(player.damageTaken / 1000).toFixed(1)}k
          </div>
        </div>
        <div className="text-center p-2 rounded-lg bg-zinc-800/30">
          <div className="text-xs text-zinc-500">Wards Placed</div>
          <div className="text-sm font-semibold text-zinc-200">
            {player.wardsPlaced}
          </div>
        </div>
        <div className="text-center p-2 rounded-lg bg-zinc-800/30">
          <div className="text-xs text-zinc-500">Wards Killed</div>
          <div className="text-sm font-semibold text-zinc-200">
            {player.wardsKilled}
          </div>
        </div>
        <div className="text-center p-2 rounded-lg bg-zinc-800/30">
          <div className="text-xs text-zinc-500">Level</div>
          <div className="text-sm font-semibold text-zinc-200">
            {player.level}
          </div>
        </div>
      </div>

      {/* Runes & Spells */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
        <div className="text-xs text-zinc-500">
          <span className="text-zinc-400">{player.runes.primary}</span> +{" "}
          <span className="text-zinc-400">{player.runes.secondary}</span>
        </div>
        <div className="text-xs text-zinc-500">
          {player.spells[0]} / {player.spells[1]}
        </div>
      </div>
    </div>
  );
}
