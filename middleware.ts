import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Check if accessing admin dashboard or any admin sub-route
  if (
    request.nextUrl.pathname.startsWith("/PTF/dashboard") ||
    request.nextUrl.pathname.startsWith("/PTF/pending-reports") ||
    request.nextUrl.pathname.startsWith("/PTF/all-reports")
  ) {
    // Skip auth check if Supabase is not configured (for demo purposes)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return supabaseResponse
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/PTF", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/PTF/dashboard/:path*", "/PTF/pending-reports/:path*", "/PTF/all-reports/:path*"],
}
