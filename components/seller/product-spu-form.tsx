"use client"

import { useRef } from "react"
import dynamic from "next/dynamic"
import type { RichTextEditorRef } from "@/components/ui/rich-text-editor"
import { ImageUpload, type UploadedImage } from "@/components/ui/image-upload"
import { CategorySelect, TagSelect } from "@/components/ui/catalog-selects"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCurrencyOptions } from "@/lib/countries"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X, Plus } from "lucide-react"

const RichTextEditor = dynamic(
  () => import("@/components/ui/rich-text-editor").then((mod) => mod.RichTextEditor),
  { ssr: false, loading: () => <div className="h-[200px] rounded-md border border-input bg-muted/50 animate-pulse" /> }
)

export type ProductSPUFormData = {
  name: string
  description: string
  category_id: string
  currency: string
  is_enabled: boolean
  tags: string[]
  resource_ids: string[]
  specifications: Array<{ name: string; value: string }>
}

export const defaultFormData: ProductSPUFormData = {
  name: "",
  description: "",
  category_id: "",
  currency: "VND",
  is_enabled: true,
  tags: [],
  resource_ids: [],
  specifications: [],
}

interface ProductSPUFormProps {
  data: ProductSPUFormData
  onChange: <K extends keyof ProductSPUFormData>(key: K, value: ProductSPUFormData[K]) => void
  images: UploadedImage[]
  onImagesChange: (images: UploadedImage[]) => void
  /** Extra content rendered after the name field (e.g. regenerate slug toggle) */
  afterName?: React.ReactNode
  /** Key to force remount of uncontrolled components (e.g. RichTextEditor). Use product ID. */
  formKey?: string
}

export function ProductSPUForm({ data, onChange, images, onImagesChange, afterName, formKey }: ProductSPUFormProps) {
  const descriptionRef = useRef<RichTextEditorRef>(null)
  const currencyOptions = useCurrencyOptions()

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Product name, description, and category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              placeholder="Enter product name"
              value={data.name}
              onChange={(e) => onChange("name", e.target.value)}
              required
            />
          </div>

          {afterName}

          <div className="space-y-2">
            <Label>Description *</Label>
            <RichTextEditor
              key={formKey}
              ref={descriptionRef}
              defaultValue={data.description}
              onChange={(html) => onChange("description", html)}
              placeholder="Describe your product in detail..."
              toolbarOptions="full"
              className="[&_.ql-editor]:min-h-[200px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Category *</Label>
            <CategorySelect
              value={data.category_id || null}
              onChange={(value) => onChange("category_id", value || "")}
              placeholder="Search categories..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency *</Label>
            <Select
              value={data.currency}
              onValueChange={(value) => onChange("currency", value)}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((opt) => (
                  <SelectItem key={opt.code} value={opt.code}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Prices for this product's SKUs are denominated in this currency.
              Buyers see them converted to their wallet currency at checkout.
            </p>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Active</p>
              <p className="text-sm text-muted-foreground">Make this product visible to customers</p>
            </div>
            <Switch
              checked={data.is_enabled}
              onCheckedChange={(checked) => onChange("is_enabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Product Images</CardTitle>
          <CardDescription>The first image will be the main product image.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={images}
            onChange={(imgs) => {
              onImagesChange(imgs)
              onChange("resource_ids", imgs.map((img) => img.id))
            }}
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
            values={data.tags}
            onValuesChange={(values) => onChange("tags", values)}
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
          {data.specifications.map((spec, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Name (e.g., Material)"
                value={spec.name}
                onChange={(e) => {
                  const updated = [...data.specifications]
                  updated[index] = { ...updated[index], name: e.target.value }
                  onChange("specifications", updated)
                }}
              />
              <Input
                placeholder="Value (e.g., Cotton)"
                value={spec.value}
                onChange={(e) => {
                  const updated = [...data.specifications]
                  updated[index] = { ...updated[index], value: e.target.value }
                  onChange("specifications", updated)
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange("specifications", data.specifications.filter((_, i) => i !== index))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange("specifications", [...data.specifications, { name: "", value: "" }])}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Specification
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
