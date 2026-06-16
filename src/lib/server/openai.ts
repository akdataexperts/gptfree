import "server-only";

import OpenAI from "openai";

import { requireOpenAiKey } from "@/lib/server/env";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: requireOpenAiKey() });
  }
  return client;
}
