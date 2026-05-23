"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useGetProductSPU, useUpdateProductSPU, useListProductSKU, useCreateProductSKU, useUpdateProductSKU, useDeleteProductSKU, ProductSku } from "@/core/catalog/product.vendor"
import { useImportStock, useGetStock, useListProductSerials, useUpdateStockSettings } from "@/core/inventory/inventory.vendor"
import { type UploadedImage } from "@/components/ui/image-upload"
import { ProductSPUForm, defaultFormData, type ProductSPUFormData } from "@/components/seller/product-spu-form"
import { useDirty } from "@/lib/dirty"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
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
  X,
  Plus,
  Package,
  PackagePlus,
  Trash2,
  DollarSign,
  Layers,
  Info,
  Hash,
} from "lucide-react"
import { Price } from "@/components/ui/price"
import { toast } from "@/components/ui/sonner"

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const { data: product, isLoading: isLoadingProduct } = useGetProductSPU(id)
  const { data: skus, isLoading: isLoadingSKUs } = useListProductSKU({ spu_id: id })

  const updateProduct = useUpdateProductSPU()
  const createSKU = useCreateProductSKU()
  const updateSKU = useUpdateProductSKU()
  const deleteSKU = useDeleteProductSKU()
  const importStock = useImportStock()
  const updateStockSettings = useUpdateStockSettings()

  // Form state with dirty tracking for PATCH
  const form = useDirty<ProductSPUFormData>({ ...defaultFormData })
  const [images, setImages] = useState<UploadedImage[]>([])
  const [regenerateSlug, setRegenerateSlug] = useState(false)
  const [syncedId, setSyncedId] = useState<string | null>(null)

  // SKU dialog state
  const [showSKUDialog, setShowSKUDialog] = useState(false)
  const [editingSKU, setEditingSKU] = useState<ProductSku | null>(null)
  const [deletingSKU, setDeletingSKU] = useState<ProductSku | null>(null)
  const [stockSKU, setStockSKU] = useState<ProductSku | null>(null)
  const [stockAmount, setStockAmount] = useState("")
  const [serialInput, setSerialInput] = useState("")
  const [autoGenerate, setAutoGenerate] = useState(true)

  // Fetch stock details + serials when stock dialog opens
  const { data: stockInfo } = useGetStock({
    ref_id: stockSKU?.id ?? "",
    ref_type: "ProductSku",
  })
  const { data: serialsData } = useListProductSerials({
    stock_id: stockInfo?.id ? Number(stockInfo.id) : 0,
    limit: 50,
  })
  const [skuForm, setSkuForm] = useState({
    price: "",
    combinable: true,
    attributes: [] as Array<{ name: string; value: string }>,
    weight_grams: "",
    length_cm: "",
    width_cm: "",
    height_cm: "",
  })

  // Sync product data into form
  useEffect(() => {
    if (product) {
      const data: ProductSPUFormData = {
        name: product.name,
        description: product.description,
        category_id: product.category?.id || "",
        currency: product.currency || "VND",
        is_enabled: product.is_enabled,
        tags: product.tags || [],
        resource_ids: product.resources?.map(r => r.id) || [],
        specifications: product.specifications || [],
      }
      form.reset(data)
      setImages(product.resources?.map(r => ({ id: r.id, url: r.url })) || [])
      setRegenerateSlug(false)
      setSyncedId(product.id)
    }
  }, [product])

  const isNameDirty = "name" in form.dirty

  // --- SPU submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.isDirty) {
      toast.info("No changes to save")
      return
    }

    try {
      await updateProduct.mutateAsync({
        id,
        ...form.dirty,
        // Filter empty specs before sending
        ...(form.dirty.specifications
          ? { specifications: form.dirty.specifications.filter((s) => s.name && s.value) }
          : {}),
        ...(regenerateSlug && form.dirty.name ? { regenerate_slug: true } : {}),
      })
      toast.success("Product updated successfully")
      router.push("/seller/products")
    } catch (err: any) {
      toast.error(err?.message || "Failed to update product")
    }
  }

  // --- SKU handlers ---
  const handleOpenSKUDialog = (sku?: ProductSku) => {
    if (sku) {
      setEditingSKU(sku)
      setSkuForm({
        price: sku.price.toString(),
        combinable: sku.combinable,
        attributes: sku.attributes || [],
        weight_grams: sku.package_details?.weight_grams?.toString() || "",
        length_cm: sku.package_details?.length_cm?.toString() || "",
        width_cm: sku.package_details?.width_cm?.toString() || "",
        height_cm: sku.package_details?.height_cm?.toString() || "",
      })
    } else {
      setEditingSKU(null)
      setSkuForm({
        price: "", combinable: true, attributes: [],
        weight_grams: "", length_cm: "", width_cm: "", height_cm: "",
      })
    }
    setShowSKUDialog(true)
  }

  const handleImportStock = async () => {
    if (!stockSKU) return

    const isSerial = stockInfo?.serial_required ?? false
    let change: number
    let serialIds: string[] = []

    if (isSerial && !autoGenerate) {
      // Custom serial IDs from textarea
      serialIds = serialInput.split("\n").map(s => s.trim()).filter(Boolean)
      if (serialIds.length === 0) return
      change = serialIds.length
    } else {
      change = parseInt(stockAmount)
      if (!change || change <= 0) return
    }

    try {
      await importStock.mutateAsync({
        ref_id: stockSKU.id,
        ref_type: "ProductSku",
        change,
        serial_ids: isSerial && !autoGenerate ? serialIds : [],
      })
      toast.success(`Added ${change} stock${isSerial ? ` with ${change} serial IDs` : ""}`)
      setStockSKU(null)
      setStockAmount("")
      setSerialInput("")
      setAutoGenerate(true)
    } catch (err: any) {
      toast.error(err?.message || "Failed to import stock")
    }
  }

  const handleSaveSKU = async () => {
    const packageDetails = {
      weight_grams: parseFloat(skuForm.weight_grams) || 0,
      length_cm: parseFloat(skuForm.length_cm) || 0,
      width_cm: parseFloat(skuForm.width_cm) || 0,
      height_cm: parseFloat(skuForm.height_cm) || 0,
    }

    try {
      if (editingSKU) {
        await updateSKU.mutateAsync({
          id: editingSKU.id,
          price: parseFloat(skuForm.price),
          combinable: skuForm.combinable,
          attributes: skuForm.attributes.filter((a) => a.name && a.value),
          package_details: packageDetails,
        })
        toast.success("Variant updated")
      } else {
        await createSKU.mutateAsync({
          spu_id: id,
          price: parseFloat(skuForm.price),
          combinable: skuForm.combinable,
          attributes: skuForm.attributes.filter((a) => a.name && a.value),
          package_details: packageDetails,
        })
        toast.success("Variant created")
      }
      setShowSKUDialog(false)
      setEditingSKU(null)
    } catch (err: any) {
      toast.error(err?.message || "Failed to save variant")
    }
  }

  const handleDeleteSKU = async () => {
    if (!deletingSKU) return
    try {
      await deleteSKU.mutateAsync({ id: deletingSKU.id })
      toast.success("Variant deleted")
      setDeletingSKU(null)
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete variant")
    }
  }

  // --- Loading / Error states ---
  if (isLoadingProduct || (product && syncedId !== product.id)) {
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
        <ProductSPUForm
          formKey={syncedId ?? id}
          data={form.data}
          onChange={form.set}
          images={images}
          onImagesChange={setImages}
          afterName={isNameDirty ? (
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
              <Switch
                id="regenerate-slug"
                checked={regenerateSlug}
                onCheckedChange={setRegenerateSlug}
              />
              <Label htmlFor="regenerate-slug" className="cursor-pointer font-normal">
                Regenerate URL slug from new name
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Old product links will stop working if enabled
                </span>
              </Label>
            </div>
          ) : undefined}
        />

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
                  <div key={sku.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">

                        <span className="font-medium">
                          <Price amount={sku.price} currency={product.currency} emphasis="native-only" />
                        </span>
                        <Badge variant="outline">Stock: {sku.stock}</Badge>
                        {sku.combinable && <Badge variant="secondary">Combinable</Badge>}
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
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setStockSKU(sku); setStockAmount("") }}>
                        <PackagePlus className="h-4 w-4 mr-1" />
                        Stock
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenSKUDialog(sku)}>
                        Edit
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingSKU(sku)}>
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/seller/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={updateProduct.isPending || !form.data.name}>
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

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">Bundle in one package</p>
                <p className="text-xs text-muted-foreground">Ship multiple units together instead of packaging each one separately</p>
              </div>
              <Switch
                checked={skuForm.combinable}
                onCheckedChange={(checked) => setSkuForm({ ...skuForm, combinable: checked })}
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
                      updated[index] = { ...updated[index], name: e.target.value }
                      setSkuForm({ ...skuForm, attributes: updated })
                    }}
                  />
                  <Input
                    placeholder="Value (e.g., Large)"
                    value={attr.value}
                    onChange={(e) => {
                      const updated = [...skuForm.attributes]
                      updated[index] = { ...updated[index], value: e.target.value }
                      setSkuForm({ ...skuForm, attributes: updated })
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSkuForm({ ...skuForm, attributes: skuForm.attributes.filter((_, i) => i !== index) })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSkuForm({ ...skuForm, attributes: [...skuForm.attributes, { name: "", value: "" }] })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Attribute
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Package Details</Label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ["weight_grams", "Weight (grams)"],
                  ["length_cm", "Length (cm)"],
                  ["width_cm", "Width (cm)"],
                  ["height_cm", "Height (cm)"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={skuForm[key]}
                      onChange={(e) => setSkuForm({ ...skuForm, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSKUDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSaveSKU}
              disabled={createSKU.isPending || updateSKU.isPending || !skuForm.price}
            >
              {(createSKU.isPending || updateSKU.isPending) ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : "Save Variant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete SKU Confirmation */}
      <Dialog open={!!deletingSKU} onOpenChange={() => setDeletingSKU(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Variant</DialogTitle>
            <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingSKU(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSKU} disabled={deleteSKU.isPending}>
              {deleteSKU.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>
              ) : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Stock Dialog */}
      <Dialog open={!!stockSKU} onOpenChange={() => setStockSKU(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Stock</DialogTitle>
            <DialogDescription>
              {stockSKU?.attributes && stockSKU.attributes.length > 0
                ? stockSKU.attributes.map(a => a.value).join(" / ")
                : <Price amount={stockSKU?.price ?? 0} currency={product.currency} emphasis="native-only" />}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            {/* Current stock summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-bold">{stockInfo?.stock ?? stockSKU?.stock ?? 0}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-bold">{stockInfo?.taken ?? 0}</p>
                <p className="text-xs text-muted-foreground">Sold</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 flex flex-col items-center gap-1">
                <Switch
                  checked={stockInfo?.serial_required ?? false}
                  disabled={updateStockSettings.isPending}
                  onCheckedChange={async (checked) => {
                    if (!stockSKU) return
                    try {
                      await updateStockSettings.mutateAsync({
                        ref_id: stockSKU.id,
                        ref_type: "ProductSku",
                        serial_required: checked,
                      })
                      toast.success(checked ? "Serial tracking enabled" : "Serial tracking disabled")
                    } catch (err: any) {
                      toast.error(err?.message || "Failed to update")
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">Serial Tracking</p>
              </div>
            </div>

            {/* Existing serials list */}
            {stockInfo?.serial_required && serialsData?.pages && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1.5 mb-2">
                    <Hash className="h-3.5 w-3.5" />
                    Existing Serial IDs
                  </Label>
                  {(() => {
                    const serials = serialsData.pages.flatMap(p => p.data) ?? []
                    return serials.length > 0 ? (
                      <div className="border rounded-lg max-h-32 overflow-y-auto">
                        {serials.map((serial) => (
                          <div key={serial.id} className="flex items-center justify-between px-3 py-1.5 text-xs border-b last:border-0">
                            <code className="font-mono">{serial.id}</code>
                            <Badge variant={
                              serial.status === "Active" ? "default" :
                              serial.status === "Taken" ? "secondary" :
                              "outline"
                            } className="text-[10px] h-5">
                              {serial.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No serial IDs yet</p>
                    )
                  })()}
                </div>
              </>
            )}

            <Separator />

            {/* Add stock section */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Add Stock</Label>

              {stockInfo?.serial_required ? (
                <div className="space-y-3">
                  {/* Serial mode toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">Auto-generate serial IDs</p>
                      <p className="text-xs text-muted-foreground">Generate UUID-based IDs automatically</p>
                    </div>
                    <Switch checked={autoGenerate} onCheckedChange={setAutoGenerate} />
                  </div>

                  {autoGenerate ? (
                    <div className="space-y-2">
                      <Label htmlFor="stock-amount">Quantity *</Label>
                      <Input
                        id="stock-amount"
                        type="number"
                        min="1"
                        placeholder="Number of items to add..."
                        value={stockAmount}
                        onChange={(e) => setStockAmount(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Each item will get a unique auto-generated serial ID.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="serial-input">Serial IDs (one per line) *</Label>
                      <Textarea
                        id="serial-input"
                        placeholder={"SN-001\nSN-002\nSN-003"}
                        value={serialInput}
                        onChange={(e) => setSerialInput(e.target.value)}
                        className="font-mono text-xs min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        {serialInput.split("\n").filter(s => s.trim()).length} serial IDs entered.
                        Stock will increase by this count.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="stock-amount">Quantity *</Label>
                  <Input
                    id="stock-amount"
                    type="number"
                    min="1"
                    placeholder="Number of items to add..."
                    value={stockAmount}
                    onChange={(e) => setStockAmount(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Info note */}
            <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-200">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                {stockInfo?.serial_required ? (
                  <p>
                    <strong>Serial tracking is enabled.</strong> During checkout, each purchased item will be assigned a specific serial ID from your inventory. Customers can see their serial IDs in their order details.
                  </p>
                ) : (
                  <p>
                    <strong>No serial tracking.</strong> Stock is tracked by quantity only. During checkout, the available count decreases but no specific serial ID is assigned to the buyer.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStockSKU(null)}>Cancel</Button>
            <Button
              onClick={handleImportStock}
              disabled={
                importStock.isPending ||
                (stockInfo?.serial_required && !autoGenerate
                  ? serialInput.split("\n").filter(s => s.trim()).length === 0
                  : !stockAmount || parseInt(stockAmount) <= 0)
              }
            >
              {importStock.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</>
              ) : (
                <><PackagePlus className="h-4 w-4 mr-2" />Add Stock</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
