"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { getDashboardStats } from "@/lib/actions" // Will use this for stats
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react"
import { AdminNavigation } from "@/components/admin-navigation" // New navigation component
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { DashboardStats } from "@/lib/types"

export default function AdminDashboardOverview() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    loadDashboardStats()
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

  const loadDashboardStats = async () => {
    setIsLoading(true)
    try {
      const statsData = await getDashboardStats()
      setDashboardStats(statsData)
    } catch (error) {
      console.error("Error loading reports for dashboard stats:", error)
      toast({
        title: "ত্রুটি!",
        description: "ড্যাশবোর্ড পরিসংখ্যান লোড করতে সমস্যা হয়েছে।",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const stats = dashboardStats || {
    total_reports: 0,
    pending_reports: 0,
    approved_reports: 0,
    rejected_reports: 0,
    total_chadabaz: 0,
  }

  if (isLoading || !user || !dashboardStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation /> {/* Use the new admin navigation */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 bangla-text">ড্যাশবোর্ড ওভারভিউ</h2>
          <p className="text-gray-600 bangla-text">আপনার প্ল্যাটফর্মের বর্তমান অবস্থা দেখুন।</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bangla-text">মোট রিপোর্ট</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_reports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bangla-text">অপেক্ষমাণ</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_reports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bangla-text">অনুমোদিত</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved_reports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bangla-text">বাতিল</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected_reports}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/PTF/pending-reports")}
          >
            <CardHeader>
              <CardTitle className="bangla-text">অপেক্ষমাণ রিপোর্ট পর্যালোচনা করুন</CardTitle>
              <CardDescription className="bangla-text">নতুন রিপোর্টগুলো অনুমোদন বা বাতিল করুন।</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bangla-text">পর্যালোচনা শুরু করুন</Button>
            </CardContent>
          </Card>
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/PTF/all-reports")}
          >
            <CardHeader>
              <CardTitle className="bangla-text">সকল রিপোর্ট দেখুন</CardTitle>
              <CardDescription className="bangla-text">প্ল্যাটফর্মে থাকা সকল রিপোর্ট ব্রাউজ করুন।</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bangla-text bg-transparent">
                সকল রিপোর্ট দেখুন
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
