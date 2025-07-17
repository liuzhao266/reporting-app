"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { ChadabazCard } from "@/components/chadabaz-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { searchChadabaz } from "@/lib/actions"
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { Chadabaz } from "@/lib/types"

export default function SearchPage() {
  const [results, setResults] = useState<Chadabaz[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedParty, setSelectedParty] = useState("all")
  const [sortBy, setSortBy] = useState("reports-high") // "reports-high", "reports-low", "date-new", "date-old"

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      const partyFilter = selectedParty === "all" ? undefined : selectedParty
      const searchResults = await searchChadabaz(searchQuery, partyFilter)

      // Apply sorting based on user selection
      const sortedResults = [...searchResults].sort((a, b) => {
        switch (sortBy) {
          case "reports-high":
            if ((b.report_count || 0) !== (a.report_count || 0)) {
              return (b.report_count || 0) - (a.report_count || 0)
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

          case "reports-low":
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

      setResults(sortedResults)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Load all results initially
    handleSearch()
  }, [sortBy]) // Re-run when sort changes

  useEffect(() => {
    // Load all results initially
    handleSearch()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  const getSortIcon = () => {
    switch (sortBy) {
      case "reports-high":
        return <ArrowDown className="h-4 w-4 text-red-500" />
      case "reports-low":
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
    switch (sortBy) {
      case "reports-high":
        return "সর্বোচ্চ রিপোর্ট প্রথমে"
      case "reports-low":
        return "সর্বনিম্ন রিপোর্ট প্রথমে"
      case "date-new":
        return "নতুন প্রথমে"
      case "date-old":
        return "পুরাতন প্রথমে"
      default:
        return "সাজানো"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <Search className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2 bangla-text">খুঁজুন</h1>
            <p className="text-gray-600 bangla-text">নাম বা এলাকা দিয়ে চাঁদাবাজদের খুঁজুন</p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search" className="bangla-text">
                    নাম বা এলাকা
                  </Label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="নাম বা এলাকা লিখুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bangla-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="bangla-text">রাজনৈতিক দল</Label>
                  <Select value={selectedParty} onValueChange={setSelectedParty}>
                    <SelectTrigger className="bangla-text">
                      <SelectValue placeholder="দল নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="bangla-text">
                        সব দল
                      </SelectItem>
                      <SelectItem value="আওয়ামী লীগ" className="bangla-text">
                        আওয়ামী লীগ
                      </SelectItem>
                      <SelectItem value="বাংলাদেশ জাতীয়তাবাদী দল (বিএনপি)" className="bangla-text">
                        বাংলাদেশ জাতীয়তাবাদী দল (বিএনপি)
                      </SelectItem>
                      <SelectItem value="জাতীয় পার্টি (এরশাদ)" className="bangla-text">
                        জাতীয় পার্টি (এরশাদ)
                      </SelectItem>
                      <SelectItem value="জামায়াতে ইসলামী বাংলাদেশ" className="bangla-text">
                        জামায়াতে ইসলামী বাংলাদেশ
                      </SelectItem>
                      <SelectItem value="বাংলাদেশ তরিকত ফেডারেশন" className="bangla-text">
                        বাংলাদেশ তরিকত ফেডারেশন
                      </SelectItem>
                      <SelectItem value="জাতীয় সমাজতান্ত্রিক দল (জাসদ)" className="bangla-text">
                        জাতীয় সমাজতান্ত্রিক দল (জাসদ)
                      </SelectItem>
                      <SelectItem value="বাংলাদেশ ওয়ার্কার্স পার্টি" className="bangla-text">
                        বাংলাদেশ ওয়ার্কার্স পার্টি
                      </SelectItem>
                      <SelectItem value="গণতন্ত্রী পার্টি" className="bangla-text">
                        গণতন্ত্রী পার্টি
                      </SelectItem>
                      <SelectItem value="লিবারেল ডেমোক্রেটিক পার্টি (এলডিপি)" className="bangla-text">
                        লিবারেল ডেমোক্রেটিক পার্টি (এলডিপি)
                      </SelectItem>
                      <SelectItem value="বাংলাদেশ খেলাফত মজলিস" className="bangla-text">
                        বাংলাদেশ খেলাফত মজলিস
                      </SelectItem>
                      <SelectItem value="ইসলামী ঐক্যজোট" className="bangla-text">
                        ইসলামী ঐক্যজোট
                      </SelectItem>
                      <SelectItem value="গণ অধিকার পরিষদ" className="bangla-text">
                        গণ অধিকার পরিষদ
                      </SelectItem>
                      <SelectItem value="জাতীয় নাগরিক পার্টি (এনসিপি)" className="bangla-text">
                        জাতীয় নাগরিক পার্টি (এনসিপি)
                      </SelectItem>
                      <SelectItem value="বাংলাদেশ কল্যাণ পার্টি" className="bangla-text">
                        বাংলাদেশ কল্যাণ পার্টি
                      </SelectItem>
                      <SelectItem value="জাতীয় মুক্তি কাউন্সিল" className="bangla-text">
                        জাতীয় মুক্তি কাউন্সিল
                      </SelectItem>
                      <SelectItem value="বিপ্লবী ওয়ার্কার্স পার্টি" className="bangla-text">
                        বিপ্লবী ওয়ার্কার্স পার্টি
                      </SelectItem>
                      <SelectItem value="গণফোরাম" className="bangla-text">
                        গণফোরাম
                      </SelectItem>
                      <SelectItem value="সম্মিলিত সামাজিক আন্দোলন" className="bangla-text">
                        সম্মিলিত সামাজিক আন্দোলন
                      </SelectItem>
                      <SelectItem value="অন্যান্য" className="bangla-text">
                        অন্যান্য
                      </SelectItem>
                      <SelectItem value="কোনো দলের সাথে সম্পৃক্ত নয়" className="bangla-text">
                        কোনো দলের সাথে সম্পৃক্ত নয়
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Enhanced sorting dropdown */}
                <div className="space-y-2">
                  <Label className="bangla-text">সাজানোর ধরন</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bangla-text">
                      <SelectValue placeholder="সাজানোর ধরন নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reports-high" className="bangla-text">
                        <div className="flex items-center">
                          <ArrowDown className="h-4 w-4 mr-2 text-red-500" />
                          সর্বোচ্চ রিপোর্ট প্রথমে
                        </div>
                      </SelectItem>
                      <SelectItem value="reports-low" className="bangla-text">
                        <div className="flex items-center">
                          <ArrowUp className="h-4 w-4 mr-2 text-green-500" />
                          সর্বনিম্ন রিপোর্ট প্রথমে
                        </div>
                      </SelectItem>
                      <SelectItem value="date-new" className="bangla-text">
                        <div className="flex items-center">
                          <ArrowDown className="h-4 w-4 mr-2 text-blue-500" />
                          নতুন প্রথমে
                        </div>
                      </SelectItem>
                      <SelectItem value="date-old" className="bangla-text">
                        <div className="flex items-center">
                          <ArrowUp className="h-4 w-4 mr-2 text-blue-500" />
                          পুরাতন প্রথমে
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Search className="mr-2 h-4 w-4 animate-spin" />
                        <span className="bangla-text">খুঁজছি...</span>
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        <span className="bangla-text">খুঁজুন</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Results */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 bangla-text">খোঁজার ফলাফল ({results.length}টি)</h2>
              <div className="flex items-center text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
                {getSortIcon()}
                <span className="ml-2 bangla-text">{getSortLabel()}</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 bangla-text">খুঁজছি...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 bangla-text">
                {searchQuery || selectedParty ? "কোনো ফলাফল পাওয়া যায়নি।" : "কোনো রিপোর্ট এখনো অনুমোদিত হয়নি।"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((chadabaz) => (
                <ChadabazCard key={chadabaz.id} chadabaz={chadabaz} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
