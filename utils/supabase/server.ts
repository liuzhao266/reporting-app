import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  console.log("Server Supabase Env Check:", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configured" : "NOT CONFIGURED",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Configured" : "NOT CONFIGURED",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Configured" : "NOT CONFIGURED",
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are not configured")
    return null
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  })
}
