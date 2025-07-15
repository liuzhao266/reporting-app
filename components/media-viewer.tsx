"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Download, Volume2, VolumeX } from "lucide-react"

interface MediaViewerProps {
  mediaUrls: string[]
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

export function MediaViewer({ mediaUrls, isOpen, onClose, initialIndex = 0 }: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)

  const currentMedia = mediaUrls[currentIndex]
  const isVideo = currentMedia?.match(/\.(mp4|webm|mov|avi)$/i)
  const isImage = currentMedia?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaUrls.length)
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = currentMedia
    link.download = `media_${currentIndex + 1}`
    link.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="bangla-text">
              প্রমাণ দেখুন ({currentIndex + 1}/{mediaUrls.length})
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                <span className="bangla-text">ডাউনলোড</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative flex-1 p-4">
          {isImage && (
            <img
              src={currentMedia || "/placeholder.svg"}
              alt={`প্রমাণ ${currentIndex + 1}`}
              className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
            />
          )}

          {isVideo && (
            <div className="relative">
              <video
                src={currentMedia}
                controls
                className="w-full h-auto max-h-[60vh] rounded-lg"
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                muted={isVideoMuted}
              />
              <div className="absolute top-2 right-2 flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsVideoMuted(!isVideoMuted)}
                  className="bg-black/50 hover:bg-black/70"
                >
                  {isVideoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {!isImage && !isVideo && (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
              <div className="text-center">
                <p className="text-gray-600 bangla-text">ফাইল প্রিভিউ উপলব্ধ নেই</p>
                <Button variant="outline" onClick={handleDownload} className="mt-2 bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="bangla-text">ডাউনলোড করুন</span>
                </Button>
              </div>
            </div>
          )}

          {mediaUrls.length > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button variant="outline" onClick={handlePrevious} disabled={mediaUrls.length <= 1}>
                <span className="bangla-text">← পূর্ববর্তী</span>
              </Button>
              <div className="flex space-x-2">
                {mediaUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full ${index === currentIndex ? "bg-blue-600" : "bg-gray-300"}`}
                  />
                ))}
              </div>
              <Button variant="outline" onClick={handleNext} disabled={mediaUrls.length <= 1}>
                <span className="bangla-text">পরবর্তী →</span>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
