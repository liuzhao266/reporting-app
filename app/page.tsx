"use client"

import { useState, useEffect } from "react"
import { getChadabazList, getPartyStatistics } from "@/lib/actions"
import { Navigation } from "@/components/navigation"
import { Shield, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Chadabaz } from "@/lib/types"
import { ChadabazCard } from "@/components/chadabaz-card"
import { PartyStatistics } from "@/components/party-statistics"

export default function HomePage() {
  const [chadabazList, setChadabazList] = useState<Chadabaz[]>([])
  const [partyStats, setPartyStats] = useState<{ party: string; totalReports: number; memberCount: number }[]>([])
  const [sortOrder, setSortOrder] = useState<"high-to-low" | "low-to-high" | "date-new" | "date-old">("high-to-low")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [chadabazData, partyStatsData] = await Promise.all([getChadabazList(), getPartyStatistics()])
      setChadabazList(chadabazData)
      setPartyStats(partyStatsData)
    } catch (error) {
      console.error("Error loading data:", error)
      setError("ডেটা লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পেজ রিফ্রেশ করুন।")
    } finally {
      setIsLoading(false)
    }
  }

  const sortedChadabazList = [...chadabazList].sort((a, b) => {
    switch (sortOrder) {
      case "high-to-low":
        if ((b.report_count || 0) !== (a.report_count || 0)) {
          return (b.report_count || 0) - (a.report_count || 0)
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

      case "low-to-high":
        if ((a.report_count || 0) !== (b.report_count || 0)) {
          return (a.report_count || 0) - (b.report_count || 0)
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()

      case "date-new":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

      case "date-old":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()

      default:
        return 0
    }
  })

  const getSortIcon = () => {
    switch (sortOrder) {
      case "high-to-low":
        return <ArrowDown className="h-4 w-4 text-red-500" />
      case "low-to-high":
        return <ArrowUp className="h-4 w-4 text-green-500" />
      case "date-new":
        return <ArrowDown className="h-4 w-4 text-blue-500" />
      case "date-old":
        return <ArrowUp className="h-4 w-4 text-blue-500" />
      default:
        return <ArrowUpDown className="h-4 w-4" />
    }
  }

  const getSortLabel = () => {
    switch (sortOrder) {
      case "high-to-low":
        return "সর্বোচ্চ রিপোর্ট প্রথমে"
      case "low-to-high":
        return "সর্বনিম্ন রিপোর্ট প্রথমে"
      case "date-new":
        return "নতুন প্রথমে"
      case "date-old":
        return "পুরাতন প্রথমে"
      default:
        return "সাজানো"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 bangla-text">লোড হচ্ছে...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 bangla-text mb-4">{error}</p>
            <button onClick={loadData} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 bangla-text">
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Shield className="h-16 w-16 text-red-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 bangla-text">চাঁদাবাজ.কম</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto bangla-text">
            কমিউনিটি রিপোর্টিং প্ল্যাটফর্ম - চাঁদাবাজদের বিরুদ্ধে রিপোর্ট করুন এবং সবাইকে সতর্ক করুন
          </p>
        </div>

        {/* Warning Section */}
        <Card className="border-orange-200 bg-orange-50 mb-12">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800 bangla-text">
              <AlertTriangle className="h-6 w-6" />
              <span>গুরুত্বপূর্ণ নোটিস</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 bangla-text">
              সকল রিপোর্ট যাচাই করার পর প্রকাশ করা হয়। মিথ্যা রিপোর্ট আইনগত সমস্যার কারণ হতে পারে। অনুগ্রহ করে সত্য ও সঠিক তথ্য প্রদান করুন।
              জরুরি অবস্থায় স্থানীয় আইন শৃঙ্খলা বাহিনীর সাথে যোগাযোগ করুন।
            </p>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-red-600">{chadabazList.length}</CardTitle>
              <CardDescription className="bangla-text">মোট চাঁদাবাজ</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-blue-600">
                <Shield className="h-8 w-8 mx-auto mb-2" />
              </CardTitle>
              <CardDescription className="bangla-text">কমিউনিটি সুরক্ষা</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-green-600">
                <Shield className="h-8 w-8 mx-auto mb-2" />
              </CardTitle>
              <CardDescription className="bangla-text">নিরাপদ রিপোর্টিং</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Party Statistics Section */}
        {partyStats.length > 0 && <PartyStatistics partyStats={partyStats} />}

        {/* Chadabaz Grid */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-900 bangla-text">রিপোর্টকৃত চাঁদাবাজদের তালিকা</h2>

            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
                {getSortIcon()}
                <span className="ml-2 bangla-text">{getSortLabel()}</span>
              </div>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-3 py-2 border rounded-lg bangla-text bg-white"
              >
                <option value="high-to-low">সর্বোচ্চ রিপোর্ট প্রথমে</option>
                <option value="low-to-high">সর্বনিম্ন রিপোর্ট প্রথমে</option>
                <option value="date-new">নতুন প্রথমে</option>
                <option value="date-old">পুরাতন প্রথমে</option>
              </select>
            </div>
          </div>

          {sortedChadabazList.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 bangla-text">এখনো কোনো রিপোর্ট অনুমোদিত হয়নি।</p>
              <p className="text-sm text-gray-500 bangla-text mt-2">Supabase সংযোগ করুন এবং ডেটাবেস স্ক্রিপ্ট চালান।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedChadabazList.map((chadabaz) => (
                <ChadabazCard key={chadabaz.id} chadabaz={chadabaz} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
