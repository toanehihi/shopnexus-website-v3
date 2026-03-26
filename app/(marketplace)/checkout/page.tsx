"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useGetCart } from "@/core/order/cart"
import { useQuote, useCheckout } from "@/core/order/order.customer"
import { useListContacts, AddressType, type Contact } from "@/core/account/contact"
import { useGetMe } from "@/core/account/account"
import { useListServiceOption } from "@/core/common/option"
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
  Truck,
  CreditCard,
  Loader2,
  ChevronLeft,
  Check,
  ShoppingBag,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

const steps = [
  { id: 1, name: "Shipping" },
  { id: 2, name: "Payment & Review" },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { data: cart, isLoading: cartLoading } = useGetCart()
  const { data: contacts, isLoading: contactsLoading } = useListContacts()
  const { data: user } = useGetMe()
  const { data: shipmentOptions, isLoading: shipmentLoading } = useListServiceOption({ category: "shipment" })
  const { data: paymentOptions, isLoading: paymentLoading } = useListServiceOption({ category: "payment" })

  const quoteMutation = useQuote()
  const checkoutMutation = useCheckout()

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedContactId, setSelectedContactId] = useState<string>("")
  const [selectedShipmentOption, setSelectedShipmentOption] = useState<string>("")
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<string>("")

  // Set defaults when data loads
  useEffect(() => {
    if (contacts && contacts.length > 0 && !selectedContactId) {
      const defaultContact = user?.default_contact_id
        ? contacts.find((c) => c.id === user.default_contact_id)
        : null
      setSelectedContactId(defaultContact?.id ?? contacts[0].id)
    }
  }, [contacts, user, selectedContactId])

  useEffect(() => {
    if (shipmentOptions && shipmentOptions.length > 0 && !selectedShipmentOption) {
      setSelectedShipmentOption(shipmentOptions[0].id)
    }
  }, [shipmentOptions, selectedShipmentOption])

  useEffect(() => {
    if (paymentOptions && paymentOptions.length > 0 && !selectedPaymentOption) {
      setSelectedPaymentOption(paymentOptions[0].id)
    }
  }, [paymentOptions, selectedPaymentOption])

  const selectedContact = useMemo(
    () => contacts?.find((c) => c.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  )

  // Fetch quote when we have address + shipment + cart
  useEffect(() => {
    if (selectedContact && selectedShipmentOption && cart && cart.length > 0) {
      quoteMutation.mutate({
        address: selectedContact.address,
        items: cart.map((item) => ({
          sku_id: item.sku.id,
          quantity: item.quantity,
          shipment_option: selectedShipmentOption,
        })),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContactId, selectedShipmentOption, cart])

  const handlePlaceOrder = async () => {
    if (!selectedContact || !selectedPaymentOption || !selectedShipmentOption || !cart) return

    try {
      const result = await checkoutMutation.mutateAsync({
        address: selectedContact.address,
        payment_option: selectedPaymentOption,
        buy_now: false,
        items: cart.map((item) => ({
          sku_id: item.sku.id,
          quantity: item.quantity,
          shipment_option: selectedShipmentOption,
        })),
      })

      toast.success("Order placed successfully!")

      if (result.url) {
        window.location.href = result.url
      } else {
        router.push("/account/orders")
      }
    } catch (error) {
      toast.error("Failed to place order. Please try again.")
      console.error(error)
    }
  }

  const isLoading = cartLoading || contactsLoading || shipmentLoading || paymentLoading
  const itemCount = cart?.reduce((acc, item) => acc + item.quantity, 0) ?? 0

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

  const canProceedToStep2 = !!selectedContactId && !!selectedShipmentOption
  const canPlaceOrder = canProceedToStep2 && !!selectedPaymentOption

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

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 font-medium transition-colors",
                currentStep > step.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : currentStep === step.id
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground"
              )}
            >
              {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
            </div>
            <span
              className={cn(
                "ml-2 text-sm font-medium hidden sm:inline",
                currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.name}
            </span>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-12 sm:w-24 h-0.5 mx-4",
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Address & Shipping */}
          {currentStep === 1 && (
            <>
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

              {/* Shipment Option Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!shipmentOptions || shipmentOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No shipping options available.</p>
                  ) : (
                    <RadioGroup
                      value={selectedShipmentOption}
                      onValueChange={setSelectedShipmentOption}
                      className="space-y-3"
                    >
                      {shipmentOptions.map((option) => (
                        <Label
                          key={option.id}
                          htmlFor={`shipment-${option.id}`}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/50",
                            selectedShipmentOption === option.id && "border-primary bg-accent/30"
                          )}
                        >
                          <RadioGroupItem
                            value={option.id}
                            id={`shipment-${option.id}`}
                          />
                          <div className="flex-1">
                            <span className="font-medium">{option.name}</span>
                            {option.description && (
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                            )}
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>

              <Button
                size="lg"
                className="w-full"
                disabled={!canProceedToStep2}
                onClick={() => setCurrentStep(2)}
              >
                Continue to Payment
              </Button>
            </>
          )}

          {/* Step 2: Payment & Review */}
          {currentStep === 2 && (
            <>
              {/* Payment Option Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!paymentOptions || paymentOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payment options available.</p>
                  ) : (
                    <RadioGroup
                      value={selectedPaymentOption}
                      onValueChange={setSelectedPaymentOption}
                      className="space-y-3"
                    >
                      {paymentOptions.map((option) => (
                        <Label
                          key={option.id}
                          htmlFor={`payment-${option.id}`}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/50",
                            selectedPaymentOption === option.id && "border-primary bg-accent/30"
                          )}
                        >
                          <RadioGroupItem
                            value={option.id}
                            id={`payment-${option.id}`}
                          />
                          <div className="flex-1">
                            <span className="font-medium">{option.name}</span>
                            {option.description && (
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                            )}
                          </div>
                        </Label>
                      ))}
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

              {/* Delivery Summary */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Delivery to</h4>
                    {selectedContact && (
                      <div className="text-sm">
                        <p className="font-medium">{selectedContact.full_name}</p>
                        <p>{selectedContact.phone}</p>
                        <p className="text-muted-foreground">{selectedContact.address}</p>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Shipping method</h4>
                    <p className="text-sm">
                      {shipmentOptions?.find((o) => o.id === selectedShipmentOption)?.name ?? "-"}
                    </p>
                  </div>
                  <Button
                    variant="link"
                    className="px-0 h-auto text-sm"
                    onClick={() => setCurrentStep(1)}
                  >
                    Edit shipping details
                  </Button>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" size="lg" onClick={() => setCurrentStep(1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={!canPlaceOrder || checkoutMutation.isPending}
                  onClick={handlePlaceOrder}
                >
                  {checkoutMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>
              </div>
            </>
          )}
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

              {/* Pricing from Quote */}
              {quoteMutation.isPending ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ) : quoteMutation.isError ? (
                <div className="text-sm text-destructive">
                  Failed to calculate pricing. Please try again.
                </div>
              ) : quoteMutation.data ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Products</span>
                    <span>{formatPrice(quoteMutation.data.product_cost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatPrice(quoteMutation.data.ship_cost)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(quoteMutation.data.total)}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Select an address and shipping method to see pricing.
                  </p>
                </div>
              )}
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
      <div className="flex items-center justify-center mb-8 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-16 hidden sm:block" />
            {i < 1 && <Skeleton className="h-0.5 w-12 sm:w-24 mx-4" />}
          </div>
        ))}
      </div>
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
