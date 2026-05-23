"use client"

import { useListOption } from "@/core/common/option"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CreditCard, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaymentMethodDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	selectedPaymentOption: string
	onSelectedPaymentOptionChange: (value: string) => void
	onPay: () => void
	isPaying: boolean
}

type CardData = {
	brand?: string
	last4?: string
	exp_month?: number
	exp_year?: number
	is_default?: boolean
}

export function PaymentMethodDialog({
	open,
	onOpenChange,
	selectedPaymentOption,
	onSelectedPaymentOptionChange,
	onPay,
	isPaying,
}: PaymentMethodDialogProps) {
	const { data: options } = useListOption({ type: "payment" })
	const owned = (options ?? []).filter((o) => o.owned)
	const others = (options ?? []).filter((o) => !o.owned)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Select Payment Method</DialogTitle>
				</DialogHeader>

				<RadioGroup
					value={selectedPaymentOption}
					onValueChange={onSelectedPaymentOptionChange}
					className="space-y-2"
				>
					{owned.length > 0 && (
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">
								Saved Cards
							</p>
							{owned.map((opt) => {
								const d = (opt.data ?? {}) as CardData
								return (
									<Label
										key={opt.id}
										htmlFor={`pm-${opt.id}`}
										className={cn(
											"flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
											selectedPaymentOption === opt.id &&
												"border-primary bg-accent/30",
										)}
									>
										<RadioGroupItem value={opt.id} id={`pm-${opt.id}`} />
										<CreditCard className="h-4 w-4 text-muted-foreground" />
										<div className="flex-1">
											<span className="font-medium">
												{d.brand ?? opt.provider} **** {d.last4}
											</span>
											{d.exp_month && d.exp_year && (
												<p className="text-xs text-muted-foreground">
													Expires {String(d.exp_month).padStart(2, "0")}/
													{d.exp_year}
												</p>
											)}
										</div>
										{d.is_default && (
											<Badge variant="secondary" className="text-xs">
												Default
											</Badge>
										)}
									</Label>
								)
							})}
						</div>
					)}

					{others.length > 0 && (
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">
								Other Payment Methods
							</p>
							{others.map((option) => (
								<Label
									key={option.id}
									htmlFor={`so-${option.id}`}
									className={cn(
										"flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
										selectedPaymentOption === option.id &&
											"border-primary bg-accent/30",
									)}
								>
									<RadioGroupItem value={option.id} id={`so-${option.id}`} />
									<div>
										<span className="font-medium">{option.name}</span>
										{option.description && (
											<p className="text-xs text-muted-foreground">
												{option.description}
											</p>
										)}
									</div>
								</Label>
							))}
						</div>
					)}
				</RadioGroup>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button disabled={!selectedPaymentOption || isPaying} onClick={onPay}>
						{isPaying ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Processing...
							</>
						) : (
							<>
								<CreditCard className="h-4 w-4 mr-2" />
								Pay Now
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
