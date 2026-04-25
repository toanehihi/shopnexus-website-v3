"use client"

import { useState } from "react"
import {
  useListPromotionVendor,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  Promotion,
  PromotionTypes,
  PromotionType,
} from "@/core/promotion/promotion.vendor"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
  Tag,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Loader2,
  Copy,
  Search,
} from "lucide-react"

type FormData = {
  code: string
  title: string
  type: PromotionType
  description: string
  is_enabled: boolean
  auto_apply: boolean
  group: string
  priority: string
  date_started: string
  date_ended: string
  data: string
}

const defaultFormData: FormData = {
  code: "",
  title: "",
  type: "Discount",
  description: "",
  is_enabled: true,
  auto_apply: false,
  group: "",
  priority: "0",
  date_started: new Date().toISOString().split("T")[0],
  date_ended: "",
  data: "",
}

function promotionToForm(promo: Promotion): FormData {
  return {
    code: promo.code,
    title: promo.title,
    type: (promo.type as PromotionType) || "Discount",
    description: promo.description ?? "",
    is_enabled: promo.is_enabled,
    auto_apply: promo.auto_apply,
    group: promo.group ?? "",
    priority: String(promo.priority ?? 0),
    date_started: promo.date_started
      ? new Date(promo.date_started).toISOString().split("T")[0]
      : "",
    date_ended: promo.date_ended
      ? new Date(promo.date_ended).toISOString().split("T")[0]
      : "",
    data: promo.data ? JSON.stringify(promo.data, null, 2) : "",
  }
}

const typeBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Discount: "default",
  ShipDiscount: "secondary",
  Bundle: "outline",
  BuyXGetY: "outline",
  Cashback: "secondary",
}

