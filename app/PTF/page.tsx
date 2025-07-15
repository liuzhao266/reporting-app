"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Shield, Eye, EyeOff, LogIn } from "lucide-react"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (!supabase) {
        // Mock login for demo purposes
        if (email === "admin@chadabaz.com" && password === "admin123") {
          toast({
            title: "সফল!",
            description: "সফলভাবে লগইন হয়েছে। (ডেমো মোড)",
          })
          router.push("/PTF/dashboard")
          return
        } else {
          setError("ভুল ইমেইল বা পাসওয়ার্ড। ডেমো: admin@chadabaz.com / admin123")
          return
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError("ভুল ইমেইল বা পাসওয়ার্ড। আবার চেষ্টা করুন।")
        return
      }

      if (data.user) {
        toast({
          title: "সফল!",
          description: "সফলভাবে লগইন হয়েছে।",
        })
        router.push("/PTF/dashboard")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 bangla-text">অ্যাডমিন প্যানেল</h1>
          <p className="text-slate-300 bangla-text">চাঁদাবাজ.কম - প্রশাসনিক নিয়ন্ত্রণ</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white bangla-text">লগইন করুন</CardTitle>
            <CardDescription className="text-slate-300 bangla-text">
              অ্যাডমিন প্যানেলে প্রবেশ করতে আপনার তথ্য দিন
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white bangla-text">
                  ইমেইল ঠিকানা
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white bangla-text">
                  পাসওয়ার্ড
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড লিখুন"
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-500 bg-red-500/10">
                  <AlertDescription className="text-red-400 bangla-text">{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LogIn className="mr-2 h-4 w-4 animate-spin" />
                    <span className="bangla-text">লগইন হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    <span className="bangla-text">লগইন করুন</span>
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-300 bangla-text mb-2">ডেমো অ্যাকাউন্ট:</p>
              <p className="text-xs text-slate-400">ইমেইল: admin@chadabaz.com</p>
              <p className="text-xs text-slate-400">পাসওয়ার্ড: admin123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
