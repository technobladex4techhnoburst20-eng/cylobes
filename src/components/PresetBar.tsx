import React from "react";
import { PresetQuery } from "../types";
import { Zap, Code2, Layers, Cpu, FileCode } from "lucide-react";

interface PresetBarProps {
  presets: PresetQuery[];
  onSelectPreset: (preset: PresetQuery) => void;
  activePresetId?: string;
}

const getCategoryIcon = (category: string) => {
  if (category.includes("Concurrency")) return <Cpu className="w-3.5 h-3.5 text-indigo-600" />;
  if (category.includes("Distributed")) return <Layers className="w-3.5 h-3.5 text-blue-600" />;
  if (category.includes("Performance")) return <Zap className="w-3.5 h-3.5 text-amber-600" />;
  return <Code2 className="w-3.5 h-3.5 text-emerald-600" />;
};

export const PresetBar: React.FC<PresetBarProps> = ({
  presets,
  onSelectPreset,
  activePresetId,
}) => {
  if (presets.length === 0) return null;

  return (
    <div className="border-b border-zinc-200 bg-zinc-50/70 py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center space-x-2 shrink-0 pr-2 border-r border-zinc-200">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
            <FileCode className="w-3.5 h-3.5" />
            Complex Presets:
          </span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          {presets.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-sm border border-zinc-800"
                    : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300"
                }`}
                title={preset.description}
              >
                {getCategoryIcon(preset.category)}
                <span>{preset.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
