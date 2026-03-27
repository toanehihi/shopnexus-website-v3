"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useCreateProductSPU } from "@/core/catalog/product.vendor"
import type { RichTextEditorRef } from "@/components/ui/rich-text-editor"
import { ImageUpload, type UploadedImage } from "@/components/ui/image-upload"
import { CategorySelect, BrandSelect, TagSelect } from "@/components/ui/catalog-selects"

// Dynamic import to avoid SSR issues with Quill
const RichTextEditor = dynamic(
  () => import("@/components/ui/rich-text-editor").then((mod) => mod.RichTextEditor),
  { ssr: false, loading: () => <div className="h-[200px] rounded-md border border-input bg-muted/50 animate-pulse" /> }
)
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  Loader2,
  X,
  Plus,
  Package,
} from "lucide-react"

export default function NewProductPage() {
  const router = useRouter()
  const createProduct = useCreateProductSPU()
  const descriptionRef = useRef<RichTextEditorRef>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    brand_id: "",
    is_active: true,
    tags: [] as string[],
  })

  const [productImages, setProductImages] = useState<UploadedImage[]>([])

  const [specifications, setSpecifications] = useState<Array<{ name: string; value: string }>>([])

  const handleAddSpec = () => {
    setSpecifications([...specifications, { name: "", value: "" }])
  }

  const handleRemoveSpec = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await createProduct.mutateAsync({
      name: formData.name,
      description: formData.description,
      category_id: formData.category_id,
      brand_id: formData.brand_id || "default",
      is_active: formData.is_active,
      tags: formData.tags,
      specifications: specifications.filter((s) => s.name && s.value),
    })

    router.push("/seller/products")
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
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details of your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <RichTextEditor
                ref={descriptionRef}
                defaultValue={formData.description}
                onChange={(html) => setFormData({ ...formData, description: html })}
                placeholder="Describe your product in detail. Include features, benefits, materials, dimensions, and any other relevant information..."
                toolbarOptions="full"
                className="[&_.ql-editor]:min-h-[200px]"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <CategorySelect
                  value={formData.category_id || null}
                  onChange={(value) => setFormData({ ...formData, category_id: value || "" })}
                  placeholder="Search categories..."
                />
              </div>

              <div className="space-y-2">
                <Label>Brand</Label>
                <BrandSelect
                  value={formData.brand_id || null}
                  onChange={(value) => setFormData({ ...formData, brand_id: value || "" })}
                  placeholder="Search brands..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Active</p>
                <p className="text-sm text-muted-foreground">
                  Make this product visible to customers
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
            <CardDescription>
              Upload images of your product. The first image will be the main product image.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={productImages}
              onChange={setProductImages}
              maxFiles={10}
              maxSizeInMB={5}
            />
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Add tags to help customers find your product</CardDescription>
          </CardHeader>
          <CardContent>
            <TagSelect
              values={formData.tags}
              onValuesChange={(values) => setFormData({ ...formData, tags: values })}
              placeholder="Search and select tags..."
              multiple
            />
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
            <CardDescription>Add product specifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {specifications.map((spec, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Name (e.g., Material)"
                  value={spec.name}
                  onChange={(e) => {
                    const updated = [...specifications]
                    updated[index].name = e.target.value
                    setSpecifications(updated)
                  }}
                />
                <Input
                  placeholder="Value (e.g., Cotton)"
                  value={spec.value}
                  onChange={(e) => {
                    const updated = [...specifications]
                    updated[index].value = e.target.value
                    setSpecifications(updated)
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveSpec(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={handleAddSpec}>
              <Plus className="h-4 w-4 mr-2" />
              Add Specification
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/seller/products">Cancel</Link>
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
    </div>
  )
}
