import React from "react";
import { History, Trash2, Clock, Brain, ChevronRight } from "lucide-react";
import { GenerationResult } from "../types";

interface HistorySidebarProps {
  history: GenerationResult[];
  onSelectResult: (result: GenerationResult) => void;
  onClearHistory: () => void;
  activeResultId?: string;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  history,
  onSelectResult,
  onClearHistory,
  activeResultId,
}) => {
  if (history.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
        <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-700">
          <History className="w-3.5 h-3.5 text-zinc-500" />
          <span>Reasoning History ({history.length})</span>
        </div>
        <button
          onClick={onClearHistory}
          className="text-xs text-zinc-400 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1"
          title="Clear history"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {history.map((item) => {
          const isActive = activeResultId === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onSelectResult(item)}
              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                isActive
                  ? "bg-zinc-900 text-white border-zinc-800 shadow-xs"
                  : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-medium truncate max-w-[180px]">
                  {item.prompt || "Code Analysis"}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isActive ? "bg-zinc-800 text-emerald-400" : "bg-white text-zinc-500 border border-zinc-200"
                }`}>
                  {(item.durationMs / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] opacity-75">
                <span className="flex items-center gap-1">
                  <Brain className="w-3 h-3 text-emerald-400" />
                  <span>ThinkingLevel.{item.thinkingLevel}</span>
                </span>
                <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
