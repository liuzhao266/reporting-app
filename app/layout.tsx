import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "চাঁদাবাজ.কম - কমিউনিটি রিপোর্টিং প্ল্যাটফর্ম",
  description: "চাঁদাবাজদের বিরুদ্ধে রিপোর্ট করুন এবং কমিউনিটিকে সুরক্ষিত রাখুন",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bn">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
