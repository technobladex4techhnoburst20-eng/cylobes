import React, { useState } from "react";
import { Brain, ChevronDown, ChevronUp, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ThinkingVisualizerProps {
  isThinking: boolean;
  thoughtProcess?: string;
  durationMs?: number;
  thinkingLevel?: string;
  model?: string;
}

export const ThinkingVisualizer: React.FC<ThinkingVisualizerProps> = ({
  isThinking,
  thoughtProcess,
  durationMs,
  thinkingLevel = "HIGH",
  model = "gemini-3.1-pro-preview",
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isThinking && !thoughtProcess) return null;

  return (
    <div className="mb-6 rounded-xl border border-zinc-200/90 bg-zinc-900 text-zinc-100 overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-zinc-950 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-900 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Brain className={`w-4 h-4 ${isThinking ? "animate-pulse" : ""}`} />
            {isThinking && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                {isThinking ? "Deep Reasoning in Progress" : "Thinking Process Completed"}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                ThinkingLevel.{thinkingLevel}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700 hidden sm:inline">
                {model}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isThinking
                ? "The model is systematically evaluating invariants, edge cases, and algorithmic structures..."
                : "Inspected problem state, formulated proofs, and verified solution integrity."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs text-zinc-400">
          {durationMs && (
            <span className="flex items-center space-x-1 font-mono bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>{(durationMs / 1000).toFixed(2)}s</span>
            </span>
          )}
          <button
            type="button"
            className="p-1 text-zinc-400 hover:text-white transition-colors"
            aria-label="Toggle thinking trace"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Thought Content Area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-zinc-800 bg-zinc-900/90"
          >
            {isThinking && !thoughtProcess ? (
              <div className="p-5 flex items-center space-x-3">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-300 font-mono">
                  Thinking at Level.HIGH... decomposing query requirements & validating memory safety
                </span>
              </div>
            ) : (
              <div className="p-4 sm:p-5 max-h-72 overflow-y-auto font-mono text-xs text-zinc-300 leading-relaxed space-y-2 whitespace-pre-wrap selection:bg-emerald-800">
                {thoughtProcess || (
                  <span className="text-zinc-500 italic">
                    Reasoning traces processed directly within model thinking context.
                  </span>
                )}
              </div>
            )}
            
            <div className="px-4 py-2 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-400/90">
                <Sparkles className="w-3 h-3" />
                <span>Deep Reasoning Verified &bull; Uncapped Output Context</span>
              </span>
              <span>Thinking Engine: Active</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
