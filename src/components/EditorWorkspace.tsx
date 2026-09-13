import React, { useState } from "react";
import { Sparkles, Code, Terminal, Send, RotateCcw, Sliders, ChevronDown, ChevronUp } from "lucide-react";

interface EditorWorkspaceProps {
  prompt: string;
  setPrompt: (value: string) => void;
  code: string;
  setCode: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  highThinking: boolean;
  setHighThinking: (val: boolean) => void;
  isStreaming: boolean;
  setIsStreaming: (val: boolean) => void;
  systemInstruction: string;
  setSystemInstruction: (val: string) => void;
  onClear: () => void;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  prompt,
  setPrompt,
  code,
  setCode,
  onSubmit,
  isLoading,
  highThinking,
  setHighThinking,
  isStreaming,
  setIsStreaming,
  systemInstruction,
  setSystemInstruction,
  onClear,
}) => {
  const [showCodeEditor, setShowCodeEditor] = useState(Boolean(code));
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isLoading && (prompt.trim() || code.trim())) {
        onSubmit();
      }
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden mb-6">
      {/* Workspace Top Toolbar */}
      <div className="px-5 py-3 bg-zinc-50/80 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-zinc-600" />
          <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
            Query & Code Input
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
              showCodeEditor
                ? "bg-zinc-900 text-white border-zinc-800"
                : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{showCodeEditor ? "Code Block Active" : "+ Attach Code"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Config</span>
            {showAdvanced ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={isLoading || (!prompt && !code)}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-40 transition-colors cursor-pointer"
            title="Clear input"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Advanced Settings Drawer */}
      {showAdvanced && (
        <div className="p-4 bg-zinc-50 border-b border-zinc-200 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Thinking Mode Toggle */}
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={highThinking}
                onChange={(e) => setHighThinking(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-zinc-900">High Thinking Mode</span>
                <span className="text-zinc-500 ml-1.5">(gemini-3.1-pro-preview with ThinkingLevel.HIGH)</span>
              </div>
            </label>

            {/* Stream toggle */}
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isStreaming}
                onChange={(e) => setIsStreaming(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-zinc-900">Streaming Mode</span>
                <span className="text-zinc-500 ml-1.5">(Server-Sent Events)</span>
              </div>
            </label>
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">
              System Instruction (defines reasoning persona and constraints):
            </label>
            <input
              type="text"
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              placeholder="e.g., You are an elite principal engineer and algorithm architect..."
              className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded text-xs font-mono text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Main Text Prompt Area */}
      <div className="p-4 space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your complex problem, architectural requirements, or edge cases to analyze... (Press Ctrl + Enter to submit)"
          rows={4}
          className="w-full p-2 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none resize-y font-sans leading-relaxed"
        />

        {/* Code Attachment Block */}
        {showCodeEditor && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="px-3.5 py-1.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Target Code / Snippet
              </span>
              <button
                type="button"
                onClick={() => setCode("")}
                className="text-[11px] text-zinc-400 hover:text-white"
              >
                Clear code
              </button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Paste TypeScript, Rust, Python, or SQL code here to analyze..."
              rows={6}
              className="w-full p-3 bg-transparent text-xs font-mono text-emerald-300 placeholder-zinc-600 focus:outline-none resize-y leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Submit Bottom Bar */}
      <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-zinc-500">
          <span className="hidden sm:inline">Shortcut:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 border border-zinc-300 font-mono text-[10px] text-zinc-700 font-semibold">
            Ctrl + Enter
          </kbd>
          <span className="hidden sm:inline">&bull; No output token limit</span>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || (!prompt.trim() && !code.trim())}
          className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span>Deep Reasoning...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Execute with High Thinking</span>
              <Send className="w-3 h-3 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
