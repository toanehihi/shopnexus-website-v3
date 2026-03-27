"use client"

import { useState, useRef } from "react"
import dynamic from "next/dynamic"
import { useGetMe, useUpdateMe } from "@/core/account/account"
import type { RichTextEditorRef } from "@/components/ui/rich-text-editor"

// Dynamic import to avoid SSR issues with Quill
const RichTextEditor = dynamic(
	() =>
		import("@/components/ui/rich-text-editor").then(
			(mod) => mod.RichTextEditor
		),
	{
		ssr: false,
		loading: () => (
			<div className="h-[200px] rounded-md border border-input bg-muted/50 animate-pulse" />
		),
	}
)
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Store,
	Bell,
	CreditCard,
	Truck,
	Shield,
	Save,
	Loader2,
} from "lucide-react"

export default function SellerSettingsPage() {
	const { data: user, isLoading } = useGetMe()
	const updateMe = useUpdateMe()
	const storeDescriptionRef = useRef<RichTextEditorRef>(null)

	const [storeSettings, setStoreSettings] = useState({
		storeName: "",
		storeDescription: "",
		contactEmail: "",
		contactPhone: "",
	})

	const [notifications, setNotifications] = useState({
		newOrders: true,
		orderUpdates: true,
		refundRequests: true,
		lowStock: true,
		promotionalEmails: false,
	})

	const [shippingSettings, setShippingSettings] = useState({
		processingTime: "1-2",
		freeShippingThreshold: "50",
		returnWindow: "30",
	})

	const handleSaveStore = async () => {
		// Simulate save
		await new Promise((resolve) => setTimeout(resolve, 1000))
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-64" />
				<Card>
					<CardContent className="p-6 space-y-4">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-20 w-full" />
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Store Settings</h1>
				<p className="text-muted-foreground">
					Manage your store preferences and configurations
				</p>
			</div>

			{/* Store Profile */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Store className="h-5 w-5" />
						Store Profile
					</CardTitle>
					<CardDescription>Basic information about your store</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="storeName">Store Name</Label>
							<Input
								id="storeName"
								placeholder="My Awesome Store"
								value={storeSettings.storeName || user?.name || ""}
								onChange={(e) =>
									setStoreSettings({
										...storeSettings,
										storeName: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="contactEmail">Contact Email</Label>
							<Input
								id="contactEmail"
								type="email"
								placeholder="store@example.com"
								value={storeSettings.contactEmail || user?.email || ""}
								onChange={(e) =>
									setStoreSettings({
										...storeSettings,
										contactEmail: e.target.value,
									})
								}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="storeDescription">Store Description</Label>
						<RichTextEditor
							ref={storeDescriptionRef}
							defaultValue={storeSettings.storeDescription}
							onChange={(html) =>
								setStoreSettings({ ...storeSettings, storeDescription: html })
							}
							placeholder="Tell customers about your store, your products, and what makes you unique..."
							toolbarOptions="standard"
							className="min-h-[200px] border-none"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="contactPhone">Contact Phone</Label>
						<Input
							id="contactPhone"
							placeholder="+1 (555) 123-4567"
							value={storeSettings.contactPhone || user?.phone || ""}
							onChange={(e) =>
								setStoreSettings({
									...storeSettings,
									contactPhone: e.target.value,
								})
							}
						/>
					</div>

					<Button onClick={handleSaveStore}>
						<Save className="h-4 w-4 mr-2" />
						Save Changes
					</Button>
				</CardContent>
			</Card>

			{/* Notifications */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Bell className="h-5 w-5" />
						Notifications
					</CardTitle>
					<CardDescription>
						Choose what notifications you want to receive
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">New Orders</p>
							<p className="text-sm text-muted-foreground">
								Get notified when you receive a new order
							</p>
						</div>
						<Switch
							checked={notifications.newOrders}
							onCheckedChange={(checked) =>
								setNotifications({ ...notifications, newOrders: checked })
							}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Order Updates</p>
							<p className="text-sm text-muted-foreground">
								Notifications about order status changes
							</p>
						</div>
						<Switch
							checked={notifications.orderUpdates}
							onCheckedChange={(checked) =>
								setNotifications({ ...notifications, orderUpdates: checked })
							}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Refund Requests</p>
							<p className="text-sm text-muted-foreground">
								Get notified when customers request refunds
							</p>
						</div>
						<Switch
							checked={notifications.refundRequests}
							onCheckedChange={(checked) =>
								setNotifications({ ...notifications, refundRequests: checked })
							}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Low Stock Alerts</p>
							<p className="text-sm text-muted-foreground">
								Get notified when products are running low
							</p>
						</div>
						<Switch
							checked={notifications.lowStock}
							onCheckedChange={(checked) =>
								setNotifications({ ...notifications, lowStock: checked })
							}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Promotional Emails</p>
							<p className="text-sm text-muted-foreground">
								Tips, updates, and promotional content
							</p>
						</div>
						<Switch
							checked={notifications.promotionalEmails}
							onCheckedChange={(checked) =>
								setNotifications({
									...notifications,
									promotionalEmails: checked,
								})
							}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Shipping Settings */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Truck className="h-5 w-5" />
						Shipping & Returns
					</CardTitle>
					<CardDescription>
						Configure your shipping and return policies
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid sm:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="processingTime">Processing Time (days)</Label>
							<Input
								id="processingTime"
								placeholder="1-2"
								value={shippingSettings.processingTime}
								onChange={(e) =>
									setShippingSettings({
										...shippingSettings,
										processingTime: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="freeShipping">Free Shipping Threshold ($)</Label>
							<Input
								id="freeShipping"
								type="number"
								placeholder="50"
								value={shippingSettings.freeShippingThreshold}
								onChange={(e) =>
									setShippingSettings({
										...shippingSettings,
										freeShippingThreshold: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="returnWindow">Return Window (days)</Label>
							<Input
								id="returnWindow"
								type="number"
								placeholder="30"
								value={shippingSettings.returnWindow}
								onChange={(e) =>
									setShippingSettings({
										...shippingSettings,
										returnWindow: e.target.value,
									})
								}
							/>
						</div>
					</div>

					<Button variant="outline">
						<Save className="h-4 w-4 mr-2" />
						Save Shipping Settings
					</Button>
				</CardContent>
			</Card>

			{/* Payment Settings */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="h-5 w-5" />
						Payment Settings
					</CardTitle>
					<CardDescription>
						Manage your payout methods and preferences
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
						<div>
							<p className="font-medium">Payout Account</p>
							<p className="text-sm text-muted-foreground">
								Bank account ending in ****1234
							</p>
						</div>
						<Button variant="outline" size="sm">
							Update
						</Button>
					</div>
					<p className="text-sm text-muted-foreground mt-4">
						Payouts are processed weekly on Fridays. Minimum payout amount is
						$50.
					</p>
				</CardContent>
			</Card>

			{/* Security */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						Security
					</CardTitle>
					<CardDescription>
						Manage your account security settings
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Two-Factor Authentication</p>
							<p className="text-sm text-muted-foreground">
								Add an extra layer of security to your account
							</p>
						</div>
						<Button variant="outline" size="sm" disabled>
							Coming Soon
						</Button>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Change Password</p>
							<p className="text-sm text-muted-foreground">
								Update your account password
							</p>
						</div>
						<Button variant="outline" size="sm">
							Change
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
