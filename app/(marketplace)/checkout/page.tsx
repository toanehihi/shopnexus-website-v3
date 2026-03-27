"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useGetCart } from "@/core/order/cart"
import { useCheckout } from "@/core/order/order.buyer"
import { useListContacts, AddressType, type Contact } from "@/core/account/contact"
import { useGetMe } from "@/core/account/account"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  MapPin,
  Loader2,
  ChevronLeft,
  ShoppingBag,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

export default function CheckoutPage() {
  const router = useRouter()
  const { data: cart, isLoading: cartLoading } = useGetCart()
  const { data: contacts, isLoading: contactsLoading } = useListContacts()
  const { data: user } = useGetMe()

  const checkoutMutation = useCheckout()

  const [selectedContactId, setSelectedContactId] = useState<string>("")

  // Set default contact when data loads
  useEffect(() => {
    if (contacts && contacts.length > 0 && !selectedContactId) {
      const defaultContact = user?.default_contact_id
        ? contacts.find((c) => c.id === user.default_contact_id)
        : null
      setSelectedContactId(defaultContact?.id ?? contacts[0].id)
    }
  }, [contacts, user, selectedContactId])

  const selectedContact = useMemo(
    () => contacts?.find((c) => c.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  )

  const handleCheckout = async () => {
    if (!selectedContact || !cart) return

    try {
      await checkoutMutation.mutateAsync({
        buy_now: false,
        items: cart.map((item) => ({
          sku_id: item.sku.id,
          quantity: item.quantity,
          address: selectedContact.address,
        })),
      })

      toast.success("Checkout successful! Items are now pending.")
      router.push("/account/pending-items")
    } catch (error) {
      toast.error("Failed to checkout. Please try again.")
      console.error(error)
    }
  }

  const isLoading = cartLoading || contactsLoading
  const itemCount = cart?.reduce((acc, item) => acc + item.quantity, 0) ?? 0
  const subtotal = cart?.reduce((acc, item) => acc + item.sku.price * item.quantity, 0) ?? 0

  if (isLoading) {
    return <CheckoutPageSkeleton />
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-muted mb-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Add some products before checking out.</p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    )
  }

  const canCheckout = !!selectedContactId

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/cart"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Cart
      </Link>

      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/account/addresses" className="gap-1">
                    Manage addresses
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!contacts || contacts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No saved addresses</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add an address first to continue with checkout.
                  </p>
                  <Button asChild>
                    <Link href="/account/addresses">Add an Address</Link>
                  </Button>
                </div>
              ) : (
                <RadioGroup
                  value={selectedContactId}
                  onValueChange={setSelectedContactId}
                  className="space-y-3"
                >
                  {contacts.map((contact) => {
                    const isDefault = user?.default_contact_id === contact.id
                    const isHome = contact.address_type === AddressType.Home
                    return (
                      <Label
                        key={contact.id}
                        htmlFor={`address-${contact.id}`}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/50",
                          selectedContactId === contact.id && "border-primary bg-accent/30"
                        )}
                      >
                        <RadioGroupItem
                          value={contact.id}
                          id={`address-${contact.id}`}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{contact.full_name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {isHome ? "Home" : "Work"}
                            </Badge>
                            {isDefault && (
                              <Badge className="text-xs">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{contact.phone}</p>
                          <p className="text-sm text-muted-foreground">{contact.address}</p>
                        </div>
                      </Label>
                    )
                  })}
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          {/* Order Items Review */}
          <Card>
            <CardHeader>
              <CardTitle>Items ({itemCount})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.map((item) => (
                <div key={item.sku.id} className="flex gap-3">
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {item.resource?.url ? (
                      <Image
                        src={item.resource.url}
                        alt="Product"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.sku.attributes?.map((a) => a.value).join(" / ") || "Product"}
                    </p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">
                    {formatPrice(item.sku.price * item.quantity)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Checkout Button */}
          <Button
            size="lg"
            className="w-full"
            disabled={!canCheckout || checkoutMutation.isPending}
            onClick={handleCheckout}
          >
            {checkoutMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Place Order"
            )}
          </Button>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items Preview */}
              <div className="space-y-3">
                {cart.slice(0, 3).map((item) => (
                  <div key={item.sku.id} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.resource?.url ? (
                        <Image
                          src={item.resource.url}
                          alt="Product"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {item.sku.attributes?.map((a) => a.value).join(" / ") || "Product"}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(item.sku.price * item.quantity)}
                    </p>
                  </div>
                ))}
                {cart.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{cart.length - 3} more items
                  </p>
                )}
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Products ({itemCount} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping and payment will be determined after the seller confirms your items.
                </p>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CheckoutPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-5 w-24 mb-6" />
      <Skeleton className="h-10 w-32 mb-8" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
