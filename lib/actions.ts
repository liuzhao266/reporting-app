"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { Chadabaz, ChadabazWithReports, AdminReport } from "./types"

// Mock data for when Supabase is not configured (updated to reflect party_id)
const mockChadabazData: Chadabaz[] = [
  {
    id: "1",
    name: "মোহাম্মদ করিম",
    location: "ঢাকা, ধানমন্ডি",
    party_id: "mock-party-1", // Mock ID
    party_name: "আওয়ামী লীগ", // Mock name
    profile_pic_url: "/placeholder.svg?height=100&width=100",
    facebook_url: "https://facebook.com/mohammad.karim",
    twitter_url: "https://twitter.com/mkarim",
    instagram_url: "https://instagram.com/mohammad_karim",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    name: "আব্দুল রহিম",
    location: "চট্টগ্রাম, আগ্রাবাদ",
    party_id: "mock-party-2", // Mock ID
    party_name: "বিএনপি", // Mock name
    profile_pic_url: "/placeholder.svg?height=100&width=100",
    facebook_url: "https://facebook.com/abdul.rahim",
    youtube_url: "https://youtube.com/@abdulrahim",
    created_at: "2024-01-10T14:20:00Z",
    updated_at: "2024-01-10T14:20:00Z",
  },
  {
    id: "3",
    name: "সালাহউদ্দিন আহমেদ",
    location: "সিলেট, জিন্দাবাজার",
    party_id: "mock-party-3", // Mock ID
    party_name: "জাতীয় পার্টি", // Mock name
    profile_pic_url: "/placeholder.svg?height=100&width=100",
    linkedin_url: "https://linkedin.com/in/salahuddin",
    tiktok_url: "https://tiktok.com/@salahuddin",
    created_at: "2024-01-05T09:15:00Z",
    updated_at: "2024-01-05T09:15:00Z",
  },
  {
    id: "4",
    name: "রফিকুল ইসলাম",
    location: "রাজশাহী, বোয়ালিয়া",
    party_id: "mock-party-1", // Mock ID
    party_name: "আওয়ামী লীগ", // Mock name
    profile_pic_url: "/placeholder.svg?height=100&width=100",
    created_at: "2024-01-08T12:00:00Z",
    updated_at: "2024-01-08T12:00:00Z",
  },
  {
    id: "5",
    name: "নাসির উদ্দিন",
    location: "খুলনা, দৌলতপুর",
    party_id: "mock-party-2", // Mock ID
    party_name: "বিএনপি", // Mock name
    profile_pic_url: "/placeholder.svg?height=100&width=100",
    created_at: "2024-01-12T08:30:00Z",
    updated_at: "2024-01-12T08:30:00Z",
  },
]

