"use client"

import { memo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useGetMe } from "@/core/account/account"
import { useRequireAuth, useSignOut } from "@/core/account/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
	User,
	Package,
	RotateCcw,
	Scale,
	Heart,
	MapPin,
	CreditCard,
	MessageCircle,
	Bell,
	Settings,
	LogOut,
	Store,
} from "lucide-react"

const personalLinks = [
	{ href: "/account/profile", label: "Profile", icon: User },
	{ href: "/account/chat", label: "Chat", icon: MessageCircle },
	{ href: "/account/settings", label: "Settings", icon: Settings },
]

const buyerLinks = [
	{ href: "/account/orders", label: "Orders", icon: Package },
	{ href: "/account/refunds", label: "Refunds", icon: RotateCcw },
	{ href: "/account/disputes", label: "Disputes", icon: Scale },
	{ href: "/account/wishlist", label: "Wishlist", icon: Heart },
	{ href: "/account/addresses", label: "Addresses", icon: MapPin },
	{ href: "/account/payment", label: "Payment Methods", icon: CreditCard },
	{ href: "/account/notifications", label: "Notifications", icon: Bell },
]

export default function AccountLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const isAuthenticated = useRequireAuth()
	if (!isAuthenticated) return null

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col lg:flex-row gap-8">
				<AccountSidebar />
				<div className="flex-1 min-w-0">{children}</div>
			</div>
		</div>
	)
}

const AccountSidebar = memo(function AccountSidebar() {
	const pathname = usePathname()
	const router = useRouter()
	const { data: user, isLoading } = useGetMe()
	const signOut = useSignOut()

	const handleSignOut = async () => {
		await signOut.mutateAsync()
		router.push("/")
	}

	const linkClass = (href: string) =>
		cn(
			"flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
			pathname.startsWith(href)
				? "bg-primary text-primary-foreground"
				: "hover:bg-muted text-muted-foreground hover:text-foreground",
		)

	return (
		<aside className="w-full lg:w-64 flex-shrink-0">
			<div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg mb-4">
				{isLoading ? (
					<>
						<Skeleton className="h-12 w-12 rounded-full" />
						<div className="space-y-1">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-3 w-32" />
						</div>
					</>
				) : (
					<>
						<Avatar className="h-12 w-12">
							<AvatarImage src={user?.avatar_url ?? undefined} />
							<AvatarFallback>
								{user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<p className="font-medium truncate">
								{user?.name || user?.username || "User"}
							</p>
							<p className="text-sm text-muted-foreground truncate">
								{user?.email || user?.phone}
							</p>
						</div>
					</>
				)}
			</div>

			<nav className="space-y-1">
				{personalLinks.map(({ href, label, icon: Icon }) => (
					<Link key={href} href={href} className={linkClass(href)}>
						<Icon className="h-4 w-4" />
						{label}
					</Link>
				))}

				<Separator className="!my-3" />

				{buyerLinks.map(({ href, label, icon: Icon }) => (
					<Link key={href} href={href} className={linkClass(href)}>
						<Icon className="h-4 w-4" />
						{label}
					</Link>
				))}

				<Separator className="!my-3" />

				<Link
					href="/seller"
					className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
				>
					<Store className="h-4 w-4" />
					Switch to Seller
				</Link>

				<Button
					variant="ghost"
					className="w-full justify-start gap-3 px-4 py-2.5 h-auto text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
					onClick={handleSignOut}
					disabled={signOut.isPending}
				>
					<LogOut className="h-4 w-4" />
					Sign Out
				</Button>
			</nav>
		</aside>
	)
})
