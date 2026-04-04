"use client";

import { useCallback } from "react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TimeSlider({
  currentTime,
  maxTime,
  playing,
  onTimeChange,
  onPlayPause,
  playbackSpeed,
  onSpeedChange,
}: {
  currentTime: number;
  maxTime: number;
  playing: boolean;
  onTimeChange: (time: number) => void;
  onPlayPause: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}) {
  const pct = (currentTime / maxTime) * 100;

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onTimeChange(Number(e.target.value));
    },
    [onTimeChange]
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center gap-4">
        {/* Play/Pause */}
        <button
          onClick={onPlayPause}
          className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors flex-shrink-0"
        >
          {playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Time Display */}
        <span className="text-sm font-mono text-zinc-300 w-24 text-center flex-shrink-0">
          {formatTime(currentTime)} / {formatTime(maxTime)}
        </span>

        {/* Slider */}
        <div className="flex-1 relative">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-[width] duration-100"
              style={{ width: `${pct}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={maxTime}
            value={currentTime}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {[1, 2, 4, 8].map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                playbackSpeed === speed
                  ? "bg-indigo-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-300"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
