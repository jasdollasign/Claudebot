"use client";

import { Player, ReplayData } from "@/types/replay";

function PlayerRow({
  player,
  isFocused,
  onClick,
}: {
  player: Player;
  isFocused: boolean;
  onClick: () => void;
}) {
  const kda = (
    (player.kills + player.assists) /
    Math.max(player.deaths, 1)
  ).toFixed(1);

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer transition-colors hover:bg-white/5 ${
        isFocused ? "bg-yellow-500/10 ring-1 ring-yellow-500/40" : ""
      }`}
    >
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">
            {player.championName.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-sm">{player.championName}</div>
            <div className="text-xs text-zinc-500">{player.summonerName}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-center text-sm">
        <span className="text-green-400">{player.kills}</span>
        <span className="text-zinc-500">/</span>
        <span className="text-red-400">{player.deaths}</span>
        <span className="text-zinc-500">/</span>
        <span className="text-blue-400">{player.assists}</span>
        <span className="text-zinc-500 text-xs ml-1">({kda})</span>
      </td>
      <td className="px-3 py-2 text-center text-sm text-zinc-300">
        {player.cs}{" "}
        <span className="text-zinc-500 text-xs">({player.csPerMin}/m)</span>
      </td>
      <td className="px-3 py-2 text-center text-sm text-zinc-300">
        {(player.damageToChampions / 1000).toFixed(1)}k
      </td>
      <td className="px-3 py-2 text-center text-sm text-zinc-300">
        {(player.gold / 1000).toFixed(1)}k
      </td>
      <td className="px-3 py-2 text-center text-sm text-zinc-300">
        {player.visionScore}
      </td>
    </tr>
  );
}

export default function Scoreboard({
  replay,
  onPlayerSelect,
}: {
  replay: ReplayData;
  onPlayerSelect: (name: string) => void;
}) {
  const bluePlayers = replay.players.filter((p) => p.team === "blue");
  const redPlayers = replay.players.filter((p) => p.team === "red");

  const blueKills = bluePlayers.reduce((s, p) => s + p.kills, 0);
  const redKills = redPlayers.reduce((s, p) => s + p.kills, 0);

  const headers = (
    <tr className="text-xs text-zinc-500 uppercase tracking-wider">
      <th className="px-3 py-2 text-left">Champion</th>
      <th className="px-3 py-2 text-center">KDA</th>
      <th className="px-3 py-2 text-center">CS</th>
      <th className="px-3 py-2 text-center">DMG</th>
      <th className="px-3 py-2 text-center">Gold</th>
      <th className="px-3 py-2 text-center">Vision</th>
    </tr>
  );

  return (
    <div className="space-y-4">
      {/* Blue Team */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">
        <div className="px-4 py-2 flex justify-between items-center border-b border-blue-500/20">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="font-semibold text-blue-400">Blue Team</span>
            {replay.winner === "blue" && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                VICTORY
              </span>
            )}
          </div>
          <span className="text-sm text-zinc-400">{blueKills} Kills</span>
        </div>
        <table className="w-full">
          <thead>{headers}</thead>
          <tbody>
            {bluePlayers.map((p) => (
              <PlayerRow
                key={p.summonerName}
                player={p}
                isFocused={p.summonerName === replay.focusedPlayer}
                onClick={() => onPlayerSelect(p.summonerName)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Red Team */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
        <div className="px-4 py-2 flex justify-between items-center border-b border-red-500/20">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="font-semibold text-red-400">Red Team</span>
            {replay.winner === "red" && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                VICTORY
              </span>
            )}
          </div>
          <span className="text-sm text-zinc-400">{redKills} Kills</span>
        </div>
        <table className="w-full">
          <thead>{headers}</thead>
          <tbody>
            {redPlayers.map((p) => (
              <PlayerRow
                key={p.summonerName}
                player={p}
                isFocused={p.summonerName === replay.focusedPlayer}
                onClick={() => onPlayerSelect(p.summonerName)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
