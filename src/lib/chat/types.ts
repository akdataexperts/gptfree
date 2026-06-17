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

export type ModelOption = {
  id: string;
  label: string;
};

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "gpt-4o", label: "Medium" },
  { id: "gpt-4o-mini", label: "Fast" },
  { id: "gpt-4.1", label: "Smart" },
];

export const DEFAULT_MODEL = MODEL_OPTIONS[0].id;

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
