import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/server/auth";
import {
  createConversation,
  getConversationMessages,
  insertMessage,
  titleFromMessage,
  touchConversation,
  updateMessageContent,
} from "@/lib/server/conversations";
import { getOpenAIClient } from "@/lib/server/openai";
import { supabase } from "@/lib/server/supabase-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as {
      conversationId?: string;
      message?: string;
      model?: string;
    };

    const message = body.message?.trim();
    const model = body.model ?? "gpt-4o";

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

    const history = await getConversationMessages(conversationId);
    const assistantMessageId = await insertMessage(conversationId, "assistant", "");

    if (isNewConversation) {
      await touchConversation(conversationId, titleFromMessage(message));
    } else {
      await touchConversation(conversationId);
    }

    const openai = getOpenAIClient();
    const stream = await openai.chat.completions.create({
      model,
      messages: history.map(({ role, content }) => ({ role, content })),
      stream: true,
    });

    const encoder = new TextEncoder();
    let assistantContent = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "meta",
                conversationId,
                assistantMessageId,
              })}\n\n`,
            ),
          );

          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (!text) continue;

            assistantContent += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "delta", text })}\n\n`),
            );
          }

          await updateMessageContent(assistantMessageId, assistantContent);
          await touchConversation(conversationId!);

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Stream failed";

          if (assistantContent) {
            await updateMessageContent(assistantMessageId, assistantContent);
          } else {
            await updateMessageContent(assistantMessageId, errorMessage);
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`,
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

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
