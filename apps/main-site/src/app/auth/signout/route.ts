import { NextResponse } from "next/server";
import { createClient } from "@terravado/core/supabase/server";
import { IS_SUPABASE_CONFIGURED } from "@terravado/core/supabase/config";

export async function POST(request: Request) {
  if (IS_SUPABASE_CONFIGURED) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`, { status: 302 });
}
