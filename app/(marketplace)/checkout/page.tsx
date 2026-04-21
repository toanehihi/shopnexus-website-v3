"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/core/account/auth"
import { useGetCart } from "@/core/order/cart"
import { useBuyerCheckout } from "@/core/order/order.buyer"
import { useListContacts, AddressType, type Contact } from "@/core/account/contact"
import { useGetMe } from "@/core/account/account"
import { useListServiceOption } from "@/core/common/option"
import { useListPaymentMethods } from "@/core/account/payment-method"
import { useGetWalletBalance } from "@/core/account/wallet"
import {
  formatPriceInline,
  formatMoney,
  convertMoney,
} from "@/lib/money"
import { useExchangeRates, usePreferredCurrency } from "@/core/common/currency"
import { walletCurrencyForCountry } from "@/lib/countries"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MapPin,
  Loader2,
  ChevronLeft,
  ShoppingBag,
  ExternalLink,
  Truck,
  CreditCard,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

export default function CheckoutPage() {
  const isAuthenticated = useRequireAuth()
  const router = useRouter()
  const { data: cart, isLoading: cartLoading } = useGetCart()

  if (!isAuthenticated) return null
  const { data: contacts, isLoading: contactsLoading } = useListContacts()
  const { data: user } = useGetMe()
  const { data: transportOptions } = useListServiceOption({ category: "transport" })
  const { data: paymentOptions } = useListServiceOption({ category: "payment" })
  const { data: paymentMethods } = useListPaymentMethods()
  const { data: walletData } = useGetWalletBalance()
  const preferred = usePreferredCurrency()
  const { data: rateData } = useExchangeRates()

  const checkoutMutation = useBuyerCheckout()

  const [selectedContactId, setSelectedContactId] = useState<string>("")
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<string>("")
  const [useWallet, setUseWallet] = useState(false)
  const [transportSelections, setTransportSelections] = useState<Record<string, string>>({})

  // Set default contact when data loads
  useEffect(() => {
    if (contacts && contacts.length > 0 && !selectedContactId) {
      const defaultContact = user?.default_contact_id
        ? contacts.find((c) => c.id === user.default_contact_id)
        : null
      setSelectedContactId(defaultContact?.id ?? contacts[0].id)
    }
  }, [contacts, user, selectedContactId])

  // Set default transport option for each cart item
  useEffect(() => {
    if (cart && transportOptions && transportOptions.length > 0) {
      setTransportSelections((prev) => {
        const updated = { ...prev }
        for (const item of cart) {
          if (!updated[item.sku.id]) {
            updated[item.sku.id] = transportOptions[0].id
          }
        }
        return updated
      })
    }
  }, [cart, transportOptions])

  // Set default payment option
  useEffect(() => {
    if (!selectedPaymentOption) {
      if (paymentMethods && paymentMethods.length > 0) {
        const defaultMethod = paymentMethods.find((pm) => pm.is_default)
        if (defaultMethod) {
          setSelectedPaymentOption(`pm:${defaultMethod.id}`)
          return
        }
      }
      if (paymentOptions && paymentOptions.length > 0) {
        setSelectedPaymentOption(paymentOptions[0].id)
      }
    }
  }, [paymentMethods, paymentOptions, selectedPaymentOption])

  const selectedContact = useMemo(
    () => contacts?.find((c) => c.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  )

  const walletBalance = walletData?.balance ?? 0

  const handleCheckout = async () => {
    if (!selectedContact || !cart) return

    try {
      const result = await checkoutMutation.mutateAsync({
        buy_now: false,
        address: selectedContact.address,
        payment_option: selectedPaymentOption,
        use_wallet: useWallet,
        items: cart.map((item) => ({
          sku_id: item.sku.id,
          quantity: item.quantity,
          transport_option: transportSelections[item.sku.id] || "",
          note: undefined,
        })),
      })

      if (result.redirect_url) {
        toast.success("Redirecting to payment gateway...")
        window.location.href = result.redirect_url
      } else {
        toast.success("Checkout successful! Your order has been placed.")
        router.push("/account/orders")
      }
    } catch (error) {
      toast.error("Failed to checkout. Please try again.")
      console.error(error)
    }
  }

  const isLoading = cartLoading || contactsLoading
  const itemCount = cart?.reduce((acc, item) => acc + item.quantity, 0) ?? 0
  const subtotal = cart?.reduce((acc, item) => acc + item.sku.price * item.quantity, 0) ?? 0

  // Estimate shipping cost (simple heuristic: count items with transport selected)
  const estimatedShipping = useMemo(() => {
    if (!cart || !transportOptions) return 0
    // We don't have real shipping cost estimates yet, so show 0 and let the server calculate
    return 0
  }, [cart, transportOptions])

  const walletDeduction = useWallet ? Math.min(walletBalance, subtotal + estimatedShipping) : 0
  const estimatedTotal = subtotal + estimatedShipping - walletDeduction

  // Prices displayed in the buyer's preferred currency, with native in
  // parens per item. Subtotal/total collapse to a single preferred-currency
  // number so the summary stays readable for mixed-currency carts.
  const cartItems = cart ?? []

  // Summary values carry their display currency: we show in `preferred`
  // when every item converts, else fall back to native VND so the buyer
  // isn't shown a silently-wrong total (see money.ts convertMoney null
  // contract).
  type DisplayAmount = { amount: number; currency: string }

  const cartSubtotalDisplay: DisplayAmount = (() => {
    if (!rateData) return { amount: subtotal, currency: "VND" }
    const converted = cartItems.reduce<number | null>((sum, i) => {
      if (sum === null) return null
      const c = convertMoney(
        i.sku.price * i.quantity,
        i.currency,
        preferred,
        rateData.rates,
      )
      return c === null ? null : sum + c
    }, 0)
    return converted !== null
      ? { amount: converted, currency: preferred }
      : { amount: subtotal, currency: "VND" }
  })()

  const walletDisplay: DisplayAmount = (() => {
    if (cartSubtotalDisplay.currency === "VND") {
      return { amount: walletDeduction, currency: "VND" }
    }
    const c =
      rateData && preferred !== "VND"
        ? convertMoney(walletDeduction, "VND", preferred, rateData.rates)
        : walletDeduction
    return c !== null
      ? { amount: c, currency: preferred }
      : { amount: walletDeduction, currency: "VND" }
  })()

  // If summary and wallet diverge on currency (one converted, one didn't),
  // collapse everything to VND native so the math stays consistent.
  const summaryCurrency =
    cartSubtotalDisplay.currency === walletDisplay.currency
      ? cartSubtotalDisplay.currency
      : "VND"
  const cartSubtotalPreferred =
    summaryCurrency === "VND" ? subtotal : cartSubtotalDisplay.amount
  const walletPreferred =
    summaryCurrency === "VND" ? walletDeduction : walletDisplay.amount
  const estimatedTotalPreferred =
    cartSubtotalPreferred + estimatedShipping - walletPreferred

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

  const canCheckout = !!selectedContactId && !!selectedPaymentOption && cart.length > 0

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

          {/* Order Items with Transport Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Items & Shipping ({itemCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => (
                <div key={item.sku.id} className="flex gap-3 pb-4 border-b last:border-b-0 last:pb-0">
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
                    <div className="mt-2">
                      <Select
                        value={transportSelections[item.sku.id] || ""}
                        onValueChange={(value) =>
                          setTransportSelections((prev) => ({ ...prev, [item.sku.id]: value }))
                        }
                      >
                        <SelectTrigger className="w-48 h-8 text-xs">
                          <SelectValue placeholder="Select shipping" />
                        </SelectTrigger>
                        <SelectContent>
                          {transportOptions && transportOptions.length > 0 ? (
                            transportOptions.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id}>
                                {opt.name}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="ghtk_standard">Standard</SelectItem>
                              <SelectItem value="ghtk_express">Express</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <span className="font-medium flex-shrink-0">
                    {formatPriceInline(
                      item.sku.price * item.quantity,
                      item.currency,
                      preferred,
                      rateData?.rates,
                    )}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedPaymentOption}
                onValueChange={setSelectedPaymentOption}
                className="space-y-3"
              >
                {/* Saved Payment Methods */}
                {paymentMethods && paymentMethods.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Saved Cards</p>
                    {paymentMethods.map((pm) => (
                      <Label
                        key={pm.id}
                        htmlFor={`checkout-pm-${pm.id}`}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
                          selectedPaymentOption === `pm:${pm.id}` && "border-primary bg-accent/30"
                        )}
                      >
                        <RadioGroupItem value={`pm:${pm.id}`} id={`checkout-pm-${pm.id}`} />
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <span className="font-medium">
                            {pm.data.brand ?? pm.provider} **** {pm.data.last4}
                          </span>
                          {pm.data.exp_month && pm.data.exp_year && (
                            <p className="text-xs text-muted-foreground">
                              Expires {String(pm.data.exp_month).padStart(2, "0")}/{pm.data.exp_year}
                            </p>
                          )}
                        </div>
                        {pm.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </Label>
                    ))}
                  </div>
                )}

                {/* Service Payment Options (VNPay, SePay, COD, etc.) */}
                {paymentOptions && paymentOptions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Other Payment Methods</p>
                    {paymentOptions.map((option) => (
                      <Label
                        key={option.id}
                        htmlFor={`checkout-so-${option.id}`}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
                          selectedPaymentOption === option.id && "border-primary bg-accent/30"
                        )}
                      >
                        <RadioGroupItem value={option.id} id={`checkout-so-${option.id}`} />
                        <div>
                          <span className="font-medium">{option.name}</span>
                          {option.description && (
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          )}
                        </div>
                      </Label>
                    ))}
                  </div>
                )}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Wallet Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label
                htmlFor="use-wallet"
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/50",
                  useWallet && "border-primary bg-accent/30"
                )}
              >
                <Checkbox
                  id="use-wallet"
                  checked={useWallet}
                  onCheckedChange={(checked) => setUseWallet(checked === true)}
                />
                <div className="flex-1">
                  <span className="font-medium">Use wallet balance</span>
                  <p className="text-sm text-muted-foreground">
                    Available balance:{" "}
                    {formatPriceInline(
                      walletBalance,
                      "VND",
                      preferred,
                      rateData?.rates,
                    )}
                  </p>
                </div>
                {useWallet && walletDeduction > 0 && (
                  <span className="text-sm font-medium text-green-600">
                    −
                    {formatPriceInline(
                      walletDeduction,
                      "VND",
                      preferred,
                      rateData?.rates,
                    )}
                  </span>
                )}
              </Label>
            </CardContent>
          </Card>

          {/* Checkout Button (mobile) */}
          <div className="lg:hidden space-y-2">
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
                `Pay ${formatMoney(estimatedTotalPreferred, summaryCurrency)}`
              )}
            </Button>
          </div>
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
                    <span className="text-sm font-medium">
                      {formatPriceInline(
                        item.sku.price * item.quantity,
                        item.currency,
                        preferred,
                        rateData?.rates,
                      )}
                    </span>
                  </div>
                ))}
                {cart.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{cart.length - 3} more items
                  </p>
                )}
              </div>

              <Separator />

              {/* Pricing — all figures in the buyer's preferred currency. */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Products ({itemCount} items)
                  </span>
                  <span>{formatMoney(cartSubtotalPreferred, summaryCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated shipping</span>
                  <span>
                    {estimatedShipping > 0
                      ? formatMoney(estimatedShipping, preferred)
                      : "Calculated at confirmation"}
                  </span>
                </div>
                {useWallet && walletDeduction > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Wallet deduction</span>
                    <span>−{formatMoney(walletPreferred, summaryCurrency)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Estimated Total</span>
                  <span>{formatMoney(estimatedTotalPreferred, summaryCurrency)}</span>
                </div>
                {(() => {
                  const buyerCurrency = walletCurrencyForCountry(user?.country)
                  if (!buyerCurrency || !rateData) return null
                  // Show the preview only when every item shares a single
                  // seller currency AND it differs from the buyer's wallet.
                  const sellerCurrencies = Array.from(
                    new Set(cart.map((i) => i.currency)),
                  )
                  if (sellerCurrencies.length !== 1) return null
                  const sellerCurrency = sellerCurrencies[0]
                  if (sellerCurrency === buyerCurrency) return null
                  const totalBuyer = convertMoney(
                    subtotal,
                    sellerCurrency,
                    buyerCurrency,
                    rateData.rates,
                  )
                  if (totalBuyer === null) return null
                  const rateFrom =
                    sellerCurrency === "USD"
                      ? 1
                      : rateData.rates[sellerCurrency]
                  const rateTo =
                    buyerCurrency === "USD" ? 1 : rateData.rates[buyerCurrency]
                  if (!rateFrom || !rateTo) return null
                  const rate = rateTo / rateFrom
                  return (
                    <div className="text-xs text-muted-foreground pt-1">
                      Charged as approximately{" "}
                      {formatMoney(totalBuyer, buyerCurrency)} (≈{" "}
                      {formatMoney(subtotal, sellerCurrency)} at 1{" "}
                      {sellerCurrency} = {rate.toFixed(4)} {buyerCurrency}).
                      <span className="block">
                        Final rate locked at checkout confirmation.
                      </span>
                    </div>
                  )
                })()}
              </div>

              {/* Checkout Button (desktop) */}
              <Button
                size="lg"
                className="w-full hidden lg:flex"
                disabled={!canCheckout || checkoutMutation.isPending}
                onClick={handleCheckout}
              >
                {checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${formatMoney(estimatedTotalPreferred, summaryCurrency)}`
                )}
              </Button>
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
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
