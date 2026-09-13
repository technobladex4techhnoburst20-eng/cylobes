import React, { useState, useRef, useEffect } from "react";
import { Smile, Sparkles, Heart, GraduationCap, X } from "lucide-react";

interface EmojiToolbarProps {
  onSelectEmoji: (emoji: string) => void;
  className?: string;
}

const QUICK_EMOJIS = [
  "😀", "😂", "🥹", "😍", "😎", "🥳", 
  "❤️", "💖", "🔥", "✨", "🎓", "☕", 
  "📚", "🚀", "🍕", "🌙", "🙌", "💯"
];

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    name: "Smileys",
    icon: Smile,
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥹", "😊",
      "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😛", "😜", "🤪",
      "😎", "🥳", "🥺", "😭", "😤", "🫡", "🤝", "🤫", "🤔", "😴",
      "🤩", "🤗", "🫠", "🫣", "🫡", "🙄", "😬", "😮", "😴", "🤤"
    ],
  },
  {
    id: "college",
    name: "Campus & Study",
    icon: GraduationCap,
    emojis: [
      "🎓", "📚", "📖", "💻", "☕", "🏫", "🎒", "🏆", "🥇", "📝",
      "🧪", "🔬", "📐", "🍕", "🍔", "🍿", "🎸", "🏏", "🚌", "🚲",
      "⏰", "💤", "💡", "📢", "🎯", "🎉", "🎊", "🍻", "🥪", "🧋",
      "🎧", "📱", "🖨️", "🖊️", "🧑‍🎓", "👩‍🎓", "👨‍💻", "👩‍💻"
    ],
  },
  {
    id: "vibes",
    name: "Hearts & Vibes",
    icon: Heart,
    emojis: [
      "❤️", "💖", "💗", "💓", "💙", "💜", "🤍", "💛", "🧡", "🖤",
      "✨", "💫", "🔥", "🌟", "⭐", "🌈", "🌸", "🌹", "💌", "🌙",
      "🥂", "🎈", "💯", "🚀", "✌️", "🤙", "🫂", "🫶", "👑", "💐",
      "🪄", "🍀", "💎", "⚡", "🕊️", "🎶", "🎵", "🌅", "🌆"
    ],
  },
];

export const EmojiToolbar: React.FC<EmojiToolbarProps> = ({
  onSelectEmoji,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("smileys");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const currentCat = EMOJI_CATEGORIES.find((c) => c.id === activeCategory) || EMOJI_CATEGORIES[0];

  return (
    <div className={`relative flex items-center gap-1 text-xs ${className}`}>
      {/* Quick Emojis scrollable bar */}
      <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none max-w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="Open Emoji Library"
          className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
            isOpen
              ? "bg-[#003d80] text-white border-[#003d80]"
              : "bg-white text-[#1a2a40] border-[#1a2a40]/15 hover:bg-[#f0f4f8]"
          }`}
        >
          <Smile className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Emojis</span>
        </button>

        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelectEmoji(emoji)}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#e2eaf2] text-sm shrink-0 transition-transform hover:scale-120 cursor-pointer active:scale-95"
            title={`Add ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Expanded Emoji Modal / Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-0 mb-2 z-50 w-72 sm:w-80 bg-white rounded-2xl border border-[#1a2a40]/15 shadow-xl p-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1a2a40]/10 pb-2">
            <div className="flex items-center gap-1">
              {EMOJI_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#003d80] text-white"
                        : "text-[#4a5e7a] hover:bg-[#f0f4f8]"
                    }`}
                  >
                    <IconComponent className="w-3 h-3" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-[#7a8fa8] hover:text-[#1a2a40] hover:bg-[#f0f4f8] rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Emoji Grid */}
          <div className="grid grid-cols-8 sm:grid-cols-8 gap-1 max-h-48 overflow-y-auto p-1 scrollbar-thin">
            {currentCat.emojis.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectEmoji(emoji);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0f4f8] text-base transition-transform hover:scale-125 cursor-pointer active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="text-[10px] text-[#7a8fa8] text-center pt-1 border-t border-[#1a2a40]/5">
            Click any emoji to insert into your message
          </div>
        </div>
      )}
    </div>
  );
};
