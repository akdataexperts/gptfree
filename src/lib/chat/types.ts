export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export type Conversation = ConversationSummary & {
  messages: ChatMessage[];
};

export type ModelProvider = "openai" | "google";

export type ModelOption = {
  id: string;
  label: string;
  provider: ModelProvider;
};

export const GPT_MODEL_OPTIONS: ModelOption[] = [
  { id: "gpt-5.5", label: "GPT-5.5", provider: "openai" },
  { id: "gpt-5.5-pro", label: "GPT-5.5 Pro", provider: "openai" },
  { id: "gpt-5.4", label: "GPT-5.4", provider: "openai" },
];

export const GEMINI_MODEL_OPTIONS: ModelOption[] = [
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", provider: "google" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", provider: "google" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", provider: "google" },
];

export const MODEL_OPTIONS: ModelOption[] = [
  ...GPT_MODEL_OPTIONS,
  ...GEMINI_MODEL_OPTIONS,
];

export const DEFAULT_MODEL = GPT_MODEL_OPTIONS[0].id;

export function getModelProvider(modelId: string): ModelProvider {
  const option = MODEL_OPTIONS.find((entry) => entry.id === modelId);
  return option?.provider ?? "openai";
}

export function isGeminiModel(modelId: string): boolean {
  return getModelProvider(modelId) === "google";
}

export function getModelLabel(modelId: string): string {
  const option = MODEL_OPTIONS.find((entry) => entry.id === modelId);
  return option?.label ?? modelId;
}

export function modelIdentitySystemPrompt(modelId: string): string {
  const label = getModelLabel(modelId);
  return `When the user asks what model you are, which AI you are, or what version you are using, respond that you are ${label}.`;
}

export type QuickAction = {
  id: string;
  label: string;
  prompt: string;
};

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "image",
    label: "Create an image",
    prompt: "Help me create an image idea for ",
  },
  {
    id: "write",
    label: "Write or edit",
    prompt: "Help me write or edit the following: ",
  },
  {
    id: "search",
    label: "Look something up",
    prompt: "Look up information about ",
  },
];
