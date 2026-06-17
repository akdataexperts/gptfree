import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/server/auth";
import { listConversations } from "@/lib/server/conversations";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const conversations = await listConversations(auth.email);
    return NextResponse.json({ conversations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load conversations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
