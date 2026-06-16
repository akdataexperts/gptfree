import { handleAuth } from "@workos-inc/authkit-nextjs";
import { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
  const authHandler = handleAuth({ returnPathname: "/" });
  return authHandler(request);
};
