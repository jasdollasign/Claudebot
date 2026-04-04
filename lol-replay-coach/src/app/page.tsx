"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ReplayData } from "@/types/replay";
import { analyzeReplay } from "@/lib/coaching-engine";
import { sampleReplay } from "@/lib/sample-data";
import ReplayUpload from "@/components/ReplayUpload";
import PlayerCard from "@/components/PlayerCard";
import Scoreboard from "@/components/Scoreboard";
import GoldGraph from "@/components/GoldGraph";
import Timeline from "@/components/Timeline";
import MiniMap from "@/components/MiniMap";
import CoachingPanel from "@/components/CoachingPanel";
import TimeSlider from "@/components/TimeSlider";

type Tab = "overview" | "coaching" | "timeline" | "scoreboard";

export default function Home() {
  const [replay, setReplay] = useState<ReplayData | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [eventFilter, setEventFilter] = useState("all");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const focusedPlayer = replay?.players.find(
    (p) => p.summonerName === replay.focusedPlayer
  );
  const insights = replay ? analyzeReplay(replay) : [];

  // Playback timer
  useEffect(() => {
    if (playing && replay) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((t) => {
          if (t >= replay.gameDuration) {
            setPlaying(false);
            return replay.gameDuration;
          }
          return t + playbackSpeed;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, playbackSpeed, replay]);

  const handlePlayerSelect = useCallback(
    (name: string) => {
      if (replay) {
        setReplay({ ...replay, focusedPlayer: name });
      }
    },
    [replay]
  );

  const handleTimeClick = useCallback((time: number) => {
    setCurrentTime(time);
    setPlaying(false);
  }, []);

  if (!replay) {
    return (
      <ReplayUpload
        onReplayLoaded={setReplay}
        onUseSample={() => setReplay(sampleReplay)}
      />
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "coaching", label: "AI Coach" },
    { id: "timeline", label: "Timeline" },
    { id: "scoreboard", label: "Scoreboard" },
  ];

  const gameMins = Math.floor(replay.gameDuration / 60);
  const gameSecs = replay.gameDuration % 60;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header Bar */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4 text-white"
              >
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">LoL Replay Coach</h1>
              <p className="text-[10px] text-zinc-500">
                {replay.queueType} &middot; Patch {replay.gameVersion} &middot;{" "}
                {gameMins}:{gameSecs.toString().padStart(2, "0")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setReplay(null);
                setCurrentTime(0);
                setPlaying(false);
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              New Replay
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[1600px] mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-white tab-active"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Time Slider */}
      <div className="max-w-[1600px] mx-auto w-full px-4 pt-4">
        <TimeSlider
          currentTime={currentTime}
          maxTime={replay.gameDuration}
          playing={playing}
          onTimeChange={handleTimeClick}
          onPlayPause={() => setPlaying(!playing)}
          playbackSpeed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-4">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column - Player Card + Map */}
            <div className="lg:col-span-4 space-y-4">
              {focusedPlayer && (
                <PlayerCard player={focusedPlayer} replay={replay} />
              )}
              <MiniMap events={replay.events} currentTime={currentTime} />
            </div>

            {/* Right Column - Gold Graph + Quick Insights */}
            <div className="lg:col-span-8 space-y-4">
              <GoldGraph
                goldTimeline={replay.goldTimeline}
                events={replay.events}
                currentTime={currentTime}
                onTimeClick={handleTimeClick}
              />

              {/* Quick Coaching Summary */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                  Top Coaching Priorities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.slice(0, 4).map((insight, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${
                        insight.severity === "critical"
                          ? "border-red-500/20 bg-red-500/5"
                          : insight.severity === "warning"
                            ? "border-yellow-500/20 bg-yellow-500/5"
                            : "border-green-500/20 bg-green-500/5"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-medium ${
                            insight.severity === "critical"
                              ? "text-red-400"
                              : insight.severity === "warning"
                                ? "text-yellow-400"
                                : "text-green-400"
                          }`}
                        >
                          {insight.title}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {insight.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
                {insights.length > 4 && (
                  <button
                    onClick={() => setActiveTab("coaching")}
                    className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    View all {insights.length} insights &rarr;
                  </button>
                )}
              </div>

              {/* Quick Scoreboard */}
              <Scoreboard
                replay={replay}
                onPlayerSelect={handlePlayerSelect}
              />
            </div>
          </div>
        )}

        {activeTab === "coaching" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4">
              {focusedPlayer && (
                <PlayerCard player={focusedPlayer} replay={replay} />
              )}
            </div>
            <div className="lg:col-span-8">
              <CoachingPanel
                insights={insights}
                onTimestampClick={handleTimeClick}
              />
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 space-y-4">
              <MiniMap events={replay.events} currentTime={currentTime} />

              {/* Event Filters */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                  Filter Events
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "All" },
                    { id: "key", label: "Key Moments" },
                    { id: "KILL", label: "Kills" },
                    { id: "DRAGON", label: "Dragons" },
                    { id: "BARON", label: "Baron" },
                    { id: "TOWER", label: "Towers" },
                    { id: "TEAM_FIGHT", label: "Teamfights" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setEventFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        eventFilter === f.id
                          ? "bg-indigo-500 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-8 space-y-4">
              <GoldGraph
                goldTimeline={replay.goldTimeline}
                events={replay.events}
                currentTime={currentTime}
                onTimeClick={handleTimeClick}
              />
              <Timeline
                events={replay.events}
                currentTime={currentTime}
                onEventClick={handleTimeClick}
                filter={eventFilter}
              />
            </div>
          </div>
        )}

        {activeTab === "scoreboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4">
              {focusedPlayer && (
                <PlayerCard player={focusedPlayer} replay={replay} />
              )}
            </div>
            <div className="lg:col-span-8">
              <Scoreboard
                replay={replay}
                onPlayerSelect={handlePlayerSelect}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-3 mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 flex items-center justify-between text-xs text-zinc-600">
          <span>LoL Replay Coach v1.0</span>
          <span>
            Click any player in the scoreboard to switch coaching focus
          </span>
        </div>
      </footer>
    </div>
  );
}
