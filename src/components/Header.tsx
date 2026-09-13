import React from "react";
import { Sparkles, Server, CheckCircle2, AlertCircle, BrainCircuit, Terminal } from "lucide-react";
import { HealthStatus } from "../types";

interface HeaderProps {
  health: HealthStatus | null;
  serverLoading: boolean;
  onRefreshHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, serverLoading, onRefreshHealth }) => {
  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-sm">
            <BrainCircuit className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-semibold text-zinc-900 tracking-tight">
                Full Stack Thinking Studio
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                gemini-3.1-pro-preview
              </span>
            </div>
            <p className="text-xs text-zinc-500 hidden sm:block">
              High Thinking Mode (ThinkingLevel.HIGH) &bull; Full-Stack Express Server
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3">
          {/* Server status */}
          <button
            onClick={onRefreshHealth}
            title="Click to re-check server status"
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors text-xs font-medium text-zinc-700"
          >
            <Server className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden md:inline">Server:</span>
            {serverLoading ? (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            ) : health?.status === "ok" ? (
              <span className="flex items-center text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500 inline" />
                Port 3000 Active
              </span>
            ) : (
              <span className="flex items-center text-amber-600">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-500 inline" />
                Connecting...
              </span>
            )}
          </button>

          {/* High Thinking Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold tracking-wide">High Thinking</span>
          </div>
        </div>
      </div>
    </header>
  );
};
