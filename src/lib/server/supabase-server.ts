import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "public" },
  global: {
    fetch: (url, options = {}) =>
      fetch(url, { ...options, signal: AbortSignal.timeout(60_000) }),
  },
});
