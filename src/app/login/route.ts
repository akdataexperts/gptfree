import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";

export const GET = async () => {
  const signInUrl = await getSignInUrl();
  return NextResponse.redirect(signInUrl);
};
