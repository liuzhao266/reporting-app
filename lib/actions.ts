"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { Chadabaz, ChadabazWithReports, AdminReport, DashboardStats } from "./types" // Added DashboardStats
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"

export async function getChadabazList(): Promise<Chadabaz[]> {
  const supabase = await createClient()

  if (!supabase) {
    console.log("Supabase not configured - cannot fetch data")
    return []
  }

  try {
    const { data, error } = await supabase
      .from("chadabaz")
      .select(`
        *,
        party(name),
        report!inner(status)
      `)
      .eq("approved_status", true)
      .eq("report.status", "approved")

    if (error) {
      console.error("Error fetching chadabaz list:", error)
      return []
    }

    if (!data || data.length === 0) {
      console.log("No approved chadabaz with approved reports found")
      return []
    }

    const chadabazWithCounts = data.reduce((acc: Chadabaz[], current: any) => {
      const existingIndex = acc.findIndex((item) => item.id === current.id)

      if (existingIndex >= 0) {
        acc[existingIndex].report_count = (acc[existingIndex].report_count || 0) + 1
      } else {
        acc.push({
          id: current.id,
          name: current.name,
          area: current.area,
          political_party_id: current.political_party_id,
          party_name: current.party?.name,
          profile_picture: current.profile_picture,
          facebook_link: current.facebook_link,
          description: current.description,
          approved_status: current.approved_status,
          created_at: current.created_at,
          updated_at: current.updated_at,
          report_count: 1,
        })
      }
      return acc
    }, [])

    return chadabazWithCounts.sort((a, b) => {
      if ((b.report_count || 0) !== (a.report_count || 0)) {
        return (b.report_count || 0) - (a.report_count || 0)
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  } catch (error) {
    console.error("Error in getChadabazList:", error)
    return []
  }
}

export async function getPartyStatistics(): Promise<{ party: string; totalReports: number; memberCount: number }[]> {
  const supabase = await createClient()

  if (!supabase) {
    console.log("Supabase not configured")
    return []
  }

  try {
    const { data, error } = await supabase
      .from("chadabaz")
      .select(`
        id,
        party(name),
        report!inner(status)
      `)
      .eq("approved_status", true)
      .eq("report.status", "approved")

    if (error) {
      console.error("Error fetching party statistics:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    const partyStats = data.reduce((acc: any, current: any) => {
      const partyName = current.party?.name || "Unknown Party"
      if (!acc[partyName]) {
        acc[partyName] = {
          party: partyName,
          totalReports: 0,
          members: new Set(),
        }
      }

      acc[partyName].totalReports += 1
      acc[partyName].members.add(current.id)

      return acc
    }, {})

    const result = Object.values(partyStats).map((stat: any) => ({
      party: stat.party,
      totalReports: stat.totalReports,
      memberCount: stat.members.size,
    }))

    return result.sort((a: any, b: any) => b.totalReports - a.totalReports)
  } catch (error) {
    console.error("Error in getPartyStatistics:", error)
    return []
  }
}

export async function getChadabazProfile(id: string): Promise<ChadabazWithReports | null> {
  const supabase = await createClient()

  if (!supabase) {
    console.log("Supabase not configured")
    return null
  }

  try {
    const { data: chadabaz, error: chadabazError } = await supabase
      .from("chadabaz")
      .select(`
        *,
        party(name)
      `)
      .eq("id", id)
      .single()

    if (chadabazError || !chadabaz) {
      console.error("Error fetching chadabaz profile:", chadabazError)
      return null
    }

    const { data: reports, error: reportsError } = await supabase
      .from("report")
      .select("*")
      .eq("chadabaz_id", id)
      .eq("status", "approved")
      .order("submitted_at", { ascending: false })

    if (reportsError) {
      console.error("Error fetching reports:", reportsError)
      return { ...chadabaz, reports: [] } as ChadabazWithReports
    }

    const chadabazWithPartyName: Chadabaz = {
      ...chadabaz,
      party_name: (chadabaz as any).party?.name,
    }

    return { ...chadabazWithPartyName, reports: reports || [] } as ChadabazWithReports
  } catch (error) {
    console.error("Error in getChadabazProfile:", error)
    return null
  }
}

export async function searchChadabaz(query: string, partyName?: string): Promise<Chadabaz[]> {
  const supabase = await createClient()

  if (!supabase) {
    console.log("Supabase not configured")
    return []
  }

  try {
    let queryBuilder = supabase
      .from("chadabaz")
      .select(`
        *,
        party(name),
        report!inner(status)
      `)
      .eq("approved_status", true)
      .eq("report.status", "approved")

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,area.ilike.%${query}%`)
    }

    if (partyName && partyName !== "all") {
      queryBuilder = queryBuilder.eq("party.name", partyName)
    }

    const { data, error } = await queryBuilder.order("created_at", { ascending: false })

    if (error) {
      console.error("Error searching chadabaz:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    const chadabazWithCounts = data.reduce((acc: Chadabaz[], current: any) => {
      const existingIndex = acc.findIndex((item) => item.id === current.id)

      if (existingIndex >= 0) {
        acc[existingIndex].report_count = (acc[existingIndex].report_count || 0) + 1
      } else {
        acc.push({
          id: current.id,
          name: current.name,
          area: current.area,
          political_party_id: current.political_party_id,
          party_name: current.party?.name,
          profile_picture: current.profile_picture,
          facebook_link: current.facebook_link,
          description: current.description,
          approved_status: current.approved_status,
          created_at: current.created_at,
          updated_at: current.updated_at,
          report_count: 1,
        })
      }
      return acc
    }, [])

    return chadabazWithCounts.sort((a, b) => {
      if ((b.report_count || 0) !== (a.report_count || 0)) {
        return (b.report_count || 0) - (a.report_count || 0)
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  } catch (error) {
    console.error("Error in searchChadabaz:", error)
    return []
  }
}

export async function submitReport(formData: FormData) {
  const supabaseAdmin = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false, // Important for server-side admin client
      },
    },
  )

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY) are not configured for admin client.",
    )
    return {
      success: false,
      message: "সার্ভার কনফিগারেশন ত্রুটি। অনুগ্রহ করে পরে চেষ্টা করুন।",
    }
  }

  const name = formData.get("name") as string
  const area = formData.get("area") as string
  const partyName = formData.get("party") as string
  const chadabazDescription = formData.get("chadabaz_description") as string
  const reportText = formData.get("report_text") as string
  const profilePictureFile = formData.get("profile_picture") as File
  const facebook_link = formData.get("facebook_link") as string

  // Get media files from FormData
  const mediaFiles = formData.getAll("media_files") as File[]
  const validMediaFiles = mediaFiles.filter((file) => file.size > 0) // Filter out empty files

  try {
    // 1. Find or create party
    let politicalPartyId: string
    const { data: existingParty, error: partyError } = await supabaseAdmin
      .from("party")
      .select("id")
      .eq("name", partyName)
      .single()

    if (partyError && partyError.code !== "PGRST116") {
      console.error("Error checking existing party:", partyError)
      throw partyError
    }

    if (existingParty) {
      politicalPartyId = existingParty.id
    } else {
      const { data: newParty, error: insertPartyError } = await supabaseAdmin
        .from("party")
        .insert({ name: partyName })
        .select("id")
        .single()

      if (insertPartyError) {
        console.error("Error creating new party:", insertPartyError)
        throw insertPartyError
      }
      politicalPartyId = newParty.id
    }

    // 2. Check if chadabaz already exists
    const { data: existingChadabaz } = await supabaseAdmin
      .from("chadabaz")
      .select("id")
      .eq("name", name)
      .eq("area", area)
      .single()

    let chadabazId: string

    if (existingChadabaz) {
      chadabazId = existingChadabaz.id
    } else {
      // Upload profile picture if provided
      let profilePictureUrl = null
      if (profilePictureFile && profilePictureFile.size > 0) {
        const fileExt = profilePictureFile.name.split(".").pop()
        const fileName = `profile_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

        const { error: uploadError } = await supabaseAdmin.storage
          .from("chadabaz-media")
          .upload(`profiles/${fileName}`, profilePictureFile)

        if (!uploadError) {
          const { data } = supabaseAdmin.storage.from("chadabaz-media").getPublicUrl(`profiles/${fileName}`)
          profilePictureUrl = data.publicUrl
        }
      }

      // Create new chadabaz
      const { data: newChadabaz, error: chadabazError } = await supabaseAdmin
        .from("chadabaz")
        .insert({
          name,
          area,
          political_party_id: politicalPartyId,
          profile_picture: profilePictureUrl,
          facebook_link: facebook_link || null,
          description: chadabazDescription || null,
          approved_status: false,
        })
        .select("id")
        .single()

      if (chadabazError) {
        console.error("Error creating chadabaz:", chadabazError)
        throw chadabazError
      }

      chadabazId = newChadabaz.id
    }

    // 3. Upload media files for the report
    const mediaUrls: string[] = []
    for (const file of validMediaFiles) {
      const fileExt = file.name.split(".").pop()
      const fileName = `report_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `reports/${fileName}`

      const { error: uploadError } = await supabaseAdmin.storage.from("chadabaz-media").upload(filePath, file)

      if (uploadError) {
        console.error(`Error uploading media file ${file.name}:`, uploadError)
        // Decide whether to throw or continue without this file
        continue
      }

      const { data } = supabaseAdmin.storage.from("chadabaz-media").getPublicUrl(filePath)
      if (data?.publicUrl) {
        mediaUrls.push(data.publicUrl)
      }
    }

    // 4. Create report with media_urls
    const { error: reportError } = await supabaseAdmin.from("report").insert({
      chadabaz_id: chadabazId,
      report_text: reportText,
      media_urls: mediaUrls.length > 0 ? mediaUrls : null, // Store uploaded media URLs
      status: "pending",
      submitted_by: null,
    })

    if (reportError) {
      console.error("Error creating report:", reportError)
      throw reportError
    }

    revalidatePath("/")
    revalidatePath("/search")
    revalidatePath("/PTF/dashboard")
    revalidatePath("/PTF/pending-reports") // Revalidate new path
    revalidatePath("/PTF/all-reports") // Revalidate new path
    return { success: true, message: "রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে। পর্যালোচনার পর এটি প্রকাশিত হবে।" }
  } catch (error) {
    console.error("Error submitting report:", error)
    return { success: false, message: "রিপোর্ট জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" }
  }
}

// Admin functions
export async function getAdminReports(): Promise<AdminReport[]> {
  const supabase = await createClient()

  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from("report")
      .select(`
        *,
        chadabaz (
          name,
          area,
          political_party_id,
          profile_picture,
          facebook_link,
          description,
          approved_status,
          party(name)
        )
      `)
      .order("submitted_at", { ascending: false })

    if (error) {
      console.error("Error fetching admin reports:", error)
      return []
    }

    const mappedData: AdminReport[] = data.map((report: any) => ({
      ...report,
      chadabaz: report.chadabaz
        ? {
            ...report.chadabaz,
            party_name: report.chadabaz.party?.name,
          }
        : null,
    }))

    return mappedData || []
  } catch (error) {
    console.error("Error in getAdminReports:", error)
    return []
  }
}

export async function getPendingReports(): Promise<AdminReport[]> {
  const supabase = await createClient()

  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from("report")
      .select(`
        *,
        chadabaz (
          name,
          area,
          political_party_id,
          profile_picture,
          facebook_link,
          description,
          approved_status,
          party(name)
        )
      `)
      .eq("status", "pending") // Filter for pending reports
      .order("submitted_at", { ascending: false })

    if (error) {
      console.error("Error fetching pending reports:", error)
      return []
    }
    const mappedData: AdminReport[] = data.map((report: any) => ({
      ...report,
      chadabaz: report.chadabaz
        ? {
            ...report.chadabaz,
            party_name: report.chadabaz.party?.name,
          }
        : null,
    }))
    return mappedData || []
  } catch (error) {
    console.error("Error in getPendingReports:", error)
    return []
  }
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const supabase = await createClient()

  if (!supabase) {
    console.log("Supabase not configured")
    return null
  }

  try {
    const { data, error } = await supabase.from("admin_stats").select("*").single() // admin_stats is a view that returns a single row

    if (error) {
      console.error("Error fetching admin dashboard stats:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getDashboardStats:", error)
    return null
  }
}

export async function updateReportStatus(reportId: string, status: "approved" | "rejected") {
  const supabaseAdmin = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  if (!supabaseAdmin) {
    return { success: false, message: "ডেটাবেস সংযোগ নেই।" }
  }

  try {
    // Get the report to find chadabaz_id
    const { data: reportData, error: fetchReportError } = await supabaseAdmin
      .from("report")
      .select("chadabaz_id")
      .single()

    if (fetchReportError || !reportData) {
      console.error("Error fetching report for status update:", fetchReportError)
      throw fetchReportError
    }

    const chadabazId = reportData.chadabaz_id

    // Update report status
    const { error: updateReportError } = await supabaseAdmin.from("report").update({ status }).eq("id", reportId)

    if (updateReportError) {
      console.error("Error updating report status:", updateReportError)
      throw updateReportError
    }

    // If approved, update chadabaz approved_status
    if (status === "approved" && chadabazId) {
      const { error: updateChadabazError } = await supabaseAdmin
        .from("chadabaz")
        .update({ approved_status: true })
        .eq("id", chadabazId)

      if (updateChadabazError) {
        console.error("Error updating chadabaz approved_status:", updateChadabazError)
        throw updateChadabazError
      }
    }

    revalidatePath("/")
    revalidatePath("/search")
    revalidatePath("/PTF/dashboard")
    revalidatePath("/PTF/pending-reports")
    revalidatePath("/PTF/all-reports")

    return {
      success: true,
      message: status === "approved" ? "রিপোর্ট অনুমোদন করা হয়েছে।" : "রিপোর্ট বাতিল করা হয়েছে।",
    }
  } catch (error) {
    console.error("Error in updateReportStatus:", error)
    return { success: false, message: "স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।" }
  }
}

export async function deleteReport(reportId: string) {
  const supabase = await createClient()

  if (!supabase) {
    return { success: false, message: "ডেটাবেস সংযোগ নেই।" }
  }

  try {
    const { error } = await supabase.from("report").delete().eq("id", reportId)

    if (error) {
      console.error("Error deleting report:", error)
      throw error
    }

    revalidatePath("/")
    revalidatePath("/search")
    revalidatePath("/PTF/dashboard")
    revalidatePath("/PTF/pending-reports") // Revalidate new path
    revalidatePath("/PTF/all-reports") // Revalidate new path

    return { success: true, message: "রিপোর্ট মুছে দেওয়া হয়েছে।" }
  } catch (error) {
    console.error("Error in deleteReport:", error)
    return { success: false, message: "রিপোর্ট মুছতে সমস্যা হয়েছে।" }
  }
}
