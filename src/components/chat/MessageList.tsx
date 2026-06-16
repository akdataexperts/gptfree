"use client";

import ReactMarkdown from "react-markdown";

import type { ChatMessage } from "@/lib/chat/types";

type MessageListProps = {
  messages: ChatMessage[];
  isStreaming: boolean;
};

export function MessageList({ messages, isStreaming }: MessageListProps) {
  if (messages.length === 0) return null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8">
      {messages.map((message) => (
        <article key={message.id} className="text-[16px] leading-7 text-[#0d0d0d]">
          {message.role === "user" ? (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-[24px] bg-[#f4f4f4] px-4 py-3 whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          ) : (
            <div className="gpt-markdown">
              <ReactMarkdown>{message.content || (isStreaming ? " " : "")}</ReactMarkdown>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
