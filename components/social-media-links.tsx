import { Facebook } from "lucide-react" // Only Facebook icon needed
import { Button } from "@/components/ui/button"

interface SocialMediaLinksProps {
  facebook_link?: string // Only Facebook link prop
  size?: "sm" | "md" | "lg"
  showLabels?: boolean
}

export function SocialMediaLinks({ facebook_link, size = "md", showLabels = false }: SocialMediaLinksProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"
  const buttonSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "default"

  const socialPlatforms = [
    {
      key: "facebook",
      url: facebook_link,
      icon: Facebook,
      label: "ফেসবুক",
      color: "hover:text-blue-600",
    },
  ]

  const availableLinks = socialPlatforms.filter((link) => link.url)

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
