"use client"

import { useState } from "react"
import {
  useListPaymentMethods,
  useCreatePaymentMethod,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
  type PaymentMethod,
} from "@/core/account/payment-method"
import { Button } from "@/components/ui/button"
import { CreditCard, Plus } from "lucide-react"
import { toast } from "sonner"
import { PaymentMethodsSkeleton } from "./_components/payment-methods-skeleton"
import { PaymentCardItem } from "./_components/payment-card-item"
import { AddCardDialog, type CardFormData } from "./_components/add-card-dialog"
import { DeleteCardDialog } from "./_components/delete-card-dialog"

const emptyCardForm: CardFormData = {
  provider: "",
  label: "",
  token: "",
  is_default: false,
}

export default function PaymentPage() {
  const { data: paymentMethods, isLoading } = useListPaymentMethods()
  const createPaymentMethod = useCreatePaymentMethod()
  const deletePaymentMethod = useDeletePaymentMethod()
  const setDefaultPaymentMethod = useSetDefaultPaymentMethod()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<PaymentMethod | null>(null)
  const [formData, setFormData] = useState<CardFormData>(emptyCardForm)

  // Filter to only show card-type payment methods
  const cards = paymentMethods?.filter((m) => m.type === "card") ?? []

  const openAddDialog = () => {
    setFormData(emptyCardForm)
    setIsAddDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.label) {
      toast.error("Please enter a label for this card")
      return
    }
    if (!formData.provider) {
      toast.error("Please enter a provider")
      return
    }

    try {
      await createPaymentMethod.mutateAsync({
        type: "card",
        provider: formData.provider,
        label: formData.label,
        data: formData.token ? { token: formData.token } : {},
        is_default: formData.is_default,
      })
      toast.success("Card added successfully")
      setIsAddDialogOpen(false)
    } catch (error) {
      toast.error("Failed to add card")
      console.error(error)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deletePaymentMethod.mutateAsync({ id: deleteConfirm.id })
      toast.success("Card deleted successfully")
      setDeleteConfirm(null)
    } catch (error) {
      toast.error("Failed to delete card")
      console.error(error)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultPaymentMethod.mutateAsync(id)
      toast.success("Default card updated")
    } catch (error) {
      toast.error("Failed to set default card")
      console.error(error)
    }
  }

  if (isLoading) {
    return <PaymentMethodsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground">
            Manage your saved cards
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-muted mb-6">
            <CreditCard className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No cards yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Add a card for faster checkout.
          </p>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Card
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((method) => (
            <PaymentCardItem
              key={method.id}
              method={method}
              onDelete={setDeleteConfirm}
              onSetDefault={handleSetDefault}
              isSettingDefault={setDefaultPaymentMethod.isPending}
            />
          ))}
        </div>
      )}

      <AddCardDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={createPaymentMethod.isPending}
      />

      <DeleteCardDialog
        method={deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        onDelete={handleDelete}
        isDeleting={deletePaymentMethod.isPending}
      />
    </div>
  )
}
