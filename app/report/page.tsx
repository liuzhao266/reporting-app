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

export default function ReportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    party: "",
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

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error } = await supabase.storage.from("reports").upload(filePath, file)

      if (error) {
        console.error("Upload error:", error)
        return null
      }

      const { data } = supabase.storage.from("reports").getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error("File upload failed:", error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    // Add media files to form data
    mediaFiles.forEach((file, index) => {
      formData.append(`media_${index}`, file)
    })

    try {
      const result = await submitReport(formData)

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

  async function submitReport(formData: FormData): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      console.log("Mock submission - Supabase not configured")
      return {
        success: true,
        message: "রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে। (ডেমো মোড - Supabase কনফিগার করুন)",
      }
    }

    const name = formData.get("name") as string
    const location = formData.get("location") as string
    const party = formData.get("party") as string
    const description = formData.get("description") as string
    const profilePicture = formData.get("profile_picture") as File

    // Get social media URLs
    const facebook_url = formData.get("facebook_url") as string
    const twitter_url = formData.get("twitter_url") as string
    const instagram_url = formData.get("instagram_url") as string
    const linkedin_url = formData.get("linkedin_url") as string
    const youtube_url = formData.get("youtube_url") as string
    const tiktok_url = formData.get("tiktok_url") as string

    try {
      // Check if chadabaz already exists
      const { data: existingChadabaz } = await supabase
        .from("chadabaz")
        .select("id")
        .eq("name", name)
        .eq("location", location)
        .single()

      let chadabazId: string

      if (existingChadabaz) {
        chadabazId = existingChadabaz.id
      } else {
        // Upload profile picture if provided
        let profilePicUrl = null
        if (profilePicture && profilePicture.size > 0) {
          const fileExt = profilePicture.name.split(".").pop()
          const fileName = `profile_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from("chadabaz-media")
            .upload(`profiles/${fileName}`, profilePicture)

          if (!uploadError) {
            const { data } = supabase.storage.from("chadabaz-media").getPublicUrl(`profiles/${fileName}`)
            profilePicUrl = data.publicUrl
          }
        }

        // Create new chadabaz with social media URLs
        const { data: newChadabaz, error: chadabazError } = await supabase
          .from("chadabaz")
          .insert({
            name,
            location,
            party,
            profile_pic_url: profilePicUrl,
            facebook_url: facebook_url || null,
            twitter_url: twitter_url || null,
            instagram_url: instagram_url || null,
            linkedin_url: linkedin_url || null,
            youtube_url: youtube_url || null,
            tiktok_url: tiktok_url || null,
          })
          .select("id")
          .single()

        if (chadabazError) {
          throw chadabazError
        }

        chadabazId = newChadabaz.id
      }

      // Upload media files
      const mediaUrls: string[] = []
      let index = 0
      while (formData.get(`media_${index}`)) {
        const file = formData.get(`media_${index}`) as File
        if (file && file.size > 0) {
          const fileExt = file.name.split(".").pop()
          const fileName = `media_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from("chadabaz-media")
            .upload(`reports/${fileName}`, file)

          if (!uploadError) {
            const { data } = supabase.storage.from("chadabaz-media").getPublicUrl(`reports/${fileName}`)
            mediaUrls.push(data.publicUrl)
          }
        }
        index++
      }

      // Create report
      const { error: reportError } = await supabase.from("reports").insert({
        chadabaz_id: chadabazId,
        description,
        media_urls: mediaUrls,
        status: "pending",
      })

      if (reportError) {
        throw reportError
      }

      return { success: true, message: "রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে। পর্যালোচনার পর এটি প্রকাশিত হবে।" }
    } catch (error) {
      console.error("Error submitting report:", error)
      return { success: false, message: "রিপোর্ট জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" }
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
                    <SelectTrigger className="bangla-text">
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
