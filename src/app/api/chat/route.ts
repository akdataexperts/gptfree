import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_MODEL, isGeminiModel } from "@/lib/chat/types";
import type { ChatMessage } from "@/lib/chat/types";
import { requireAuth, requireCommercialConsent } from "@/lib/server/auth";
import {
  createConversation,
  getConversationMessages,
  insertMessage,
  titleFromMessage,
  touchConversation,
  updateMessageContent,
} from "@/lib/server/conversations";
import { getGeminiClient } from "@/lib/server/gemini";
import { getOpenAIClient } from "@/lib/server/openai";
import { supabase } from "@/lib/server/supabase-server";

export const runtime = "nodejs";

function messagesForModel(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(
    (message) =>
      message.content.trim().length > 0 &&
      (message.role === "user" || message.role === "assistant"),
  );
}

function createSseStream(
  onStream: (
    emit: (payload: Record<string, unknown>) => void,
  ) => Promise<string>,
  onComplete: (content: string) => Promise<void>,
  onError: (content: string, errorMessage: string) => Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const emit = (payload: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      let content = "";

      try {
        content = await onStream(emit);
        await onComplete(content);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Stream failed";
        await onError(content, errorMessage);
        emit({ type: "error", error: errorMessage });
      } finally {
        controller.close();
      }
    },
  });
}

async function streamOpenAiResponse(
  model: string,
  messages: ChatMessage[],
  emit: (payload: Record<string, unknown>) => void,
): Promise<string> {
  const openai = getOpenAIClient();
  const stream = await openai.chat.completions.create({
    model,
    messages: messages.map(({ role, content }) => ({ role, content })),
    stream: true,
  });

  let assistantContent = "";

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    if (!text) continue;

    assistantContent += text;
    emit({ type: "delta", text });
  }

  return assistantContent;
}

async function streamGeminiResponse(
  model: string,
  messages: ChatMessage[],
  emit: (payload: Record<string, unknown>) => void,
): Promise<string> {
  const genAI = getGeminiClient();
  const generativeModel = genAI.getGenerativeModel({ model });

  const history = messages.slice(0, -1).map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== "user") {
    throw new Error("Gemini requests require a user message");
  }

  const chat = generativeModel.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage.content);

  let assistantContent = "";

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (!text) continue;

    assistantContent += text;
    emit({ type: "delta", text });
  }

  return assistantContent;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const consentError = requireCommercialConsent(auth);
  if (consentError) return consentError;

  try {
    const body = (await request.json()) as {
      conversationId?: string;
      message?: string;
      model?: string;
    };

    const message = body.message?.trim();
    const model = body.model ?? DEFAULT_MODEL;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let conversationId = body.conversationId;
    const isNewConversation = !conversationId;

    if (conversationId) {
      const { data: existing, error: existingError } = await supabase
        .from("gptfree_conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("email", auth.email)
        .maybeSingle();

      if (existingError) {
        throw new Error(existingError.message);
      }

      if (!existing) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    } else {
      conversationId = await createConversation(
        auth.id,
        auth.email,
        titleFromMessage(message),
        model,
      );
    }

    await insertMessage(conversationId, "user", message);

    const history = messagesForModel(await getConversationMessages(conversationId));
    const assistantMessageId = await insertMessage(conversationId, "assistant", "");

    if (isNewConversation) {
      await touchConversation(conversationId, titleFromMessage(message));
    } else {
      await touchConversation(conversationId);
    }

    const readable = createSseStream(
      async (emit) => {
        emit({
          type: "meta",
          conversationId,
          assistantMessageId,
        });

        if (isGeminiModel(model)) {
          return streamGeminiResponse(model, history, emit);
        }

        return streamOpenAiResponse(model, history, emit);
      },
      async (assistantContent) => {
        await updateMessageContent(assistantMessageId, assistantContent);
        await touchConversation(conversationId!);
      },
      async (assistantContent, errorMessage) => {
        if (assistantContent) {
          await updateMessageContent(assistantMessageId, assistantContent);
        } else {
          await updateMessageContent(assistantMessageId, errorMessage);
        }
      },
    );

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
