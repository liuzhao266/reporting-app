"use client"
import { getChadabazProfile } from "@/lib/actions"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Calendar, FileText, Play } from "lucide-react" // Re-added Play icon
import { notFound } from "next/navigation"
import { SocialMediaLinks } from "@/components/social-media-links"
import { MediaViewer } from "@/components/media-viewer" // Re-added MediaViewer import
import { useState } from "react" // Added useState import
import type { ChadabazWithReports } from "@/lib/types"

interface ProfilePageProps {
  params: { id: string }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = params
  const profile: ChadabazWithReports | null = await getChadabazProfile(id)

  if (!profile) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {profile.profile_picture ? (
                    <img
                      src={profile.profile_picture || "/placeholder.svg"}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Users className="h-16 w-16" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4 bangla-text">👤 নাম: {profile.name}</h1>

                  <div className="space-y-3">
                    <div className="flex items-center justify-center md:justify-start text-gray-600">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span className="bangla-text">📍 এলাকা: {profile.area}</span>
                    </div>

                    <div className="flex items-center justify-center md:justify-start">
                      <span className="bangla-text mr-2">🏳️ রাজনৈতিক দল:</span>
                      <Badge variant="outline" className="bangla-text">
                        {profile.party_name}
                      </Badge>
                    </div>

                    {profile.description && (
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 bangla-text">সম্পর্কে:</h4>
                        <p className="text-gray-700 whitespace-pre-wrap bangla-text">{profile.description}</p>
                      </div>
                    )}

                    {profile.facebook_link && (
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 bangla-text">সোশ্যাল মিডিয়া প্রোফাইল:</h4>
                        <SocialMediaLinks facebook_link={profile.facebook_link} size="md" showLabels={true} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 bangla-text">
                <FileText className="h-6 w-6" />
                <span>🧾 রিপোর্টসমূহ ({profile.reports.length}টি)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.reports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 bangla-text">কোনো অনুমোদিত রিপোর্ট নেই।</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {profile.reports.map((report) => (
                    <ReportCard key={report.id} report={report} formatDate={formatDate} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function ReportCard({ report, formatDate }: { report: any; formatDate: (date: string) => string }) {
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)

  const openMediaViewer = (index: number) => {
    setCurrentMediaIndex(index)
    setIsMediaViewerOpen(true)
  }

  return (
    <>
      <div className="border-l-4 border-red-500 pl-6 pb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600 bangla-text">📅 রিপোর্টের তারিখ: {formatDate(report.submitted_at)}</span>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold mb-2 bangla-text">রিপোর্টকারীর বিবরণ:</h4>
          <p className="text-gray-700 whitespace-pre-wrap bangla-text">{report.report_text}</p>
        </div>

        {/* Media display section re-added */}
        {report.media_urls && report.media_urls.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2 bangla-text">প্রমাণ:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {report.media_urls.map((url: string, index: number) => (
                <div
                  key={index}
                  className="relative w-full aspect-video rounded-md overflow-hidden bg-gray-200 cursor-pointer"
                  onClick={() => openMediaViewer(index)}
                >
                  {url.match(/\.(mp4|webm|mov|avi)$/i) ? (
                    <video src={url} className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Proof ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {isMediaViewerOpen && report.media_urls && report.media_urls.length > 0 && (
        <MediaViewer
          mediaUrls={report.media_urls}
          isOpen={isMediaViewerOpen}
          onClose={() => setIsMediaViewerOpen(false)}
          initialIndex={currentMediaIndex}
        />
      )}
    </>
  )
}
