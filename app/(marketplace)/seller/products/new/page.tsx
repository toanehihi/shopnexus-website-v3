"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useCreateProductSPU } from "@/core/catalog/product.vendor"
import { type UploadedImage } from "@/components/ui/image-upload"
import { ProductSPUForm, defaultFormData, type ProductSPUFormData } from "@/components/seller/product-spu-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Package } from "lucide-react"
import { toast } from "@/components/ui/sonner"

export default function NewProductPage() {
  const router = useRouter()
  const createProduct = useCreateProductSPU()

  const [formData, setFormData] = useState<ProductSPUFormData>({ ...defaultFormData })
  const [images, setImages] = useState<UploadedImage[]>([])

  const handleChange = <K extends keyof ProductSPUFormData>(key: K, value: ProductSPUFormData[K]) => {
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seller/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground">Create a new product listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <ProductSPUForm
          data={formData}
          onChange={handleChange}
          images={images}
          onImagesChange={setImages}
        />

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/seller/products">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={createProduct.isPending || !formData.name || !formData.category_id || !formData.currency}
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
    </div>
  )
}
