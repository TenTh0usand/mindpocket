import { type NextRequest, NextResponse } from "next/server"

const publicRoutes = ["/login", "/signup", "/api/auth", "/api/check-registration"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get("origin") ?? ""
  const authorization = request.headers.get("authorization") ?? ""
  const isChromeExtension = origin.startsWith("chrome-extension://")
  const hasBearerToken = authorization.startsWith("Bearer ")

  // Allow extension preflight requests for API routes.
  if (request.method === "OPTIONS" && isChromeExtension && pathname.startsWith("/api/")) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    })
  }

  // Public routes do not require an authenticated session cookie.
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    const response = NextResponse.next()
    if (isChromeExtension) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Credentials", "true")
    }
    return response
  }

  // API token based ingest requests should bypass the session-cookie redirect.
  if (pathname === "/api/ingest" && hasBearerToken) {
    return NextResponse.next()
  }

  const sessionToken =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token")

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const response = NextResponse.next()
  if (isChromeExtension) {
    response.headers.set("Access-Control-Allow-Origin", origin)
    response.headers.set("Access-Control-Allow-Credentials", "true")
  }
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
