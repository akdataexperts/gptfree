import { handleAuth } from "@workos-inc/authkit-nextjs";
import { NextRequest } from "next/server";

function getBaseURL(request: NextRequest): string {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  const host = request.headers.get("host");
  if (host) {
    return `https://${host}`;
  }

  return "https://gptfree-theta.vercel.app";
}

export const GET = async (request: NextRequest) => {
  const authHandler = handleAuth({
    returnPathname: "/",
    baseURL: getBaseURL(request),
  });
  return authHandler(request);
};
