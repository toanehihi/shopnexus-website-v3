"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useProcessVideoToProduct, type VideoProductResult } from "@/core/catalog/video-product"
import { useCreateProductSPU } from "@/core/catalog/product.vendor"
import { ProductSPUForm, defaultFormData, type ProductSPUFormData } from "@/components/seller/product-spu-form"
import { VideoUploadStep } from "@/components/seller/video-upload-step"
import { VideoReviewStep } from "@/components/seller/video-review-step"
import { VideoClassifyStep } from "@/components/seller/video-classify-step"
import { type UploadedImage } from "@/components/ui/image-upload"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Package, Video } from "lucide-react"
import { toast } from "@/components/ui/sonner"
import { customFetchPagination } from "@/lib/queryclient/custom-fetch"
import type { Category } from "@/core/catalog/category"
import qs from "qs"

const STEP_LABELS = ["Upload", "Review", "Category", "Product"]

async function lookupCategoryIdByName(name: string): Promise<string> {
  const res = await customFetchPagination<Category>(
    `catalog/category?${qs.stringify({ search: name, limit: 1 })}`
  )
  const match = res.data?.find((c) => c.name === name)
  return match?.id ?? ""
}

export function VideoProductWizard() {
  const router = useRouter()
  const processVideo = useProcessVideoToProduct()
  const createProduct = useCreateProductSPU()

  const [step, setStep] = useState(0)
  const [result, setResult] = useState<VideoProductResult | null>(null)

  // Step 2 state
  const [description, setDescription] = useState("")

  // Step 3 state
  const [selectedCategoryName, setSelectedCategoryName] = useState("")
  const [tags, setTags] = useState<string[]>([])

  // Step 4 state
  const [formData, setFormData] = useState<ProductSPUFormData>({ ...defaultFormData })
  const [images, setImages] = useState<UploadedImage[]>([])

  const handleProcess = async (file: File, style: string) => {
    try {
      const res = await processVideo.mutateAsync({ file, style })
      setResult(res)
      setDescription(res.description)
      if (res.classifications.length > 0) {
        setSelectedCategoryName(res.classifications[0].category_name)
      }
      setStep(1)
    } catch (err: any) {
      toast.error(err?.message || "Failed to process video")
    }
  }

  const videoResourceId = result?.resource_id ?? null

  const handleGoToForm = async () => {
    const categoryId = await lookupCategoryIdByName(selectedCategoryName)
    setImages([])
    setFormData({
      ...defaultFormData,
      description,
      category_id: categoryId,
      tags,
      resource_ids: videoResourceId ? [videoResourceId] : [],
    })
    setStep(3)
  }

  // When images change, merge with the video resource_id
  const handleChange = <K extends keyof ProductSPUFormData>(key: K, value: ProductSPUFormData[K]) => {
    if (key === "resource_ids" && videoResourceId) {
      const ids = value as string[]
      const merged = [videoResourceId, ...ids.filter((id) => id !== videoResourceId)]
      setFormData((prev) => ({ ...prev, resource_ids: merged }))
      return
    }
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProduct.mutateAsync({
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        currency: formData.currency,
        is_enabled: formData.is_enabled,
        tags: formData.tags,
        resource_ids: formData.resource_ids,
        specifications: formData.specifications.filter((s) => s.name && s.value),
      })
      toast.success("Product created successfully")
      router.push("/seller/products")
    } catch (err: any) {
      toast.error(err?.message || "Failed to create product")
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <Badge variant={i <= step ? "default" : "outline"} className="text-xs">
              {i + 1}. {label}
            </Badge>
            {i < STEP_LABELS.length - 1 && (
              <div className={`h-px w-6 ${i < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Steps */}
      {step === 0 && (
        <VideoUploadStep
          onProcess={handleProcess}
          isPending={processVideo.isPending}
        />
      )}

      {step === 1 && result && (
        <VideoReviewStep
          transcription={result.transcription}
          description={description}
          onDescriptionChange={setDescription}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && result && (
        <VideoClassifyStep
          classifications={result.classifications}
          selectedCategoryName={selectedCategoryName}
          onCategorySelect={setSelectedCategoryName}
          tags={tags}
          onTagsChange={setTags}
          onBack={() => setStep(1)}
          onNext={handleGoToForm}
        />
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Product Video
                </CardTitle>
                <CardDescription>This video will be attached to your product</CardDescription>
              </CardHeader>
              <CardContent>
                <video
                  src={result.resource_url}
                  controls
                  className="w-full max-h-[300px] rounded-lg bg-black"
                />
              </CardContent>
            </Card>
          )}

          <ProductSPUForm
            data={formData}
            onChange={handleChange}
            images={images}
            onImagesChange={setImages}
            formKey="from-video"
          />

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={createProduct.isPending || !formData.name || !formData.category_id}
            >
              {createProduct.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Create Product
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
