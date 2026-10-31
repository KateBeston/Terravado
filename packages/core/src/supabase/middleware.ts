import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY, IS_SUPABASE_CONFIGURED } from "./config";

/** Paths reachable without a signed-in user: the login page, the auth
    callback/signout routes, the API (which does its own auth and must not be
    bounced to an HTML login page), and invite acceptance (a new user following
    an invite link isn't signed in yet). Everything else is gated. */
function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/invite")
  );
}

/** Refresh the Supabase session on every request, and gate protected routes:
    a signed-out visitor to a protected path is redirected to /login. This is
    defence in depth over the per-page requireUser() guards — a page that forgets
    its guard can no longer render to an anonymous visitor. No-ops in dev mode
    (Supabase not configured), where a stand-in user is used instead. */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  if (!IS_SUPABASE_CONFIGURED) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Fail closed: if the user can't be confirmed (no session, or the auth check
  // errors), treat the request as signed-out rather than letting it through.
  let user = null;
  try {
    user = (await supabase.auth.getUser()).data.user;
  } catch {
    user = null;
  }

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