export default function SellerPromotionsPage() {
  const [search, setSearch] = useState("")
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [deletePromotion, setDeletePromotion] = useState<Promotion | null>(null)
  const [formData, setFormData] = useState<FormData>(defaultFormData)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useListPromotionVendor({ limit: 20 })
  const createMutation = useCreatePromotion()
  const updateMutation = useUpdatePromotion()
  const deleteMutation = useDeletePromotion()

  const promotions = data?.pages.flatMap((page) => page.data) ?? []

  const filteredPromotions = promotions.filter(
    (promo) =>
      promo.code.toLowerCase().includes(search.toLowerCase()) ||
      promo.title.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setFormData(defaultFormData)
    setEditingPromotion(null)
    setDialogMode("create")
  }

  const openEdit = (promo: Promotion) => {
    setFormData(promotionToForm(promo))
    setEditingPromotion(promo)
    setDialogMode("edit")
  }

  const closeDialog = () => {
    setDialogMode(null)
    setEditingPromotion(null)
    setFormData(defaultFormData)
  }

  const parseDataJson = (): unknown | undefined => {
    if (!formData.data.trim()) return undefined
    try {
      return JSON.parse(formData.data)
    } catch {
      return undefined
    }
  }

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      code: formData.code,
      type: formData.type,
      title: formData.title,
      description: formData.description || null,
      is_enabled: formData.is_enabled,
      auto_apply: formData.auto_apply,
      group: formData.group,
      priority: parseInt(formData.priority) || 0,
      data: parseDataJson(),
      date_started: new Date(formData.date_started).toISOString(),
      date_ended: formData.date_ended
        ? new Date(formData.date_ended).toISOString()
        : null,
      refs: [],
    })
    closeDialog()
  }

  const handleUpdate = async () => {
    if (!editingPromotion) return
    const dataJson = parseDataJson()
    await updateMutation.mutateAsync({
      id: editingPromotion.id,
      code: formData.code,
      title: formData.title,
      description: formData.description || null,
      is_enabled: formData.is_enabled,
      auto_apply: formData.auto_apply,
      group: formData.group,
      priority: parseInt(formData.priority) || 0,
      data: dataJson,
      null_data: !formData.data.trim(),
      date_started: new Date(formData.date_started).toISOString(),
      date_ended: formData.date_ended
        ? new Date(formData.date_ended).toISOString()
        : null,
      null_date_ended: !formData.date_ended,
    })
    closeDialog()
  }

  const handleDelete = async () => {
    if (!deletePromotion) return
    await deleteMutation.mutateAsync(deletePromotion.id)
    setDeletePromotion(null)
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  const isExpired = (promo: Promotion) => {
    if (!promo.date_ended) return false
    return new Date(promo.date_ended) < new Date()
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Promotions</h1>
          <p className="text-muted-foreground">
            Create and manage promotions for your store
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by code or title..."
          className="pl-10 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Promotions List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPromotions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No promotions found</h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? "Try a different search term"
                : "Create your first promotion to attract customers"}
            </p>
            {!search && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Promotion
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPromotions.map((promo) => (
            <Card key={promo.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Top row: code, badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <code className="px-2 py-1 bg-muted rounded text-sm font-mono font-medium">
                          {promo.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(promo.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <Badge variant={typeBadgeVariant[promo.type] ?? "outline"}>
                        {promo.type}
                      </Badge>
                      <Badge
                        variant={
                          promo.is_enabled && !isExpired(promo)
                            ? "default"
                            : "secondary"
                        }
                      >
                        {isExpired(promo)
                          ? "Expired"
                          : promo.is_enabled
                            ? "Active"
                            : "Inactive"}
                      </Badge>
                      {promo.auto_apply && (
                        <Badge variant="outline">Auto-apply</Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-medium">{promo.title}</h3>

                    {/* Description */}
                    {promo.description && (
                      <p className="text-sm text-muted-foreground">
                        {promo.description}
                      </p>
                    )}

                    {/* Meta row: date range, priority, group */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDate(promo.date_started)}
                          {promo.date_ended &&
                            ` - ${formatDate(promo.date_ended)}`}
                        </span>
                      </div>
                      {promo.group && (
                        <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                          {promo.group}
                        </span>
                      )}
                      {promo.priority !== 0 && (
                        <span>Priority: {promo.priority}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(promo)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletePromotion(promo)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More */}
          {hasNextPage && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Promotion Dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? "Edit Promotion" : "Create Promotion"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "edit"
                ? "Update the details of this promotion"
                : "Create a new promotion for your store"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Code & Title */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promo-code">Code</Label>
                <Input
                  id="promo-code"
                  placeholder="SUMMER20"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-title">Title</Label>
                <Input
                  id="promo-title"
                  placeholder="Summer Sale"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Type */}
            {dialogMode === "create" && (
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) =>
                    setFormData({ ...formData, type: val as PromotionType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PromotionTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="promo-desc">Description (optional)</Label>
              <Input
                id="promo-desc"
                placeholder="Get 20% off on all summer items"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Group & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promo-group">Group</Label>
                <Input
                  id="promo-group"
                  placeholder="seasonal"
                  value={formData.group}
                  onChange={(e) =>
                    setFormData({ ...formData, group: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-priority">Priority</Label>
                <Input
                  id="promo-priority"
                  type="number"
                  placeholder="0"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promo-start">Start Date</Label>
                <Input
                  id="promo-start"
                  type="date"
                  value={formData.date_started}
                  onChange={(e) =>
                    setFormData({ ...formData, date_started: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-end">End Date (optional)</Label>
                <Input
                  id="promo-end"
                  type="date"
                  value={formData.date_ended}
                  onChange={(e) =>
                    setFormData({ ...formData, date_ended: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Active</p>
                <p className="text-sm text-muted-foreground">
                  Enable this promotion
                </p>
              </div>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_enabled: checked })
                }
              />
            </div>

            {/* Auto-apply toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Auto-apply</p>
                <p className="text-sm text-muted-foreground">
                  Automatically apply at checkout
                </p>
              </div>
              <Switch
                checked={formData.auto_apply}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, auto_apply: checked })
                }
              />
            </div>

            {/* Data (JSON) */}
            <div className="space-y-2">
              <Label htmlFor="promo-data">Data (JSON, optional)</Label>
              <Textarea
                id="promo-data"
                placeholder='{"discount_percent": 20, "max_discount": 50}'
                className="font-mono text-sm min-h-[100px]"
                value={formData.data}
                onChange={(e) =>
                  setFormData({ ...formData, data: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={dialogMode === "edit" ? handleUpdate : handleCreate}
              disabled={isSaving || !formData.code || !formData.title || !formData.group}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {dialogMode === "edit" ? "Saving..." : "Creating..."}
                </>
              ) : dialogMode === "edit" ? (
                "Save Changes"
              ) : (
                "Create Promotion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletePromotion}
        onOpenChange={() => setDeletePromotion(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Promotion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the promotion &quot;
              {deletePromotion?.code}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePromotion(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
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
