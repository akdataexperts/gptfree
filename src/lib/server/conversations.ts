import "server-only";

import { supabase } from "@/lib/server/supabase-server";
import type { ChatMessage, Conversation, ConversationSummary } from "@/lib/chat/types";

type ConversationRow = {
  id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

function toTimestamp(value: string): number {
  return new Date(value).getTime();
}

export async function listConversations(
  email: string,
): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from("gptfree_conversations")
    .select("id, title, created_at, updated_at")
    .eq("email", email)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: toTimestamp(row.created_at ?? row.updated_at),
    updatedAt: toTimestamp(row.updated_at),
  }));
}

export async function getConversation(
  email: string,
  conversationId: string,
): Promise<Conversation | null> {
  const { data: conversation, error: conversationError } = await supabase
    .from("gptfree_conversations")
    .select("id, title, model, created_at, updated_at")
    .eq("id", conversationId)
    .eq("email", email)
    .maybeSingle<ConversationRow>();

  if (conversationError) {
    throw new Error(conversationError.message);
  }

  if (!conversation) {
    return null;
  }

  const { data: messages, error: messagesError } = await supabase
    .from("gptfree_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  return {
    id: conversation.id,
    title: conversation.title,
    messages: (messages ?? []).map((message) => ({
      id: message.id,
      role: message.role as ChatMessage["role"],
      content: message.content,
    })),
    createdAt: toTimestamp(conversation.created_at),
    updatedAt: toTimestamp(conversation.updated_at),
  };
}

export async function createConversation(
  userId: string,
  email: string,
  title: string,
  model: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("gptfree_conversations")
    .insert({
      user_id: userId,
      email,
      title,
      model,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create conversation");
  }

  return data.id;
}

export async function insertMessage(
  conversationId: string,
  role: ChatMessage["role"],
  content: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("gptfree_messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to insert message");
  }

  return data.id;
}

export async function updateMessageContent(
  messageId: string,
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from("gptfree_messages")
    .update({ content })
    .eq("id", messageId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function touchConversation(
  conversationId: string,
  title?: string,
): Promise<void> {
  const payload: { updated_at: string; title?: string } = {
    updated_at: new Date().toISOString(),
  };

  if (title) {
    payload.title = title;
  }

  const { error } = await supabase
    .from("gptfree_conversations")
    .update(payload)
    .eq("id", conversationId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getConversationMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("gptfree_messages")
    .select("id, role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
  }));
}

export function titleFromMessage(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  if (!trimmed) return "New chat";
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed;
}
