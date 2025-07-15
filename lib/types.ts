export interface Chadabaz {
  id: string
  name: string
  location: string
  party: string
  profile_pic_url?: string
  facebook_url?: string
  twitter_url?: string
  instagram_url?: string
  linkedin_url?: string
  youtube_url?: string
  tiktok_url?: string
  created_at: string
  updated_at: string
  report_count?: number
}

export interface Report {
  id: string
  chadabaz_id: string
  description: string
  media_urls: string[]
  status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
}

export interface ChadabazWithReports extends Chadabaz {
  reports: Report[]
}

export interface ReportFormData {
  name: string
  location: string
  party: string
  profile_picture?: File
  description: string
  media_files: File[]
  facebook_url?: string
  twitter_url?: string
  instagram_url?: string
  linkedin_url?: string
  youtube_url?: string
  tiktok_url?: string
}