export async function getChadabazList(): Promise<Chadabaz[]> {
  const supabase = await createClient()

  if (!supabase) {
    console.log("Supabase not configured - using mock data")
    // Return empty array if no Supabase connection
    return []
  }

  try {
    // Get all chadabaz with their approved report counts and party name
    const { data, error } = await supabase
      .from("chadabaz")
      .select(`
        *,
        parties(name),
        reports!inner(status)
      `)
      .eq("reports.status", "approved")

    if (error) {
      console.error("Error fetching chadabaz list:", error)
      return []
    }

    if (!data || data.length === 0) {
      console.log("No approved reports found")
      return []
    }

    // Group by chadabaz and count reports
    const chadabazWithCounts = data.reduce((acc: Chadabaz[], current: any) => {
      const existingIndex = acc.findIndex((item) => item.id === current.id)

      if (existingIndex >= 0) {
        // Increment report count for existing chadabaz
        acc[existingIndex].report_count = (acc[existingIndex].report_count || 0) + 1
      } else {
        // Add new chadabaz with initial report count
        acc.push({
          id: current.id,
          name: current.name,
          location: current.location,
          party_id: current.party_id,
          party_name: current.parties?.name, // Get party name from joined table
          profile_pic_url: current.profile_pic_url,
          facebook_url: current.facebook_url,
          twitter_url: current.twitter_url,
          instagram_url: current.instagram_url,
          linkedin_url: current.linkedin_url,
          youtube_url: current.youtube_url,
          tiktok_url: current.tiktok_url,
          created_at: current.created_at,
          updated_at: current.updated_at,
          report_count: 1,
        })
      }
      return acc
    }, [])

    // Sort by report count (highest first), then by creation date
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
    // Get all chadabaz with their approved reports, joining with parties table
    const { data, error } = await supabase
      .from("chadabaz")
      .select(`
        id,
        parties(name),
        reports!inner(status)
      `)
      .eq("reports.status", "approved")

    if (error) {
      console.error("Error fetching party statistics:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Group by party name and count reports and unique members
    const partyStats = data.reduce((acc: any, current: any) => {
      const partyName = current.parties?.name || "Unknown Party" // Use party name from join
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

    // Convert to array and calculate member counts
    const result = Object.values(partyStats).map((stat: any) => ({
      party: stat.party,
      totalReports: stat.totalReports,
      memberCount: stat.members.size,
    }))

    // Sort by total reports (highest first)
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
    // Get chadabaz profile and party name
    const { data: chadabaz, error: chadabazError } = await supabase
      .from("chadabaz")
      .select(`
        *,
        parties(name)
      `)
      .eq("id", id)
      .single()

    if (chadabazError || !chadabaz) {
      console.error("Error fetching chadabaz profile:", chadabazError)
      return null
    }

    // Get approved reports for this chadabaz
    const { data: reports, error: reportsError } = await supabase
      .from("reports")
      .select("*")
      .eq("chadabaz_id", id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })

    if (reportsError) {
      console.error("Error fetching reports:", reportsError)
      return { ...chadabaz, reports: [] } as ChadabazWithReports
    }

    // Map chadabaz data to include party_name
    const chadabazWithPartyName: Chadabaz = {
      ...chadabaz,
      party_name: (chadabaz as any).parties?.name, // Access party name from joined data
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
        parties(name),
        reports!inner(status)
      `)
      .eq("reports.status", "approved")

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,location.ilike.%${query}%`)
    }

    if (partyName && partyName !== "all") {
      // Filter by party name from the joined parties table
      queryBuilder = queryBuilder.eq("parties.name", partyName)
    }

    const { data, error } = await queryBuilder.order("created_at", { ascending: false })

    if (error) {
      console.error("Error searching chadabaz:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Group by chadabaz and count reports
    const chadabazWithCounts = data.reduce((acc: Chadabaz[], current: any) => {
      const existingIndex = acc.findIndex((item) => item.id === current.id)

      if (existingIndex >= 0) {
        // Increment report count for existing chadabaz
        acc[existingIndex].report_count = (acc[existingIndex].report_count || 0) + 1
      } else {
        // Add new chadabaz with initial report count
        acc.push({
          id: current.id,
          name: current.name,
          location: current.location,
          party_id: current.party_id,
          party_name: current.parties?.name, // Get party name from joined table
          profile_pic_url: current.profile_pic_url,
          facebook_url: current.facebook_url,
          twitter_url: current.twitter_url,
          instagram_url: current.instagram_url,
          linkedin_url: current.linkedin_url,
          youtube_url: current.youtube_url,
          tiktok_url: current.tiktok_url,
          created_at: current.created_at,
          updated_at: current.updated_at,
          report_count: 1,
        })
      }
      return acc
    }, [])

    // Sort by report count (highest first), then by creation date
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
  const supabase = await createClient()

  if (!supabase) {
    return {
      success: false,
      message: "ডেটাবেস সংযোগ নেই। অনুগ্রহ করে পরে চেষ্টা করুন।",
    }
  }

  const name = formData.get("name") as string
  const location = formData.get("location") as string
  const partyName = formData.get("party") as string // Get party name from form
  const description = formData.get("description") as string
  const profilePicture = formData.get("profile_picture") as File

  // Get social media URLs
  const facebook_url = formData.get("facebook_url") as string
  const twitter_url = formData.get("twitter_url") as string
  const instagram_url = formData.get("instagram_url") as string
  const linkedin_url = formData.get("linkedin_url") as string
  const youtube_url = formData.get("youtube_url") as string
  const tiktok_url = formData.get("tiktok_url") as string

  // Get all media files
  const mediaFiles: File[] = []
  let index = 0
  while (formData.get(`media_${index}`)) {
    mediaFiles.push(formData.get(`media_${index}`) as File)
    index++
  }

  try {
    // 1. Find or create party
    let partyId: string
    const { data: existingParty, error: partyError } = await supabase
      .from("parties")
      .select("id")
      .eq("name", partyName)
      .single()

    if (partyError && partyError.code !== "PGRST116") {
      // PGRST116 means no rows found
      console.error("Error checking existing party:", partyError)
      throw partyError
    }

    if (existingParty) {
      partyId = existingParty.id
    } else {
      const { data: newParty, error: insertPartyError } = await supabase
        .from("parties")
        .insert({ name: partyName })
        .select("id")
        .single()

      if (insertPartyError) {
        console.error("Error creating new party:", insertPartyError)
        throw insertPartyError
      }
      partyId = newParty.id
    }

    // 2. Check if chadabaz already exists
    const { data: existingChadabaz } = await supabase
      .from("chadabaz")
      .select("id")
      .eq("name", name)
      .eq("location", location)
      .single()

    let chadabazId: string

    if (existingChadabaz) {
      chadabazId = existingChadabaz.id
    } else {
      // Upload profile picture if provided
      let profilePicUrl = null
      if (profilePicture && profilePicture.size > 0) {
        const fileExt = profilePicture.name.split(".").pop()
        const fileName = `profile_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("chadabaz-media")
          .upload(`profiles/${fileName}`, profilePicture)

        if (!uploadError) {
          const { data } = supabase.storage.from("chadabaz-media").getPublicUrl(`profiles/${fileName}`)
          profilePicUrl = data.publicUrl
        }
      }

      // Create new chadabaz with social media URLs and party_id
      const { data: newChadabaz, error: chadabazError } = await supabase
        .from("chadabaz")
        .insert({
          name,
          location,
          party_id: partyId, // Use the resolved partyId
          profile_pic_url: profilePicUrl,
          facebook_url: facebook_url || null,
          twitter_url: twitter_url || null,
          instagram_url: instagram_url || null,
          linkedin_url: linkedin_url || null,
          youtube_url: youtube_url || null,
          tiktok_url: tiktok_url || null,
        })
        .select("id")
        .single()

      if (chadabazError) {
        console.error("Error creating chadabaz:", chadabazError)
        throw chadabazError
      }

      chadabazId = newChadabaz.id
    }

    // Upload media files
    const mediaUrls: string[] = []
    for (const file of mediaFiles) {
      if (file && file.size > 0) {
        const fileExt = file.name.split(".").pop()
        const fileName = `media_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

        const { error: uploadError } = await supabase.storage.from("chadabaz-media").upload(`reports/${fileName}`, file)

        if (!uploadError) {
          const { data } = supabase.storage.from("chadabaz-media").getPublicUrl(`reports/${fileName}`)
          mediaUrls.push(data.publicUrl)
        }
      }
    }

    // Create report
    const { error: reportError } = await supabase.from("reports").insert({
      chadabaz_id: chadabazId,
      description,
      media_urls: mediaUrls,
      status: "pending",
    })

    if (reportError) {
      console.error("Error creating report:", reportError)
      throw reportError
    }

    revalidatePath("/")
    revalidatePath("/search")
    revalidatePath("/PTF/dashboard")
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
      .from("reports")
      .select(`
        *,
        chadabaz (
          name,
          location,
          party_id,
          facebook_url,
          twitter_url,
          instagram_url,
          linkedin_url,
          youtube_url,
          tiktok_url,
          parties(name)
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching admin reports:", error)
      return []
    }

    // Map data to include party_name directly in chadabaz object
    const mappedData: AdminReport[] = data.map((report: any) => ({
      ...report,
      chadabaz: report.chadabaz
        ? {
            ...report.chadabaz,
            party_name: report.chadabaz.parties?.name,
          }
        : null,
    }))

    return mappedData || []
  } catch (error) {
    console.error("Error in getAdminReports:", error)
    return []
  }
}

export async function updateReportStatus(reportId: string, status: "approved" | "rejected") {
  const supabase = await createClient()

  if (!supabase) {
    return { success: false, message: "ডেটাবেস সংযোগ নেই।" }
  }

  try {
    const { error } = await supabase.from("reports").update({ status }).eq("id", reportId)

    if (error) {
      console.error("Error updating report status:", error)
      throw error
    }

    revalidatePath("/")
    revalidatePath("/search")
    revalidatePath("/PTF/dashboard")

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
    const { error } = await supabase.from("reports").delete().eq("id", reportId)

    if (error) {
      console.error("Error deleting report:", error)
      throw error
    }

    revalidatePath("/")
    revalidatePath("/search")
    revalidatePath("/PTF/dashboard")

    return { success: true, message: "রিপোর্ট মুছে দেওয়া হয়েছে।" }
  } catch (error) {
    console.error("Error in deleteReport:", error)
    return { success: false, message: "রিপোর্ট মুছতে সমস্যা হয়েছে।" }
  }
}
