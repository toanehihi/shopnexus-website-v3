"use client"

import { useState } from "react"
import {
  useListPaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
  type PaymentMethod,
} from "@/core/account/payment-method"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  CreditCard,
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
  Landmark,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const PAYMENT_TYPES = [
  { value: "card", label: "Credit / Debit Card", icon: CreditCard },
  { value: "e-wallet", label: "E-Wallet", icon: Wallet },
  { value: "bank-transfer", label: "Bank Transfer", icon: Landmark },
] as const

type PaymentTypeValue = (typeof PAYMENT_TYPES)[number]["value"]

function getTypeIcon(type: string) {
  const found = PAYMENT_TYPES.find((t) => t.value === type)
  return found?.icon ?? CreditCard
}

function getTypeLabel(type: string) {
  const found = PAYMENT_TYPES.find((t) => t.value === type)
  return found?.label ?? type
}

type PaymentFormData = {
  type: PaymentTypeValue
  label: string
  data: string // JSON string for the data field
  is_default: boolean
}

const emptyForm: PaymentFormData = {
  type: "card",
  label: "",
  data: "{}",
  is_default: false,
}

export default function PaymentPage() {
  const { data: paymentMethods, isLoading } = useListPaymentMethods()
  const createPaymentMethod = useCreatePaymentMethod()
  const updatePaymentMethod = useUpdatePaymentMethod()
  const deletePaymentMethod = useDeletePaymentMethod()
  const setDefaultPaymentMethod = useSetDefaultPaymentMethod()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<PaymentMethod | null>(null)
  const [formData, setFormData] = useState<PaymentFormData>(emptyForm)

  const openAddDialog = () => {
    setEditingMethod(null)
    setFormData(emptyForm)
    setIsDialogOpen(true)
  }

  const openEditDialog = (method: PaymentMethod) => {
    setEditingMethod(method)
    setFormData({
      type: method.type as PaymentTypeValue,
      label: method.label,
      data: JSON.stringify(method.data, null, 2),
      is_default: method.is_default,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.label) {
      toast.error("Please enter a label for this payment method")
      return
    }

    let parsedData: Record<string, unknown>
    try {
      parsedData = JSON.parse(formData.data)
    } catch {
      toast.error("Invalid JSON in data field")
      return
    }

    try {
      if (editingMethod) {
        await updatePaymentMethod.mutateAsync({
          id: editingMethod.id,
          type: formData.type,
          label: formData.label,
          data: parsedData,
        })
        toast.success("Payment method updated successfully")
      } else {
        await createPaymentMethod.mutateAsync({
          type: formData.type,
          label: formData.label,
          data: parsedData,
          is_default: formData.is_default,
        })
        toast.success("Payment method added successfully")
      }
      setIsDialogOpen(false)
    } catch (error) {
      toast.error(
        editingMethod
          ? "Failed to update payment method"
          : "Failed to add payment method"
      )
      console.error(error)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deletePaymentMethod.mutateAsync({ id: deleteConfirm.id })
      toast.success("Payment method deleted successfully")
      setDeleteConfirm(null)
    } catch (error) {
      toast.error("Failed to delete payment method")
      console.error(error)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultPaymentMethod.mutateAsync(id)
      toast.success("Default payment method updated")
    } catch (error) {
      toast.error("Failed to set default payment method")
      console.error(error)
    }
  }

  const isSubmitting =
    createPaymentMethod.isPending || updatePaymentMethod.isPending

  if (isLoading) {
    return <PaymentMethodsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground">
            Manage your saved payment methods
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {!paymentMethods || paymentMethods.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-muted mb-6">
            <CreditCard className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No payment methods yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Add a payment method for faster checkout.
          </p>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Payment Method
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {paymentMethods.map((method) => {
            const TypeIcon = getTypeIcon(method.type)

            return (
              <Card
                key={method.id}
                className={cn(method.is_default && "border-primary")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <TypeIcon className="h-3 w-3" />
                        {getTypeLabel(method.type)}
                      </Badge>
                      {method.is_default && (
                        <Badge className="gap-1">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(method)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(method)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium">{method.label}</span>
                    </div>
                  </div>

                  {!method.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={setDefaultPaymentMethod.isPending}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Set as Default
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Edit Payment Method" : "Add Payment Method"}
            </DialogTitle>
            <DialogDescription>
              {editingMethod
                ? "Update your payment method details."
                : "Add a new payment method to your account."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: PaymentTypeValue) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>
                      <div className="flex items-center gap-2">
                        <pt.icon className="h-4 w-4" />
                        {pt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="label"
                  placeholder="e.g. My Visa ending in 4242"
                  className="pl-10"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data (JSON)</Label>
              <Textarea
                id="data"
                placeholder='{"card_number": "****4242", "expiry": "12/25"}'
                rows={4}
                className="font-mono text-sm"
                value={formData.data}
                onChange={(e) =>
                  setFormData({ ...formData, data: e.target.value })
                }
              />
            </div>

            {!editingMethod && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={formData.is_default}
                  onChange={(e) =>
                    setFormData({ ...formData, is_default: e.target.checked })
                  }
                />
                <span className="text-sm">Set as default payment method</span>
              </label>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingMethod ? (
                "Save Changes"
              ) : (
                "Add Payment Method"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment method? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteConfirm && (
            <div className="rounded-lg border p-4 space-y-1">
              <p className="font-medium">{deleteConfirm.label}</p>
              <p className="text-sm text-muted-foreground">
                {getTypeLabel(deleteConfirm.type)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePaymentMethod.isPending}
            >
              {deletePaymentMethod.isPending ? (
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

function PaymentMethodsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-56 mt-1" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-8 w-full mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
