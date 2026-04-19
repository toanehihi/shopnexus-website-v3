"use client"

import Link from "next/link"
import Image from "next/image"
import { useRequireAuth } from "@/core/account/auth"
import { useGetCart, useUpdateCart, useClearCart } from "@/core/order/cart"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Truck,
  Shield,
  Tag,
} from "lucide-react"

export default function CartPage() {
  const isAuthenticated = useRequireAuth()
  const { data: cart, isLoading } = useGetCart()

  if (!isAuthenticated) return null
  const updateCart = useUpdateCart()
  const clearCart = useClearCart()

  const subtotal = cart?.reduce((acc, item) => acc + item.sku.price * item.quantity, 0) ?? 0
  const itemCount = cart?.reduce((acc, item) => acc + item.quantity, 0) ?? 0

  const handleUpdateQuantity = (skuId: string, delta: number) => {
    updateCart.mutate({ sku_id: skuId, delta_quantity: delta })
  }

  const handleRemoveItem = (skuId: string) => {
    updateCart.mutate({ sku_id: skuId, quantity: 0 })
  }

  if (isLoading) {
    return <CartPageSkeleton />
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Shopping Cart</span>
      </nav>

      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {!cart || cart.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-muted mb-6">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Looks like you haven&apos;t added anything to your cart yet. Start shopping to fill it up!
          </p>
          <Button size="lg" asChild>
            <Link href="/">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"} in cart
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => clearCart.mutate()}
                disabled={clearCart.isPending}
              >
                Clear All
              </Button>
            </div>

            <div className="space-y-4">
              {cart.map((item) => (
                <Card key={item.sku.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.resource?.url ? (
                          <Image
                            src={item.resource.url}
                            alt="Product"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                          <div>
                            <h3 className="font-medium truncate">
                              {item.sku.attributes?.map(a => a.value).join(" / ") || "Product"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              SKU: {item.sku.id.slice(0, 8)}...
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatPrice(item.sku.price * item.quantity)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(item.sku.price)} each
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(item.sku.id, -1)}
                              disabled={item.quantity <= 1 || updateCart.isPending}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-10 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(item.sku.id, 1)}
                              disabled={updateCart.isPending}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveItem(item.sku.id)}
                            disabled={updateCart.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Promo Code */}
                <div className="flex gap-2">
                  <Input placeholder="Promo code" className="flex-1" />
                  <Button variant="outline">Apply</Button>
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Shipping calculated at checkout
                  </p>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <Button size="lg" className="w-full" asChild>
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>

                <Button variant="outline" className="w-full" asChild>
                  <Link href="/">Continue Shopping</Link>
                </Button>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2 pt-4">
                  {[
                    { icon: Truck, label: "Free Shipping" },
                    { icon: Shield, label: "Secure" },
                    { icon: Tag, label: "Best Price" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1 text-center">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function CartPageSkeleton() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-2 mb-8">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-10 w-48 mb-8" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32 mt-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div>
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
