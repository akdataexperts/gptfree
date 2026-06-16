import type { Conversation } from "@/lib/chat/types";

const conversationsKey = (userKey: string) => `gptfree-conversations-${userKey}`;
const activeKey = (userKey: string) => `gptfree-active-conversation-${userKey}`;

export function loadConversations(userKey: string): Conversation[] {
  if (typeof window === "undefined" || !userKey) return [];
  try {
    const raw = localStorage.getItem(conversationsKey(userKey));
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

export function saveConversations(
  userKey: string,
  conversations: Conversation[],
): void {
  if (typeof window === "undefined" || !userKey) return;
  localStorage.setItem(conversationsKey(userKey), JSON.stringify(conversations));
}

export function loadActiveConversationId(userKey: string): string | null {
  if (typeof window === "undefined" || !userKey) return null;
  return localStorage.getItem(activeKey(userKey));
}

export function saveActiveConversationId(
  userKey: string,
  id: string | null,
): void {
  if (typeof window === "undefined" || !userKey) return;
  if (id) {
    localStorage.setItem(activeKey(userKey), id);
  } else {
    localStorage.removeItem(activeKey(userKey));
  }
}

export function createConversationId(): string {
  return crypto.randomUUID();
}

export function createMessageId(): string {
  return crypto.randomUUID();
}

export function titleFromMessage(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  if (!trimmed) return "New chat";
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed;
}
