import { NextRequest, NextResponse } from "next/server";

import { getInitials, recordVisit, requireAuth } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  await recordVisit(auth, request);

  return NextResponse.json({
    email: auth.email,
    name: auth.name,
    initials: getInitials(auth.name, auth.email),
  });
}
