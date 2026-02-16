import React, { useState, useEffect } from 'react';
import { Lightbulb, BookOpen, Search, ListChecks, BrainCircuit } from 'lucide-react';

const DEFAULT_PROMPTS = [
  { text: 'Summarize this document', icon: BookOpen },
  { text: 'Explain the main concepts', icon: Lightbulb },
  { text: 'Identify key takeaways', icon: Search },
];

const EXTENDED_PROMPTS = [
  { text: 'Create a study guide', icon: ListChecks },
  { text: 'Find important definitions', icon: Search },
  { text: 'Explain like I\'m a beginner', icon: BrainCircuit },
  { text: 'List the main arguments', icon: ListChecks },
  { text: 'What questions does this raise?', icon: Lightbulb },
];

export default function SuggestedPrompts({ onPromptSelected, dynamicPrompts }) {
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);

  // Update prompts when dynamic suggestions arrive from AI responses
  useEffect(() => {
    if (dynamicPrompts && dynamicPrompts.length > 0) {
      const mapped = dynamicPrompts.map((p) => {
        const text = typeof p === 'string' ? p : p.text || p;
        return { text, icon: Lightbulb };
      });
      setPrompts(mapped.slice(0, 4));
    }
  }, [dynamicPrompts]);

  // Rotate in a fresh default prompt after one is clicked
  const handleClick = (prompt) => {
    onPromptSelected(prompt.text);

    setPrompts((prev) => {
      const remaining = prev.filter((p) => p.text !== prompt.text);
      // Pick a replacement from the extended pool that isn't already showing
      const showing = new Set(remaining.map((p) => p.text));
      const replacement = EXTENDED_PROMPTS.find((p) => !showing.has(p.text));
      if (replacement) {
        return [...remaining, replacement];
      }
      return remaining;
    });
  };

  if (prompts.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {prompts.map((prompt) => {
        const Icon = prompt.icon;
        return (
          <button
            key={prompt.text}
            type="button"
            onClick={() => handleClick(prompt)}
            className={[
              'bg-gray-100 dark:bg-gray-700',
              'text-gray-800 dark:text-gray-200',
              'px-3 py-1 rounded-full text-sm font-medium',
              'flex items-center gap-1 cursor-pointer',
              'hover:bg-gray-200 dark:hover:bg-gray-600',
              'transition-colors duration-200',
              'whitespace-nowrap shrink-0',
              'border-0 outline-none',
            ].join(' ')}
          >
            <Icon size={14} strokeWidth={2} />
            <span>{prompt.text}</span>
          </button>
        );
      })}
    </div>
  );
}
