"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { getAdminReports, updateReportStatus, deleteReport } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Shield,
  LogOut,
  CheckCircle,
  XCircle,
  Trash2,
  FileText,
  Clock,
  Eye,
  Calendar,
  MapPin,
  Flag,
  Play,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MediaViewer } from "@/components/media-viewer"
import { SocialMediaLinks } from "@/components/social-media-links"
import type { AdminReport } from "@/lib/types" // Import AdminReport type

export default function AdminDashboard() {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [selectedMedia, setSelectedMedia] = useState<string[]>([])
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    loadReports()
    // No need for router.refresh() here, loadReports() handles initial fetch
  }, [])

  const checkAuth = async () => {
    if (!supabase) {
      // Mock authentication check
      setUser({ email: "admin@chadabaz.com" })
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/PTF")
      return
    }

    setUser(user)
  }

  const loadReports = async () => {
    setIsLoading(true)
    try {
      const reportsData = await getAdminReports()
      setReports(reportsData)
    } catch (error) {
      console.error("Error loading reports:", error)
      toast({
        title: "ত্রুটি!",
        description: "রিপোর্ট লোড করতে সমস্যা হয়েছে।",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push("/PTF")
  }

  const handleApprove = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      const result = await updateReportStatus(reportId, "approved")

      if (result.success) {
        toast({
          title: "সফল!",
          description: result.message,
        })
        router.refresh() // Invalidate cache and trigger re-render of server components
        await loadReports() // Explicitly re-fetch data for this client component
      } else {
        toast({
          title: "ত্রুটি!",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "ত্রুটি!",
        description: "রিপোর্ট অনুমোদন করতে সমস্যা হয়েছে।",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      const result = await updateReportStatus(reportId, "rejected")

      if (result.success) {
        toast({
          title: "সফল!",
          description: result.message,
          variant: "destructive",
        })
        router.refresh() // Invalidate cache and trigger re-render of server components
        await loadReports() // Explicitly re-fetch data for this client component
      } else {
        toast({
          title: "ত্রুটি!",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "ত্রুটি!",
        description: "রিপোর্ট বাতিল করতে সমস্যা হয়েছে।",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      const result = await deleteReport(reportId)

      if (result.success) {
        toast({
          title: "সফল!",
          description: result.message,
        })
        router.refresh() // Invalidate cache and trigger re-render of server components
        await loadReports() // Explicitly re-fetch data for this client component
      } else {
        toast({
          title: "ত্রুটি!",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "ত্রুটি!",
        description: "রিপোর্ট মুছতে সমস্যা হয়েছে।",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            অপেক্ষমাণ
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            অনুমোদিত
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            বাতিল
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    approved: reports.filter((r) => r.status === "approved").length,
    rejected: reports.filter((r) => r.status === "rejected").length,
  }

  const openMediaViewer = (mediaUrls: string[], index = 0) => {
    setSelectedMedia(mediaUrls)
    setSelectedMediaIndex(index)
    setIsMediaViewerOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 bangla-text">অ্যাডমিন প্যানেল</h1>
                <p className="text-sm text-gray-600 bangla-text">চাঁদাবাজ.কম - প্রশাসনিক নিয়ন্ত্রণ</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 bangla-text">স্বাগতম, {user.email}</span>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="bangla-text">লগআউট</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bangla-text">মোট রিপোর্ট</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bangla-text">অপেক্ষমাণ</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bangla-text">অনুমোদিত</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bangla-text">বাতিল</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle className="bangla-text">রিপোর্ট তালিকা</CardTitle>
            <CardDescription className="bangla-text">সকল জমাকৃত রিপোর্ট এবং তাদের অবস্থা</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 bangla-text">কোনো রিপোর্ট পাওয়া যায়নি।</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-6 bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 bangla-text">
                            👤 {report.chadabaz?.name || "অজানা"}
                          </h3>
                          {getStatusBadge(report.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span className="bangla-text">📍 এলাকা: {report.chadabaz?.location || "অজানা"}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Flag className="h-4 w-4 mr-2" />
                            <span className="bangla-text">🏳️ দল: {report.chadabaz?.party_name || "অজানা"}</span>{" "}
                            {/* Use party_name */}
                          </div>
                        </div>

                        {/* Social media links */}
                        {(report.chadabaz?.facebook_url ||
                          report.chadabaz?.twitter_url ||
                          report.chadabaz?.instagram_url ||
                          report.chadabaz?.linkedin_url ||
                          report.chadabaz?.youtube_url ||
                          report.chadabaz?.tiktok_url) && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2 bangla-text">সোশ্যাল মিডিয়া:</h5>
                            <SocialMediaLinks
                              facebook_url={report.chadabaz?.facebook_url}
                              twitter_url={report.chadabaz?.twitter_url}
                              instagram_url={report.chadabaz?.instagram_url}
                              linkedin_url={report.chadabaz?.linkedin_url}
                              youtube_url={report.chadabaz?.youtube_url}
                              tiktok_url={report.chadabaz?.tiktok_url}
                              size="sm"
                              showLabels={true}
                            />
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="bangla-text">📅 {formatDate(report.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2 bangla-text">রিপোর্ট বিবরণ:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded bangla-text">{report.description}</p>
                    </div>

                    {report.media_urls.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-3 bangla-text">
                          সংযুক্ত প্রমাণ ({report.media_urls.length}টি):
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {report.media_urls.map((url, index) => {
                            const isVideo = url.match(/\.(mp4|webm|mov|avi)$/i)
                            const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i)

                            return (
                              <div
                                key={index}
                                className="relative group cursor-pointer border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                onClick={() => openMediaViewer(report.media_urls, index)}
                              >
                                {isImage && (
                                  <img
                                    src={url || "/placeholder.svg"}
                                    alt={`প্রমাণ ${index + 1}`}
                                    className="w-full h-24 object-cover"
                                  />
                                )}
                                {isVideo && (
                                  <div className="relative w-full h-24 bg-gray-200 flex items-center justify-center">
                                    <video src={url} className="w-full h-full object-cover" muted />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                      <Play className="h-6 w-6 text-white" />
                                    </div>
                                  </div>
                                )}
                                {!isImage && !isVideo && (
                                  <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-gray-500" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {report.status === "pending" && (
                        <>
                          <Button
                            onClick={() => handleApprove(report.id)}
                            disabled={actionLoading === report.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span className="bangla-text">অনুমোদন করুন</span>
                          </Button>
                          <Button
                            onClick={() => handleReject(report.id)}
                            disabled={actionLoading === report.id}
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            <span className="bangla-text">বাতিল করুন</span>
                          </Button>
                        </>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50 bg-transparent"
                            disabled={actionLoading === report.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span className="bangla-text">মুছুন</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="bangla-text">রিপোর্ট মুছে দিন</AlertDialogTitle>
                            <AlertDialogDescription className="bangla-text">
                              আপনি কি নিশ্চিত যে এই রিপোর্টটি মুছে দিতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bangla-text">বাতিল</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(report.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <span className="bangla-text">মুছে দিন</span>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <MediaViewer
          mediaUrls={selectedMedia}
          isOpen={isMediaViewerOpen}
          onClose={() => setIsMediaViewerOpen(false)}
          initialIndex={selectedMediaIndex}
        />
      </main>
    </div>
  )
}
