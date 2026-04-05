"use client"

import { useState } from "react"
import {
  useCreateComment,
  useListReviewableOrders,
} from "@/core/catalog/comment.customer"
import { useUploadFile } from "@/core/common/file"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Star, Loader2, ShoppingBag, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/sonner"
import { ResponseError } from "@/lib/queryclient/response.type"

interface WriteReviewDialogProps {
  productId: string
  defaultOrderId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WriteReviewDialog({
  productId,
  defaultOrderId,
  open,
  onOpenChange,
}: WriteReviewDialogProps) {
  const createComment = useCreateComment()
  const { data: reviewableOrders } = useListReviewableOrders(productId)
  const uploadFile = useUploadFile()

  const [selectedOrderId, setSelectedOrderId] = useState(defaultOrderId ?? "")
  const [reviewScore, setReviewScore] = useState(5)
  const [reviewBody, setReviewBody] = useState("")
  const [hoverScore, setHoverScore] = useState<number | null>(null)
  const [reviewFiles, setReviewFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newFiles = files.slice(0, 5 - reviewFiles.length)
    setReviewFiles((prev) => [...prev, ...newFiles])
    setPreviewUrls((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))])
    e.target.value = ""
  }

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setReviewFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setReviewBody("")
    setReviewScore(5)
    setSelectedOrderId(defaultOrderId ?? "")
    setReviewFiles([])
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setPreviewUrls([])
  }

  const handleSubmit = async () => {
    try {
      const ids: string[] = []
      for (const file of reviewFiles) {
        const result = await uploadFile.mutateAsync(file)
        ids.push(result.id)
      }

      await createComment.mutateAsync({
        ref_type: "ProductSpu",
        ref_id: productId,
        body: reviewBody,
        score: reviewScore / 5,
        order_id: selectedOrderId,
        resource_ids: ids,
      })
      resetForm()
      onOpenChange(false)
      toast.success("Review submitted!")
    } catch (err) {
      if (err instanceof ResponseError) {
        toast.error(err.message)
      } else {
        toast.error("Failed to submit review. Please try again.")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience with this product.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Selection */}
          {!defaultOrderId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Order</label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a completed order" />
                </SelectTrigger>
                <SelectContent>
                  {reviewableOrders?.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{new Date(order.date_created).toLocaleDateString()}</span>
                        <span className="text-muted-foreground">
                          - {(order.total / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverScore(star)}
                  onMouseLeave={() => setHoverScore(null)}
                  onClick={() => setReviewScore(star)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      star <= (hoverScore ?? reviewScore)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {reviewScore} out of 5
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Review</label>
            <Textarea
              placeholder="What did you like or dislike about this product?"
              className="min-h-[120px]"
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Photos / Videos</label>
            <div className="flex flex-wrap gap-2">
              {previewUrls.map((url, i) => (
                <div key={i} className="relative h-20 w-20 rounded-md overflow-hidden border">
                  {reviewFiles[i]?.type.startsWith("video/") ? (
                    <video src={url} muted className="h-full w-full object-cover" />
                  ) : (
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {reviewFiles.length < 5 && (
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Up to 5 files. Images or videos.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createComment.isPending || uploadFile.isPending || !reviewBody.trim() || !selectedOrderId}
          >
            {uploadFile.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
            ) : createComment.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
            ) : (
              "Submit Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
