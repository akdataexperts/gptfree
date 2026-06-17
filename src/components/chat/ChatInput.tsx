"use client";

import {
  AudioLines,
  ChevronDown,
  Globe,
  Image as ImageIcon,
  Mic,
  PenLine,
  Plus,
} from "lucide-react";
import {
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import {
  DEFAULT_MODEL,
  GEMINI_MODEL_OPTIONS,
  GPT_MODEL_OPTIONS,
  QUICK_ACTIONS,
} from "@/lib/chat/types";

type ChatInputProps = {
  value: string;
  model: string;
  disabled?: boolean;
  centered?: boolean;
  showQuickActions?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onModelChange: (model: string) => void;
  onQuickAction: (prompt: string) => void;
};

export function ChatInput({
  value,
  model,
  disabled = false,
  centered = false,
  showQuickActions = false,
  onChange,
  onSubmit,
  onModelChange,
  onQuickAction,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [value]);

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const quickActionIcons = {
    image: ImageIcon,
    write: PenLine,
    search: Globe,
  } as const;

  return (
    <div
      className={`w-full ${centered ? "flex flex-col items-center" : "mx-auto max-w-3xl px-4 pb-6 pt-2"}`}
    >
      <form
        onSubmit={handleSubmit}
        className={`flex w-full max-w-3xl items-end gap-2 rounded-[28px] border border-[#d9d9d9] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-within:border-[#b4b4b4] ${
          centered ? "" : ""
        }`}
      >
        <button
          type="button"
          aria-label="Add attachment"
          className="mb-0.5 rounded-full p-1 text-[#676767] transition-colors hover:bg-[#f4f4f4]"
        >
          <Plus className="h-5 w-5" strokeWidth={1.75} />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          className="max-h-[200px] min-h-[24px] flex-1 resize-none border-0 bg-transparent py-1 text-[16px] leading-6 text-[#0d0d0d] outline-none placeholder:text-[#8f8f8f] disabled:opacity-60"
        />

        <div className="mb-0.5 flex items-center gap-1.5">
          <div className="relative">
            <select
              value={model}
              onChange={(event) => onModelChange(event.target.value)}
              className="max-w-[168px] appearance-none truncate rounded-full border-0 bg-transparent py-1 pl-2 pr-6 text-[14px] text-[#676767] outline-none"
              aria-label="Model"
            >
              <optgroup label="GPT">
                {GPT_MODEL_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Gemini">
                {GEMINI_MODEL_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#676767]" strokeWidth={1.75} />
          </div>

          <button
            type="button"
            aria-label="Use microphone"
            className="rounded-full p-1.5 text-[#676767] transition-colors hover:bg-[#f4f4f4]"
          >
            <Mic className="h-5 w-5" strokeWidth={1.75} />
          </button>

          <button
            type="submit"
            disabled={disabled || !value.trim()}
            aria-label="Send message"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0d0d0d] text-white transition-opacity disabled:opacity-40"
          >
            <AudioLines className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        </div>
      </form>

      {showQuickActions ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = quickActionIcons[action.id as keyof typeof quickActionIcons];
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onQuickAction(action.prompt)}
                className="inline-flex items-center gap-2 rounded-full border border-[#d9d9d9] bg-white px-4 py-2 text-[14px] text-[#0d0d0d] transition-colors hover:bg-[#f9f9f9]"
              >
                <Icon className="h-4 w-4 text-[#676767]" strokeWidth={1.75} />
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export { DEFAULT_MODEL };
