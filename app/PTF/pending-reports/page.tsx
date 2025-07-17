"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link" // Import Link
import { createClient } from "@/utils/supabase/client"
import { getPendingReports, updateReportStatus, deleteReport } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, Trash2, FileText, Clock, Calendar, MapPin, Flag, Play } from "lucide-react"
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
import { SocialMediaLinks } from "@/components/social-media-links"
import { MediaViewer } from "@/components/media-viewer"
import { AdminNavigation } from "@/components/admin-navigation"
import type { AdminReport } from "@/lib/types"

export default function PendingReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false)
  const [currentMediaUrls, setCurrentMediaUrls] = useState<string[]>([])
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    loadReports()
  }, [])

  const checkAuth = async () => {
    if (!supabase) {
      setUser({ email: "admin@chadabaz.com" }) // Demo mode
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
      const reportsData = await getPendingReports()
      setReports(reportsData)
    } catch (error) {
      console.error("Error loading pending reports:", error)
      toast({
        title: "ত্রুটি!",
        description: "অপেক্ষমাণ রিপোর্ট লোড করতে সমস্যা হয়েছে।",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      const result = await updateReportStatus(reportId, "approved")
      if (result.success) {
        toast({ title: "সফল!", description: result.message })
        await loadReports()
      } else {
        toast({ title: "ত্রুটি!", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "ত্রুটি!", description: "রিপোর্ট অনুমোদন করতে সমস্যা হয়েছে।", variant: "destructive" })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      const result = await updateReportStatus(reportId, "rejected")
      if (result.success) {
        toast({ title: "সফল!", description: result.message, variant: "destructive" })
        await loadReports()
      } else {
        toast({ title: "ত্রুটি!", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "ত্রুটি!", description: "রিপোর্ট বাতিল করতে সমস্যা হয়েছে।", variant: "destructive" })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      const result = await deleteReport(reportId)
      if (result.success) {
        toast({ title: "সফল!", description: result.message })
        await loadReports()
      } else {
        toast({ title: "ত্রুটি!", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "ত্রুটি!", description: "রিপোর্ট মুছতে সমস্যা হয়েছে।", variant: "destructive" })
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

  const openMediaViewer = (mediaUrls: string[], index: number) => {
    setCurrentMediaUrls(mediaUrls)
    setCurrentMediaIndex(index)
    setIsMediaViewerOpen(true)
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 bangla-text">অপেক্ষমাণ রিপোর্ট</h2>
          <p className="text-gray-600 bangla-text">পর্যালোচনার জন্য অপেক্ষমাণ রিপোর্টগুলো এখানে দেখুন।</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="bangla-text">অপেক্ষমাণ রিপোর্ট তালিকা ({reports.length}টি)</CardTitle>
            <CardDescription className="bangla-text">নতুন রিপোর্টগুলো অনুমোদন বা বাতিল করুন।</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 bangla-text">কোনো অপেক্ষমাণ রিপোর্ট নেই।</p>
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
                            <span className="bangla-text">📍 এলাকা: {report.chadabaz?.area || "অজানা"}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Flag className="h-4 w-4 mr-2" />
                            <span className="bangla-text">🏳️ দল: {report.chadabaz?.party_name || "অজানা"}</span>
                          </div>
                        </div>

                        {report.chadabaz?.facebook_link && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2 bangla-text">সোশ্যাল মিডিয়া:</h5>
                            <SocialMediaLinks
                              facebook_link={report.chadabaz?.facebook_link}
                              size="sm"
                              showLabels={true}
                            />
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="bangla-text">📅 {formatDate(report.submitted_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2 bangla-text">রিপোর্ট বিবরণ:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded bangla-text">{report.report_text}</p>
                    </div>

                    {report.media_urls && report.media_urls.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2 bangla-text">প্রমাণ:</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {report.media_urls.map((url: string, index: number) => (
                            <div
                              key={index}
                              className="relative w-full aspect-video rounded-md overflow-hidden bg-gray-200 cursor-pointer"
                              onClick={() => openMediaViewer(report.media_urls!, index)}
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

                    <div className="flex flex-wrap gap-2">
                      <Link href={`/PTF/reports/${report.id}`} passHref>
                        <Button
                          variant="outline"
                          className="border-gray-600 text-gray-600 hover:bg-gray-50 bg-transparent"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          <span className="bangla-text">পর্যালোচনা করুন</span>
                        </Button>
                      </Link>
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
        {isMediaViewerOpen && (
          <MediaViewer
            mediaUrls={currentMediaUrls}
            isOpen={isMediaViewerOpen}
            onClose={() => setIsMediaViewerOpen(false)}
            initialIndex={currentMediaIndex}
          />
        )}
      </main>
    </div>
  )
}
