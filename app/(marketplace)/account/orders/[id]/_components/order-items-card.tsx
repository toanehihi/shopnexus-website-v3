"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useExchangeRates, useCurrency } from "@/core/common/currency"
import { formatPriceInline } from "@/lib/money"
import { Package } from "lucide-react"

interface OrderItemsCardProps {
	items: {
		ID: number
		SkuName: string
		SkuID: string
		Quantity: number
		SubtotalAmount: number
		Note?: string | null
	}[]
	currency: string
}

export function OrderItemsCard({ items, currency }: OrderItemsCardProps) {
	const preferred = useCurrency()
	const { data: rateData } = useExchangeRates()
	return (
		<Card>
			<CardHeader>
				<CardTitle>Order Items ({items.length})</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{items.map((item) => (
					<div key={item.ID} className="flex gap-4">
						<div className="relative h-20 w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
							<Package className="h-8 w-8 text-muted-foreground" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="font-medium truncate">{item.SkuName}</p>
							{item.Note && (
								<p className="text-sm text-muted-foreground truncate">
									{item.Note}
								</p>
							)}

							<div className="flex items-center justify-between mt-2">
								<p className="text-sm text-muted-foreground">
									Qty: {item.Quantity}
								</p>
								<span className="font-medium">
									{formatPriceInline(
										item.SubtotalAmount,
										currency,
										preferred,
										rateData?.rates,
										"native",
									)}
								</span>
							</div>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	)
}
