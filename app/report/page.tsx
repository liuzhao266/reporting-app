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
import { Upload, FileText, AlertCircle, Plus, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { submitReport } from "@/lib/actions" // Ensure submitReport is imported

export default function ReportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    party: "", // Initialize party as an empty string (will hold party name)
    description: "",
  })
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setMediaFiles((prev) => [...prev, ...files])
  }

  const removeMediaFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Client-side validation for required fields
    if (!formData.name.trim() || !formData.location.trim() || !formData.description.trim()) {
      toast({
        title: "ত্রুটি!",
        description: "অনুগ্রহ করে সকল প্রয়োজনীয় ফিল্ড পূরণ করুন।",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Client-side validation for party
    if (!formData.party || formData.party === "") {
      toast({
        title: "ত্রুটি!",
        description: "অনুগ্রহ করে রাজনৈতিক দল নির্বাচন করুন।",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const form = e.currentTarget
    const data = new FormData(form)

    // Explicitly append the party value from state, as shadcn Select is not a native input
    // that FormData automatically picks up by name.
    data.append("party", formData.party)

    // Add media files to form data
    mediaFiles.forEach((file, index) => {
      data.append(`media_${index}`, file)
    })

    try {
      const result = await submitReport(data)

      if (result.success) {
        toast({
          title: "সফল!",
          description: result.message,
        })

        // Reset form
        setFormData({ name: "", location: "", party: "", description: "" })
        setMediaFiles([])

        // Redirect to home page
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
                  <Label htmlFor="location" className="bangla-text">
                    এলাকা *
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
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
                      {" "}
                      {/* Added name attribute here */}
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

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 bangla-text">সোশ্যাল মিডিয়া লিংক (ঐচ্ছিক)</h4>
                  <p className="text-sm text-gray-600 bangla-text">চাঁদাবাজের সোশ্যাল মিডিয়া প্রোফাইল লিংক যোগ করুন যদি জানা থাকে</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook_url" className="bangla-text">
                        ফেসবুক প্রোফাইল
                      </Label>
                      <Input
                        id="facebook_url"
                        name="facebook_url"
                        type="url"
                        placeholder="https://facebook.com/username"
                        className="bangla-text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter_url" className="bangla-text">
                        টুইটার/X প্রোফাইল
                      </Label>
                      <Input
                        id="twitter_url"
                        name="twitter_url"
                        type="url"
                        placeholder="https://twitter.com/username"
                        className="bangla-text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram_url" className="bangla-text">
                        ইনস্টাগ্রাম প্রোফাইল
                      </Label>
                      <Input
                        id="instagram_url"
                        name="instagram_url"
                        type="url"
                        placeholder="https://instagram.com/username"
                        className="bangla-text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url" className="bangla-text">
                        লিংকডইন প্রোফাইল
                      </Label>
                      <Input
                        id="linkedin_url"
                        name="linkedin_url"
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        className="bangla-text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="youtube_url" className="bangla-text">
                        ইউটিউব চ্যানেল
                      </Label>
                      <Input
                        id="youtube_url"
                        name="youtube_url"
                        type="url"
                        placeholder="https://youtube.com/@username"
                        className="bangla-text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tiktok_url" className="bangla-text">
                        টিকটক প্রোফাইল
                      </Label>
                      <Input
                        id="tiktok_url"
                        name="tiktok_url"
                        type="url"
                        placeholder="https://tiktok.com/@username"
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
                    onChange={(e) => handleInputChange(e)}
                  />
                  <p className="text-sm text-gray-600 bangla-text">চাঁদাবাজের ছবি আপলোড করুন (ঐচ্ছিক)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="bangla-text">
                    রিপোর্ট বিবরণ *
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="কী ঘটেছিল তার বিস্তারিত বর্ণনা দিন..."
                    rows={6}
                    required
                    className="bangla-text"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="bangla-text">প্রমাণ ফাইল (ঐচ্ছিক)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("media-upload")?.click()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="bangla-text">ফাইল যোগ করুন</span>
                    </Button>
                  </div>

                  <input
                    id="media-upload"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaFileChange}
                    className="hidden"
                  />

                  {mediaFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 bangla-text">নির্বাচিত ফাইলসমূহ:</p>
                      {mediaFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                          <span className="text-sm truncate">{file.name}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeMediaFile(index)}>
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
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
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
