"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import { FileText, AlertCircle, X } from "lucide-react" // Added Upload and X icons
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { submitReport } from "@/lib/actions"

export default function ReportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    area: "",
    party: "",
    chadabaz_description: "",
    report_text: "",
    facebook_link: "",
  })
  const [mediaFiles, setMediaFiles] = useState<File[]>([]) // Re-added mediaFiles state
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files))
    }
  }

  const handleRemoveFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (
      !formData.name.trim() ||
      !formData.area.trim() ||
      !formData.report_text.trim() ||
      !formData.party ||
      formData.party === ""
    ) {
      toast({
        title: "ত্রুটি!",
        description: "অনুগ্রহ করে সকল প্রয়োজনীয় ফিল্ড পূরণ করুন।",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const form = e.currentTarget
    const data = new FormData(form)

    data.append("party", formData.party)
    data.append("area", formData.area)
    data.append("chadabaz_description", formData.chadabaz_description)
    data.append("report_text", formData.report_text)
    data.append("facebook_link", formData.facebook_link)

    // Append media files
    mediaFiles.forEach((file) => {
      data.append("media_files", file)
    })

    try {
      const result = await submitReport(data)

      if (result.success) {
        toast({
          title: "সফল!",
          description: result.message,
        })

        setFormData({
          name: "",
          area: "",
          party: "",
          chadabaz_description: "",
          report_text: "",
          facebook_link: "",
        })
        setMediaFiles([]) // Reset media files

        router.push("/")
      } else {
        toast({
          title: "ত্রুটি!",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: "ত্রুটি!",
        description: "রিপোর্ট জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <FileText className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2 bangla-text">রিপোর্ট জমা দিন</h1>
            <p className="text-gray-600 bangla-text">চাঁদাবাজদের বিরুদ্ধে রিপোর্ট করে কমিউনিটিকে সুরক্ষিত রাখুন</p>
          </div>

          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="bangla-text">
              সকল তথ্য যাচাই করার পর প্রকাশ করা হবে। অনুগ্রহ করে সত্য ও সঠিক তথ্য প্রদান করুন।
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="bangla-text">রিপোর্টের বিস্তারিত</CardTitle>
              <CardDescription className="bangla-text">
                যতটা সম্ভব বিস্তারিত তথ্য প্রদান করুন যাতে অন্যরা সতর্ক থাকতে পারে
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="bangla-text">
                    নাম *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="চাঁদাবাজের নাম লিখুন"
                    required
                    className="bangla-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area" className="bangla-text">
                    এলাকা *
                  </Label>
                  <Input
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="কোন এলাকায় এই ঘটনা ঘটেছে?"
                    required
                    className="bangla-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="party" className="bangla-text">
                    রাজনৈতিক দল *
                  </Label>
                  <Select
                    value={formData.party}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, party: value }))}
                  >
                    <SelectTrigger className="bangla-text" name="party">
                      <SelectValue placeholder="রাজনৈতিক দল নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
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

                <div className="space-y-2">
                  <Label htmlFor="chadabaz_description" className="bangla-text">
                    চাঁদাবাজের সাধারণ বিবরণ (ঐচ্ছিক)
                  </Label>
                  <Textarea
                    id="chadabaz_description"
                    name="chadabaz_description"
                    value={formData.chadabaz_description}
                    onChange={handleInputChange}
                    placeholder="চাঁদাবাজ সম্পর্কে একটি সাধারণ বিবরণ দিন (যেমন: তার কার্যকলাপ, পরিচিতি)"
                    rows={3}
                    className="bangla-text"
                  />
                  <p className="text-sm text-gray-600 bangla-text">এটি চাঁদাবাজের প্রোফাইলে প্রদর্শিত হবে।</p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 bangla-text">সোশ্যাল মিডিয়া লিংক (ঐচ্ছিক)</h4>
                  <p className="text-sm text-gray-600 bangla-text">চাঁদাবাজের সোশ্যাল মিডিয়া প্রোফাইল লিংক যোগ করুন যদি জানা থাকে</p>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook_link" className="bangla-text">
                        ফেসবুক প্রোফাইল
                      </Label>
                      <Input
                        id="facebook_link"
                        name="facebook_link"
                        type="url"
                        value={formData.facebook_link}
                        onChange={handleInputChange}
                        placeholder="https://facebook.com/username"
                        className="bangla-text"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_picture" className="bangla-text">
                    প্রোফাইল ছবি
                  </Label>
                  <Input
                    id="profile_picture"
                    name="profile_picture"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      // This input is for a single file, so no need for array handling
                    }}
                  />
                  <p className="text-sm text-gray-600 bangla-text">চাঁদাবাজের ছবি আপলোড করুন (ঐচ্ছিক)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report_text" className="bangla-text">
                    রিপোর্ট বিবরণ *
                  </Label>
                  <Textarea
                    id="report_text"
                    name="report_text"
                    value={formData.report_text}
                    onChange={handleInputChange}
                    placeholder="কী ঘটেছিল তার বিস্তারিত বর্ণনা দিন..."
                    rows={6}
                    required
                    className="bangla-text"
                  />
                </div>

                {/* Re-added Media file upload section */}
                <div className="space-y-2">
                  <Label htmlFor="media_files" className="bangla-text">
                    প্রমাণ (ছবি/ভিডিও) (ঐচ্ছিক)
                  </Label>
                  <Input
                    id="media_files"
                    name="media_files"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-gray-600 bangla-text">ঘটনার ছবি বা ভিডিও আপলোড করুন (একাধিক ফাইল)</p>
                  {mediaFiles.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm font-medium bangla-text">আপলোড করা ফাইল:</p>
                      {mediaFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <FileText className="mr-2 h-4 w-4 animate-spin" />
                      <span className="bangla-text">জমা দেওয়া হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      <span className="bangla-text">রিপোর্ট জমা দিন</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
