"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useGetProductSPU, useUpdateProductSPU, useListProductSKU, useCreateProductSKU, useUpdateProductSKU, useDeleteProductSKU, ProductSku } from "@/core/catalog/product.vendor"
import { useListCategories } from "@/core/catalog/category"
import type { RichTextEditorRef } from "@/components/ui/rich-text-editor"
import { ImageUpload, type UploadedImage } from "@/components/ui/image-upload"

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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Save,
  Loader2,
  ImagePlus,
  X,
  Plus,
  Package,
  Trash2,
  DollarSign,
  Layers,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const descriptionRef = useRef<RichTextEditorRef>(null)

  const { data: product, isLoading: isLoadingProduct } = useGetProductSPU(id)
  const { data: skus, isLoading: isLoadingSKUs } = useListProductSKU({ spu_id: id })
  const { data: categoriesData } = useListCategories({ limit: 100 })

  const updateProduct = useUpdateProductSPU()
  const createSKU = useCreateProductSKU()
  const updateSKU = useUpdateProductSKU()
  const deleteSKU = useDeleteProductSKU()

  const categories = categoriesData?.pages.flatMap((page) => page.data) ?? []

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    brand_id: "",
    is_active: true,
    tags: [] as string[],
  })

  const [productImages, setProductImages] = useState<UploadedImage[]>([])
  const [tagInput, setTagInput] = useState("")
  const [specifications, setSpecifications] = useState<Array<{ name: string; value: string }>>([])
  const [showSKUDialog, setShowSKUDialog] = useState(false)
  const [editingSKU, setEditingSKU] = useState<ProductSku | null>(null)
  const [deletingSKU, setDeletingSKU] = useState<ProductSku | null>(null)

  const [skuForm, setSkuForm] = useState({
    price: "",
    stock: "",
    can_combine: true,
    attributes: [] as Array<{ name: string; value: string }>,
    weight_grams: "",
    length_cm: "",
    width_cm: "",
    height_cm: "",
  })

  // Load product data when available
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        category_id: product.category?.id || "",
        brand_id: product.brand?.id || "",
        is_active: product.is_active,
        tags: product.tags || [],
      })
      setSpecifications(product.specifications || [])
      // Load existing images
      if (product.resources) {
        setProductImages(product.resources.map(r => ({ id: r.id, url: r.url })))
      }
    }
  }, [product])

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] })
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })
  }

  const handleAddSpec = () => {
    setSpecifications([...specifications, { name: "", value: "" }])
  }

  const handleRemoveSpec = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index))
  }

  const handleAddAttribute = () => {
    setSkuForm({ ...skuForm, attributes: [...skuForm.attributes, { name: "", value: "" }] })
  }

  const handleRemoveAttribute = (index: number) => {
    setSkuForm({ ...skuForm, attributes: skuForm.attributes.filter((_, i) => i !== index) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await updateProduct.mutateAsync({
      id,
      name: formData.name,
      description: formData.description,
      category_id: formData.category_id,
      brand_id: formData.brand_id || undefined,
      is_active: formData.is_active,
      tags: formData.tags,
      specifications: specifications.filter((s) => s.name && s.value),
    })

    router.push("/seller/products")
  }

  const handleOpenSKUDialog = (sku?: ProductSku) => {
    if (sku) {
      setEditingSKU(sku)
      setSkuForm({
        price: sku.price.toString(),
        stock: sku.stock.toString(),
        can_combine: sku.can_combine,
        attributes: sku.attributes || [],
        weight_grams: sku.package_details?.weight_grams?.toString() || "",
        length_cm: sku.package_details?.length_cm?.toString() || "",
        width_cm: sku.package_details?.width_cm?.toString() || "",
        height_cm: sku.package_details?.height_cm?.toString() || "",
      })
    } else {
      setEditingSKU(null)
      setSkuForm({
        price: "",
        stock: "",
        can_combine: true,
        attributes: [],
        weight_grams: "",
        length_cm: "",
        width_cm: "",
        height_cm: "",
      })
    }
    setShowSKUDialog(true)
  }

  const handleSaveSKU = async () => {
    const packageDetails = {
      weight_grams: parseFloat(skuForm.weight_grams) || 0,
      length_cm: parseFloat(skuForm.length_cm) || 0,
      width_cm: parseFloat(skuForm.width_cm) || 0,
      height_cm: parseFloat(skuForm.height_cm) || 0,
    }

    if (editingSKU) {
      await updateSKU.mutateAsync({
        id: editingSKU.id,
        price: parseFloat(skuForm.price),
        can_combine: skuForm.can_combine,
        attributes: skuForm.attributes.filter((a) => a.name && a.value),
        package_details: packageDetails,
      })
    } else {
      await createSKU.mutateAsync({
        spu_id: id,
        price: parseFloat(skuForm.price),
        can_combine: skuForm.can_combine,
        attributes: skuForm.attributes.filter((a) => a.name && a.value),
        package_details: packageDetails,
      })
    }

    setShowSKUDialog(false)
    setEditingSKU(null)
  }

  const handleDeleteSKU = async () => {
    if (!deletingSKU) return
    await deleteSKU.mutateAsync({ id: deletingSKU.id })
    setDeletingSKU(null)
  }

  if (isLoadingProduct) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Product not found</h2>
        <p className="text-muted-foreground mb-4">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/seller/products">Back to Products</Link>
        </Button>
      </div>
    )
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
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground">Update product details and variants</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update the basic details of your product</CardDescription>
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
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="Enter brand name"
                  value={formData.brand_id}
                  onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
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
              Upload and manage product images. The first image will be the main product image.
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

        {/* SKUs / Variants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Product Variants (SKUs)
                </CardTitle>
                <CardDescription>Manage pricing and inventory for each variant</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={() => handleOpenSKUDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSKUs ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : skus && skus.length > 0 ? (
              <div className="space-y-3">
                {skus.map((sku) => (
                  <div
                    key={sku.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatPrice(sku.price)}</span>
                        <Badge variant="outline">Stock: {sku.stock}</Badge>
                        {sku.can_combine && (
                          <Badge variant="secondary">Combinable</Badge>
                        )}
                      </div>
                      {sku.attributes && sku.attributes.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {sku.attributes.map((attr, idx) => (
                            <span key={idx} className="text-xs text-muted-foreground">
                              {attr.name}: {attr.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenSKUDialog(sku)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeletingSKU(sku)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No variants yet. Add a variant to set pricing and inventory.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Add tags to help customers find your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
            disabled={updateProduct.isPending || !formData.name || !formData.category_id}
          >
            {updateProduct.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* SKU Dialog */}
      <Dialog open={showSKUDialog} onOpenChange={setShowSKUDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSKU ? "Edit Variant" : "Add Variant"}</DialogTitle>
            <DialogDescription>
              {editingSKU ? "Update variant details" : "Add a new product variant with pricing and attributes"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku-price">Price *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="sku-price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-10"
                    value={skuForm.price}
                    onChange={(e) => setSkuForm({ ...skuForm, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku-stock">Stock</Label>
                <Input
                  id="sku-stock"
                  type="number"
                  placeholder="0"
                  value={skuForm.stock}
                  onChange={(e) => setSkuForm({ ...skuForm, stock: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">Can Combine</p>
                <p className="text-xs text-muted-foreground">Allow combining with other items</p>
              </div>
              <Switch
                checked={skuForm.can_combine}
                onCheckedChange={(checked) => setSkuForm({ ...skuForm, can_combine: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Attributes</Label>
              {skuForm.attributes.map((attr, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Name (e.g., Size)"
                    value={attr.name}
                    onChange={(e) => {
                      const updated = [...skuForm.attributes]
                      updated[index].name = e.target.value
                      setSkuForm({ ...skuForm, attributes: updated })
                    }}
                  />
                  <Input
                    placeholder="Value (e.g., Large)"
                    value={attr.value}
                    onChange={(e) => {
                      const updated = [...skuForm.attributes]
                      updated[index].value = e.target.value
                      setSkuForm({ ...skuForm, attributes: updated })
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAttribute(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={handleAddAttribute}>
                <Plus className="h-4 w-4 mr-2" />
                Add Attribute
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Package Details</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="weight" className="text-xs text-muted-foreground">Weight (grams)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="0"
                    value={skuForm.weight_grams}
                    onChange={(e) => setSkuForm({ ...skuForm, weight_grams: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="length" className="text-xs text-muted-foreground">Length (cm)</Label>
                  <Input
                    id="length"
                    type="number"
                    placeholder="0"
                    value={skuForm.length_cm}
                    onChange={(e) => setSkuForm({ ...skuForm, length_cm: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="width" className="text-xs text-muted-foreground">Width (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    placeholder="0"
                    value={skuForm.width_cm}
                    onChange={(e) => setSkuForm({ ...skuForm, width_cm: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="height" className="text-xs text-muted-foreground">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="0"
                    value={skuForm.height_cm}
                    onChange={(e) => setSkuForm({ ...skuForm, height_cm: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSKUDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSKU}
              disabled={createSKU.isPending || updateSKU.isPending || !skuForm.price}
            >
              {(createSKU.isPending || updateSKU.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Variant"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete SKU Confirmation */}
      <Dialog open={!!deletingSKU} onOpenChange={() => setDeletingSKU(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Variant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this variant? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingSKU(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSKU}
              disabled={deleteSKU.isPending}
            >
              {deleteSKU.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
