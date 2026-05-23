"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useExchangeRates, useCurrency } from "@/core/common/currency"
import { formatPriceInline } from "@/lib/money"
import { ImageOff } from "lucide-react"

interface OrderItemsCardProps {
	items: {
		id: number
		sku_name: string
		sku_id: string
		spu_id: string
		slug?: string
		image_url?: string
		quantity: number
		subtotal_amount: number
		note?: string | null
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
			<CardContent className="divide-y -mx-6 px-0">
				{items.map((item) => {
					const linkTarget = item.slug ? `/product/${item.slug}` : null
					const Thumb = (
						<div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
							{item.image_url ? (
								<Image
									src={item.image_url}
									alt={item.sku_name}
									fill
									className="object-cover"
									sizes="80px"
									unoptimized
								/>
							) : (
								<div className="absolute inset-0 grid place-items-center text-muted-foreground">
									<ImageOff className="h-6 w-6" />
								</div>
							)}
						</div>
					)
					return (
						<div key={item.id} className="flex gap-4 px-6 py-4 first:pt-0 last:pb-0">
							{linkTarget ? (
								<Link href={linkTarget} className="shrink-0">
									{Thumb}
								</Link>
							) : (
								Thumb
							)}
							<div className="flex-1 min-w-0">
								{linkTarget ? (
									<Link
										href={linkTarget}
										className="font-medium hover:underline line-clamp-2"
									>
										{item.sku_name}
									</Link>
								) : (
									<p className="font-medium line-clamp-2">{item.sku_name}</p>
								)}
								{item.note && (
									<p className="text-sm text-muted-foreground italic mt-1 truncate">
										Note: {item.note}
									</p>
								)}
								<div className="flex items-center justify-between mt-2">
									<p className="text-sm text-muted-foreground">
										Qty {item.quantity}
									</p>
									<span className="font-semibold tabular-nums">
										{formatPriceInline(
											item.subtotal_amount,
											currency,
											preferred,
											rateData?.rates,
											"native",
										)}
									</span>
								</div>
							</div>
						</div>
					)
				})}
			</CardContent>
		</Card>
	)
}
