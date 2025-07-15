import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flag, Users, FileText, TrendingUp } from "lucide-react"

interface PartyStatisticsProps {
  partyStats: { party: string; totalReports: number; memberCount: number }[]
}

export function PartyStatistics({ partyStats }: PartyStatisticsProps) {
  if (partyStats.length === 0) {
    return null
  }

  return (
    <Card className="mb-8 border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-800 bangla-text">
          <Flag className="h-6 w-6" />
          <span>দলীয় পরিসংখ্যান</span>
        </CardTitle>
        <p className="text-red-700 text-sm bangla-text">প্রতিটি রাজনৈতিক দলের সদস্যদের বিরুদ্ধে মোট রিপোর্ট সংখ্যা</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partyStats.map((stat, index) => (
            <div
              key={stat.party}
              className={`p-4 rounded-lg border-2 ${
                index === 0
                  ? "border-red-300 bg-red-100"
                  : index === 1
                    ? "border-orange-300 bg-orange-100"
                    : index === 2
                      ? "border-yellow-300 bg-yellow-100"
                      : "border-gray-300 bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Badge
                  variant="outline"
                  className={`text-sm font-medium ${
                    index === 0
                      ? "border-red-500 text-red-700"
                      : index === 1
                        ? "border-orange-500 text-orange-700"
                        : index === 2
                          ? "border-yellow-600 text-yellow-700"
                          : "border-gray-500 text-gray-700"
                  }`}
                >
                  #{index + 1}
                </Badge>
                {index === 0 && <TrendingUp className="h-5 w-5 text-red-600" />}
              </div>

              <h3 className="font-semibold text-gray-900 mb-3 bangla-text text-sm leading-tight">{stat.party}</h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="bangla-text">মোট রিপোর্ট</span>
                  </div>
                  <span className="font-bold text-lg text-red-600">{stat.totalReports}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="bangla-text">সদস্য সংখ্যা</span>
                  </div>
                  <span className="font-semibold text-blue-600">{stat.memberCount}</span>
                </div>

                <div className="pt-2 border-t border-gray-300">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="bangla-text">গড় রিপোর্ট/সদস্য</span>
                    <span className="font-medium">{(stat.totalReports / stat.memberCount).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {partyStats.length > 3 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 bangla-text">
              শীর্ষ ৩টি দল দেখানো হচ্ছে। মোট {partyStats.length}টি দলের তথ্য রয়েছে।
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
