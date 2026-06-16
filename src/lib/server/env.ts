import "server-only";

export const serverEnv = {
  openaiApiKey: process.env.OPENAI_API_KEY,
} as const;

export function requireOpenAiKey(): string {
  const key = serverEnv.openaiApiKey;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return key;
}
