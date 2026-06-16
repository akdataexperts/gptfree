import { getOpenAIClient } from "@/lib/server/openai";

export const runtime = "nodejs";

type ChatRequestMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: ChatRequestMessage[];
      model?: string;
    };

    const messages = body.messages ?? [];
    const model = body.model ?? "gpt-4o";

    if (messages.length === 0) {
      return Response.json({ error: "Messages are required" }, { status: 400 });
    }

    const openai = getOpenAIClient();
    const stream = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Stream failed";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`),
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
    return Response.json({ error: message }, { status: 500 });
  }
}
