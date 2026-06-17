import { NextRequest, NextResponse } from "next/server";

import { recordCommercialConsent, requireAuth } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await recordCommercialConsent(auth.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save consent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
