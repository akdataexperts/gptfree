"use client";

import { PanelLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ChatInput, DEFAULT_MODEL } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { Sidebar } from "@/components/chat/Sidebar";
import {
  createConversationId,
  createMessageId,
  loadActiveConversationId,
  loadConversations,
  saveActiveConversationId,
  saveConversations,
  titleFromMessage,
} from "@/lib/chat/storage";
import type { ChatMessage, Conversation } from "@/lib/chat/types";

type AuthUser = {
  email: string;
  name: string | null;
  initials: string;
};

async function streamChatResponse(
  messages: ChatMessage[],
  model: string,
  onDelta: (text: string) => void,
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Failed to send message");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response stream");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;

      try {
        const parsed = JSON.parse(payload) as { text?: string; error?: string };
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.text) onDelta(parsed.text);
      } catch (error) {
        if (error instanceof SyntaxError) continue;
        throw error;
      }
    }
  }
}

export function ChatApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );
  const [input, setInput] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [searchQuery, setSearchQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const userKey = user?.email ?? "";

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: AuthUser & { email?: string | null }) => {
        if (data.email) {
          setUser({
            email: data.email,
            name: data.name ?? null,
            initials: data.initials ?? data.email.slice(0, 2).toUpperCase(),
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!userKey) return;
    setConversations(loadConversations(userKey));
    setActiveConversationId(loadActiveConversationId(userKey));
    setHydrated(true);
  }, [userKey]);

  useEffect(() => {
    if (!hydrated || !userKey) return;
    saveConversations(userKey, conversations);
  }, [conversations, hydrated, userKey]);

  useEffect(() => {
    if (!hydrated || !userKey) return;
    saveActiveConversationId(userKey, activeConversationId);
  }, [activeConversationId, hydrated, userKey]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [conversations, activeConversationId],
  );

  const messages = activeConversation?.messages ?? [];
  const isEmptyState = messages.length === 0;

  const updateConversation = useCallback(
    (conversationId: string, updater: (conversation: Conversation) => Conversation) => {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? updater(conversation)
            : conversation,
        ),
      );
    },
    [],
  );

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setInput("");
    setSearchQuery("");
  }, []);

  const handleSelectConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
    setInput("");
  }, []);

  const handleQuickAction = useCallback((prompt: string) => {
    setInput(prompt);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };

    let conversationId = activeConversationId;
    const assistantMessageId = createMessageId();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    if (!conversationId) {
      conversationId = createConversationId();
      const newConversation: Conversation = {
        id: conversationId,
        title: titleFromMessage(trimmed),
        messages: [userMessage, assistantMessage],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations((current) => [newConversation, ...current]);
      setActiveConversationId(conversationId);
    } else {
      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        title:
          conversation.messages.length === 0
            ? titleFromMessage(trimmed)
            : conversation.title,
        messages: [...conversation.messages, userMessage, assistantMessage],
        updatedAt: Date.now(),
      }));
    }

    setInput("");
    setIsStreaming(true);

    try {
      const currentMessages = conversationId
        ? [
            ...(conversations.find((conversation) => conversation.id === conversationId)
              ?.messages ?? []),
            userMessage,
          ]
        : [userMessage];

      await streamChatResponse(currentMessages, model, (delta) => {
        updateConversation(conversationId!, (conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === assistantMessageId
              ? { ...message, content: message.content + delta }
              : message,
          ),
          updatedAt: Date.now(),
        }));
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      updateConversation(conversationId!, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((entry) =>
          entry.id === assistantMessageId
            ? { ...entry, content: message }
            : entry,
        ),
        updatedAt: Date.now(),
      }));
    } finally {
      setIsStreaming(false);
    }
  }, [
    activeConversationId,
    conversations,
    input,
    isStreaming,
    model,
    updateConversation,
  ]);

  if (!hydrated) {
    return <div className="h-full bg-white" />;
  }

  return (
    <div className="flex h-full bg-white">
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeConversationId={activeConversationId}
        searchQuery={searchQuery}
        user={user}
        onToggle={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onSearchChange={setSearchQuery}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        {!sidebarOpen ? (
          <div className="absolute left-3 top-3 z-10">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-[#676767] transition-colors hover:bg-[#ececec]"
            >
              <PanelLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          </div>
        ) : null}

        {isEmptyState ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
            <h1 className="mb-8 text-[28px] font-normal tracking-[-0.02em] text-[#0d0d0d]">
              What&apos;s on your mind today?
            </h1>
            <ChatInput
              value={input}
              model={model}
              disabled={isStreaming}
              centered
              showQuickActions
              onChange={setInput}
              onSubmit={handleSubmit}
              onModelChange={setModel}
              onQuickAction={handleQuickAction}
            />
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto gpt-scrollbar">
              <MessageList messages={messages} isStreaming={isStreaming} />
            </div>
            <ChatInput
              value={input}
              model={model}
              disabled={isStreaming}
              onChange={setInput}
              onSubmit={handleSubmit}
              onModelChange={setModel}
              onQuickAction={handleQuickAction}
            />
          </>
        )}
      </main>
    </div>
  );
}
