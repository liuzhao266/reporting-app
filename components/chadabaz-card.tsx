import Link from "next/link"
import { MapPin, Users, Eye, FileText } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Chadabaz } from "@/lib/types"

interface ChadabazCardProps {
  chadabaz: Chadabaz
}

export function ChadabazCard({ chadabaz }: ChadabazCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {chadabaz.profile_pic_url ? (
              <img
                src={chadabaz.profile_pic_url || "/placeholder.svg"}
                alt={chadabaz.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <Users className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">{chadabaz.name}</h3>
            <div className="flex items-center text-gray-600 mt-1">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{chadabaz.location}</span>
            </div>
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <Badge variant="outline" className="text-sm">
            {chadabaz.party}
          </Badge>

          {/* Add report count badge */}
          {chadabaz.report_count && (
            <div className="flex items-center text-sm text-red-600 bg-red-50 px-2 py-1 rounded-full w-fit">
              <FileText className="h-3 w-3 mr-1" />
              <span className="bangla-text">{chadabaz.report_count}টি রিপোর্ট</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-6 py-4 bg-gray-50">
        <Button asChild className="w-full">
          <Link href={`/profile/${chadabaz.id}`} className="flex items-center justify-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>বিস্তারিত দেখুন</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
