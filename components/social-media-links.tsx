import { Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SocialMediaLinksProps {
  facebook_url?: string
  twitter_url?: string
  instagram_url?: string
  linkedin_url?: string
  youtube_url?: string
  tiktok_url?: string
  size?: "sm" | "md" | "lg"
  showLabels?: boolean
}

export function SocialMediaLinks({
  facebook_url,
  twitter_url,
  instagram_url,
  linkedin_url,
  youtube_url,
  tiktok_url,
  size = "md",
  showLabels = false,
}: SocialMediaLinksProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"
  const buttonSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "default"

  const socialLinks = [
    {
      url: facebook_url,
      icon: Facebook,
      label: "ফেসবুক",
      color: "hover:text-blue-600",
    },
    {
      url: twitter_url,
      icon: Twitter,
      label: "টুইটার",
      color: "hover:text-sky-500",
    },
    {
      url: instagram_url,
      icon: Instagram,
      label: "ইনস্টাগ্রাম",
      color: "hover:text-pink-600",
    },
    {
      url: linkedin_url,
      icon: Linkedin,
      label: "লিংকডইন",
      color: "hover:text-blue-700",
    },
    {
      url: youtube_url,
      icon: Youtube,
      label: "ইউটিউব",
      color: "hover:text-red-600",
    },
    {
      url: tiktok_url,
      icon: () => (
        <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5.16 20.5a6.34 6.34 0 0 0 10.86-4.43V7.83a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.26z" />
        </svg>
      ),
      label: "টিকটক",
      color: "hover:text-black",
    },
  ]

  const availableLinks = socialLinks.filter((link) => link.url)

  if (availableLinks.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableLinks.map((link, index) => (
        <Button key={index} variant="outline" size={buttonSize} asChild className={`${link.color} transition-colors`}>
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2">
            <link.icon className={iconSize} />
            {showLabels && <span className="bangla-text">{link.label}</span>}
          </a>
        </Button>
      ))}
    </div>
  )
}
