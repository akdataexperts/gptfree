import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { requireGeminiKey } from "@/lib/server/env";

let client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!client) {
    client = new GoogleGenerativeAI(requireGeminiKey());
  }
  return client;
}
