import React, { useState } from "react";
import { Copy, Check, Terminal, Clock, Hash, CheckCircle, AlertTriangle } from "lucide-react";
import { GenerationResult } from "../types";
import { ThinkingVisualizer } from "./ThinkingVisualizer";

interface ResponseViewerProps {
  result: GenerationResult | null;
  isLoading: boolean;
  thoughtProcess?: string;
  error?: string | null;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({
  result,
  isLoading,
  thoughtProcess,
  error,
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedCodeIndex(index);
      setTimeout(() => setCopiedCodeIndex(null), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-red-800">Generation Error</h3>
            <p className="text-xs text-red-700 leading-relaxed font-mono whitespace-pre-wrap">{error}</p>
            <div className="text-xs text-red-600 pt-2 border-t border-red-200/80">
              Tip: Verify that your Gemini API key is configured in the AI Studio Settings &gt; Secrets panel. If using high thinking with <code className="bg-red-100 px-1 py-0.5 rounded font-mono">gemini-3.1-pro-preview</code>, ensure your project has the required access.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ThinkingVisualizer
          isThinking={true}
          thoughtProcess={thoughtProcess}
          thinkingLevel="HIGH"
          model="gemini-3.1-pro-preview"
        />
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center space-y-4 shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-2">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Synthesizing Deep Reasoning Solution...
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
            Running with <span className="font-semibold text-zinc-800">ThinkingLevel.HIGH</span> on{" "}
            <span className="font-mono text-zinc-800">gemini-3.1-pro-preview</span> without output token truncation.
          </p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-12 text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 mb-3 shadow-xs">
          <Terminal className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-medium text-zinc-900">Ready for Deep Reasoning</h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 leading-relaxed">
          Submit a complex architecture question, code refactor, or algorithmic puzzle above. High Thinking Mode will rigorously decompose the problem.
        </p>
      </div>
    );
  }

  // Parse text into blocks of markdown / code
  const blocks = parseMarkdownBlocks(result.text);

  return (
    <div className="space-y-4">
      {/* Show Thinking Visualizer if thoughts exist */}
      {(result.thoughts || thoughtProcess) && (
        <ThinkingVisualizer
          isThinking={false}
          thoughtProcess={result.thoughts || thoughtProcess}
          durationMs={result.durationMs}
          thinkingLevel={result.thinkingLevel}
          model={result.model}
        />
      )}

      {/* Main Solution Box */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        {/* Solution Header bar */}
        <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="flex items-center text-xs font-semibold text-zinc-900">
              <CheckCircle className="w-4 h-4 text-emerald-600 mr-1.5" />
              Verified Solution
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
              {result.model}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              ThinkingLevel.{result.thinkingLevel}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-zinc-500">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{(result.durationMs / 1000).toFixed(2)}s</span>
            </span>

            {result.usageMetadata?.totalTokenCount && (
              <span className="flex items-center space-x-1">
                <Hash className="w-3.5 h-3.5" />
                <span>{result.usageMetadata.totalTokenCount} tokens</span>
              </span>
            )}

            <button
              onClick={() => copyToClipboard(result.text)}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 transition-colors font-medium cursor-pointer"
              title="Copy entire response"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Formatted Content */}
        <div className="p-6 space-y-4 text-zinc-800 text-sm leading-relaxed">
          {blocks.map((block, idx) => {
            if (block.type === "code") {
              return (
                <div key={idx} className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden my-4">
                  <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-mono uppercase font-semibold text-zinc-300">
                      {block.language || "code"}
                    </span>
                    <button
                      onClick={() => copyToClipboard(block.content, idx)}
                      className="flex items-center space-x-1 hover:text-white transition-colors cursor-pointer text-xs"
                    >
                      {copiedCodeIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-xs font-mono text-emerald-300 leading-relaxed">
                    <code>{block.content}</code>
                  </pre>
                </div>
              );
            }

            return (
              <div key={idx} className="prose prose-zinc max-w-none">
                <p className="whitespace-pre-line leading-relaxed text-zinc-800">{block.content}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface Block {
  type: "text" | "code";
  content: string;
  language?: string;
}

function parseMarkdownBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const codeRegex = /```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim();
      if (textContent) {
        blocks.push({ type: "text", content: textContent });
      }
    }

    blocks.push({
      type: "code",
      language: match[1] || "typescript",
      content: match[2].trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      blocks.push({ type: "text", content: remainingText });
    }
  }

  return blocks.length > 0 ? blocks : [{ type: "text", content: text }];
}
