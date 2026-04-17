"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { VideoProductWizard } from "@/components/seller/video-product-wizard"

export default function FromVideoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seller/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Product from Video</h1>
          <p className="text-muted-foreground">
            Upload a video and let AI fill in your product details
          </p>
        </div>
      </div>

      <VideoProductWizard />
    </div>
  )
}
