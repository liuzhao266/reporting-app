"use client"

import Link from "next/link"
import { Shield, LogOut, FileText, Clock, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function AdminNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const supabase = createClient()

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    toast({
      title: "লগআউট সফল!",
      description: "আপনি সফলভাবে লগআউট করেছেন।",
    })
    router.push("/PTF")
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/PTF/dashboard" className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 bangla-text">অ্যাডমিন প্যানেল</h1>
                <p className="text-sm text-gray-600 bangla-text">চাঁদাবাজ.কম - প্রশাসনিক নিয়ন্ত্রণ</p>
              </div>
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Button variant="ghost" asChild className={pathname === "/PTF/dashboard" ? "bg-gray-100" : ""}>
                <Link href="/PTF/dashboard" className="flex items-center space-x-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="bangla-text">ড্যাশবোর্ড</span>
                </Link>
              </Button>
              <Button variant="ghost" asChild className={pathname === "/PTF/pending-reports" ? "bg-gray-100" : ""}>
                <Link href="/PTF/pending-reports" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="bangla-text">অপেক্ষমাণ রিপোর্ট</span>
                </Link>
              </Button>
              <Button variant="ghost" asChild className={pathname === "/PTF/all-reports" ? "bg-gray-100" : ""}>
                <Link href="/PTF/all-reports" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span className="bangla-text">সকল রিপোর্ট</span>
                </Link>
              </Button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {/* User email will be displayed in the page component */}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="bangla-text">লগআউট</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
