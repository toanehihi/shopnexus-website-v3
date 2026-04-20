"use client"

import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { useGetCart, useUpdateCart, useClearCart } from "@/core/order/cart"
import { Price } from "@/components/ui/price"
import { useExchangeRates, usePreferredCurrency } from "@/core/common/currency"
import { convertMoney, formatMoney } from "@/lib/money"
import Image from "next/image"
import Link from "next/link"
import { toast } from "@/components/ui/sonner"
import { CartItemSkeleton } from "@/components/skeletons"

interface CartSheetProps {
	onClose: () => void
}

export function CartSheet({ onClose }: CartSheetProps) {
	const { data: cart, isLoading } = useGetCart()
	const updateCart = useUpdateCart()
	const clearCart = useClearCart()
	const preferred = usePreferredCurrency()
	const { data: rateData } = useExchangeRates()

	const items = cart ?? []
	const cartGroups = items.reduce<Record<string, number>>((acc, i) => {
		const c = i.currency
		acc[c] = (acc[c] ?? 0) + i.sku.price * i.quantity
		return acc
	}, {})
	const cartCurrencies = Object.keys(cartGroups)
	const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)

	const handleUpdateQuantity = (skuId: string, delta: number) => {
		updateCart.mutate(
			{ sku_id: skuId, delta_quantity: delta },
			{
				onSuccess: () => {
					toast.success(
						delta > 0 ? "Item quantity increased" : "Item quantity decreased",
					)
				},
				onError: () => {
					toast.error("Failed to update quantity")
				},
			},
		)
	}

	const handleRemoveItem = (skuId: string) => {
		updateCart.mutate(
			{ sku_id: skuId, quantity: 0 },
			{
				onSuccess: () => {
					toast.success("Item removed from cart")
				},
				onError: () => {
					toast.error("Failed to remove item")
				},
			},
		)
	}

	return (
		<SheetContent className="flex flex-col w-full sm:max-w-lg">
			<SheetHeader>
				<SheetTitle className="flex items-center gap-2">
					<ShoppingBag className="h-5 w-5" />
					Shopping Cart ({itemCount})
				</SheetTitle>
			</SheetHeader>

			{isLoading ? (
				<div className="flex-1 space-y-4 py-4">
					<CartItemSkeleton />
					<CartItemSkeleton />
					<CartItemSkeleton />
				</div>
			) : !cart || cart.length === 0 ? (
				<div className="flex-1 flex flex-col items-center justify-center gap-4">
					<ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
					<p className="text-muted-foreground">Your cart is empty</p>
					<Button onClick={onClose} asChild>
						<Link href="/">Continue Shopping</Link>
					</Button>
				</div>
			) : (
				<>
					<ScrollArea className="flex-1 -mx-6 px-6">
						<div className="space-y-4 p-4">
							{cart.map((item) => (
								<div key={item.sku.id} className="flex gap-4">
									<div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
										{item.resource?.url ? (
											<Image
												src={item.resource.url}
												alt="Product"
												fill
												className="object-cover"
											/>
										) : (
											<div className="flex items-center justify-center h-full text-muted-foreground">
												<ShoppingBag className="h-8 w-8" />
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<h4 className="font-medium truncate text-sm">
											{item.sku.attributes?.map((a) => a.value).join(" / ") ||
												"Product"}
										</h4>
										<div className="flex items-center gap-2 mt-1">
											<Price
												amount={item.sku.price}
												currency={item.currency}
												emphasis="preferred"
												hideConverted
												className="font-semibold text-sm"
											/>
										</div>
										<div className="flex items-center justify-between mt-2">
											<div className="flex items-center gap-1">
												<Button
													variant="outline"
													size="icon"
													className="h-7 w-7"
													onClick={() => handleUpdateQuantity(item.sku.id, -1)}
													disabled={item.quantity <= 1 || updateCart.isPending}
												>
													<Minus className="h-3 w-3" />
												</Button>
												<span className="w-8 text-center text-sm">
													{item.quantity}
												</span>
												<Button
													variant="outline"
													size="icon"
													className="h-7 w-7"
													onClick={() => handleUpdateQuantity(item.sku.id, 1)}
													disabled={updateCart.isPending}
												>
													<Plus className="h-3 w-3" />
												</Button>
											</div>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 text-destructive hover:text-destructive"
												onClick={() => handleRemoveItem(item.sku.id)}
												disabled={updateCart.isPending}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					</ScrollArea>

					<div className="space-y-4 p-4">
						<Separator />
						<div className="flex items-start justify-between">
							<span className="text-muted-foreground">Subtotal</span>
							<div className="flex flex-col items-end gap-1">
								{cartCurrencies.map((c) => (
									<Price
										key={c}
										amount={cartGroups[c]}
										currency={c}
										emphasis="preferred"
										className="font-semibold"
									/>
								))}
								{cartCurrencies.length > 1 && rateData && (
									<span className="text-xs text-muted-foreground">
										Grand total ≈{" "}
										{formatMoney(
											cartCurrencies.reduce(
												(sum, c) =>
													sum +
													convertMoney(cartGroups[c], c, preferred, rateData.rates),
												0,
											),
											preferred,
										)}
									</span>
								)}
							</div>
						</div>
						<p className="text-xs text-muted-foreground">
							Shipping and taxes calculated at checkout.
						</p>
						<div className="grid gap-2">
							<Button asChild size="lg" onClick={onClose}>
								<Link href="/checkout">Checkout</Link>
							</Button>
							<Button variant="outline" onClick={onClose} asChild>
								<Link href="/cart">View Cart</Link>
							</Button>
						</div>
						<Button
							variant="ghost"
							size="sm"
							className="w-full text-destructive hover:text-destructive"
							onClick={() =>
								clearCart.mutate(undefined, {
									onSuccess: () => toast.success("Cart cleared"),
									onError: () => toast.error("Failed to clear cart"),
								})
							}
							disabled={clearCart.isPending}
						>
							Clear Cart
						</Button>
					</div>
				</>
			)}
		</SheetContent>
	)
}
