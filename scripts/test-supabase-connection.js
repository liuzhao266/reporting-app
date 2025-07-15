import { createClient } from "@supabase/supabase-js"

async function testSupabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log("Attempting to connect to Supabase...")
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "Configured" : "NOT CONFIGURED"}`)
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? "Configured" : "NOT CONFIGURED"}`)

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error(
      "Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured in environment variables.",
    )
    console.error(
      "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Vercel project environment variables.",
    )
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Attempt a simple query to verify connection and permissions
    const { data, error } = await supabase.from("chadabaz").select("id").limit(1)

    if (error) {
      console.error("Supabase connection or query failed:", error.message)
      console.error(
        "Possible reasons: Incorrect Service Role Key, database not fully ready, or RLS issues for service_role (less likely for schema scripts).",
      )
    } else {
      console.log("Successfully connected to Supabase and performed a query!")
      console.log("Database connection appears to be working.")
      if (data && data.length > 0) {
        console.log("Found existing 'chadabaz' data.")
      } else {
        console.log("No 'chadabaz' data found (which is expected if schema is not yet created).")
      }
    }
  } catch (e) {
    console.error("An unexpected error occurred during Supabase connection test:", e.message)
  }
}

testSupabaseConnection()
