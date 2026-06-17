import "server-only";

export const serverEnv = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  workosApiKey: process.env.WORKOS_API_KEY,
  workosClientId: process.env.WORKOS_CLIENT_ID,
  workosCookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
} as const;

export function requireOpenAiKey(): string {
  const key = serverEnv.openaiApiKey;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return key;
}

export function requireGeminiKey(): string {
  const key = serverEnv.geminiApiKey;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return key;
}
