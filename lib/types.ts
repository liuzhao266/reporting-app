export interface PartySchema {
  id: string
  name: string
  total_reports: number
  created_at: string
  updated_at: string
}

export interface Chadabaz {
  id: string
  name: string
  area: string
  political_party_id: string
  party_name?: string
  profile_picture?: string
  facebook_link?: string
  description?: string
  approved_status: boolean
  created_at: string
  updated_at: string
  report_count?: number
}

export interface Report {
  id: string
  chadabaz_id: string
  report_text: string
  media_urls?: string[] // Re-added media_urls
  submitted_by: string | null
  submitted_at: string
  status: "pending" | "approved" | "rejected"
}

export interface ChadabazWithReports extends Chadabaz {
  reports: Report[]
}

export interface AdminReport {
  id: string
  report_text: string
  media_urls?: string[] // Re-added media_urls
  submitted_by: string | null
  submitted_at: string
  status: "pending" | "approved" | "rejected"
  chadabaz: {
    name: string
    area: string
    political_party_id: string
    party_name?: string
    profile_picture?: string
    facebook_link?: string
    description?: string
    approved_status: boolean
  } | null
}

export interface ReportFormData {
  name: string
  area: string
  party: string
  profile_picture?: File
  chadabaz_description: string
  report_text: string
  facebook_link?: string
  media_files?: File[] // Re-added media_files for form submission
}
