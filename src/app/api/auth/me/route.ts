import { authkit } from "@workos-inc/authkit-nextjs";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  try {
    const { session } = await authkit(request);
    if (!session?.user?.email) {
      return NextResponse.json({ email: null }, { status: 401 });
    }

    const { email, firstName, lastName } = session.user;
    const name = [firstName, lastName].filter(Boolean).join(" ") || null;
    const initials = getInitials(name, email);

    return NextResponse.json({ email, name, initials });
  } catch {
    return NextResponse.json({ email: null }, { status: 401 });
  }
};

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  const local = email.split("@")[0] ?? email;
  return local.slice(0, 2).toUpperCase();
}
