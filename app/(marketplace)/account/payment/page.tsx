"use client"

import { useState } from "react"
import {
	useListOption,
	useUpsertOptions,
	useDeleteOptions,
	type Option,
	type OptionInput,
} from "@/core/common/option"
import { Button } from "@/components/ui/button"
import { CreditCard, Plus } from "lucide-react"
import { toast } from "sonner"
import { PaymentMethodsSkeleton } from "./_components/payment-methods-skeleton"
import { PaymentCardItem } from "./_components/payment-card-item"
import { AddCardDialog, type CardFormData } from "./_components/add-card-dialog"
import { DeleteCardDialog } from "./_components/delete-card-dialog"
import { cardDataOf, type CardData } from "./_components/card-data"

const emptyCardForm: CardFormData = {
	provider: "",
	label: "",
	token: "",
	is_default: false,
}

const newCardOption = (form: CardFormData): OptionInput => {
	const data: CardData = {
		kind: "card",
		is_default: form.is_default,
	}
	if (form.token) data.token = form.token
	return {
		id: crypto.randomUUID(),
		type: "payment",
		provider: form.provider,
		is_enabled: true,
		name: form.label,
		description: "",
		priority: 0,
		logo_rs_id: null,
		data: data as Record<string, unknown>,
	}
}

// Strips the response-only `owned` flag so an Option can be re-sent to upsert.
const toInput = (o: Option): OptionInput => ({
	id: o.id,
	type: o.type,
	provider: o.provider,
	is_enabled: o.is_enabled,
	name: o.name,
	description: o.description,
	priority: o.priority,
	logo_rs_id: o.logo_rs_id,
	data: o.data,
})

export default function PaymentPage() {
	const { data: options, isLoading } = useListOption({ type: "payment" })
	const upsert = useUpsertOptions()
	const remove = useDeleteOptions()

	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [deleteConfirm, setDeleteConfirm] = useState<Option | null>(null)
	const [formData, setFormData] = useState<CardFormData>(emptyCardForm)

	// Saved cards = owned payment options whose data.kind is "card" (or unset,
	// for back-compat with legacy rows that didn't tag the kind).
	const cards = (options ?? []).filter((o) => {
		if (!o.owned) return false
		const kind = cardDataOf(o).kind
		return kind == null || kind === "card"
	})

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
			await upsert.mutateAsync({
				type: "payment",
				configs: [newCardOption(formData)],
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
			await remove.mutateAsync({ ids: [deleteConfirm.id] })
			toast.success("Card deleted successfully")
			setDeleteConfirm(null)
		} catch (error) {
			toast.error("Failed to delete card")
			console.error(error)
		}
	}

	// Toggling default rewrites every card's is_default flag in one batch.
	// Concurrent toggles race, but the user can only have one toggle in flight
	// at a time (the buttons disable while pending), so it's fine.
	const handleSetDefault = async (id: string) => {
		try {
			const configs = cards.map((o) => ({
				...toInput(o),
				data: { ...(o.data as Record<string, unknown>), is_default: o.id === id },
			}))
			await upsert.mutateAsync({ type: "payment", configs })
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
					<p className="text-muted-foreground">Manage your saved cards</p>
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
							isSettingDefault={upsert.isPending}
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
				isSubmitting={upsert.isPending}
			/>

			<DeleteCardDialog
				method={deleteConfirm}
				onOpenChange={() => setDeleteConfirm(null)}
				onDelete={handleDelete}
				isDeleting={remove.isPending}
			/>
		</div>
	)
}
