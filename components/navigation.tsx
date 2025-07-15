import Link from "next/link"
import { Shield, Search, FileText, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navigation() {
  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-red-600" />
              <span className="font-bold text-xl text-gray-900">চাঁদাবাজ.কম</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/" className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>হোম</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/search" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>খুঁজুন</span>
              </Link>
            </Button>
            <Button asChild>
              <Link href="/report" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>রিপোর্ট করুন</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
