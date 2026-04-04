"use client";

import { useCallback, useState } from "react";
import { ReplayData } from "@/types/replay";

export default function ReplayUpload({
  onReplayLoaded: onLoad,
  onUseSample,
}: {
  onReplayLoaded: (data: ReplayData) => void;
  onUseSample: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as ReplayData;
          if (!data.players || !data.events || !data.gameDuration) {
            throw new Error("Invalid replay format");
          }
          onLoad(data);
        } catch {
          setError(
            "Invalid replay file. Please upload a valid JSON replay file."
          );
        }
      };
      reader.readAsText(file);
    },
    [onLoad]
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 mb-4 shadow-xl shadow-purple-500/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-10 h-10 text-white"
            >
              <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            LoL Replay Coach
          </h1>
          <p className="text-zinc-400">
            Upload your game replay for AI-powered coaching analysis
          </p>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
            dragging
              ? "border-purple-500 bg-purple-500/10"
              : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-900"
          }`}
        >
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
            id="replay-upload"
          />
          <label htmlFor="replay-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  dragging ? "bg-purple-500/20" : "bg-zinc-800"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`w-6 h-6 ${dragging ? "text-purple-400" : "text-zinc-500"}`}
                >
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-zinc-300 font-medium">
                  Drop replay file here or click to browse
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Supports JSON replay format
                </p>
              </div>
            </div>
          </label>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs text-zinc-600">or</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        {/* Demo Button */}
        <button
          onClick={onUseSample}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
        >
          Try with Sample Game
        </button>
        <p className="text-center text-xs text-zinc-500 mt-2">
          Load a demo ranked game to explore coaching features
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mt-8">
          {[
            { title: "AI Coaching", desc: "Personalized tips & insights" },
            { title: "Gold Timeline", desc: "Track gold advantages" },
            { title: "Event Replay", desc: "Review key moments" },
            { title: "Map Viewer", desc: "Visualize positioning" },
          ].map((f) => (
            <div
              key={f.title}
              className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800"
            >
              <div className="text-sm font-medium text-zinc-300">
                {f.title}
              </div>
              <div className="text-xs text-zinc-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
