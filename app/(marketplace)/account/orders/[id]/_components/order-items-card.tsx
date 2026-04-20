"use client"

import Image from "next/image"
import { Price } from "@/components/ui/price"
import { ProductLink } from "@/components/product/product-link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"

interface OrderItemsCardProps {
	items: {
		id: number
		sku_name: string
		sku_id: string
		spu_id: string
		quantity: number
		unit_price: number
		note?: string | null
		resources?: { url: string }[]
	}[]
	currency: string
}

export function OrderItemsCard({ items, currency }: OrderItemsCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Order Items ({items.length})</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{items.map((item) => (
					<div key={item.id} className="flex gap-4">
						<div className="relative h-20 w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
							{item.resources?.[0] ? (
								<Image
									src={item.resources[0].url}
									alt={item.sku_name}
									fill
									className="object-cover rounded-lg"
								/>
							) : (
								<Package className="h-8 w-8 text-muted-foreground" />
							)}
						</div>
						<div className="flex-1 min-w-0">
							<ProductLink
								spuId={item.spu_id}
								onClick={(e) => e.stopPropagation()}
							>
								{item.sku_name}
							</ProductLink>
							{item.note && (
								<p className="text-sm text-muted-foreground truncate">
									{item.note}
								</p>
							)}

							<div className="flex items-center justify-between mt-2">
								<p className="text-sm text-muted-foreground">
									Qty: {item.quantity}
								</p>
								<Price
									amount={item.unit_price * item.quantity}
									currency={currency}
									emphasis="native"
									showRateHint
									className="font-medium"
								/>
							</div>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	)
}
