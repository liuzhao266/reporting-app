import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("Client Supabase Env Check:", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configured" : "NOT CONFIGURED",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Configured" : "NOT CONFIGURED",
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are not configured")
    return null
  }

  if (!supabaseClient) {
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}
