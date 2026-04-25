"use client"

import Link from "next/link"
import { Search, ShoppingCart, User, Menu, Heart, Store, LogOut, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useGetCart } from "@/core/order/cart"
import { useGetMe } from "@/core/account/account"
import { useSignOut } from "@/core/account/auth"
import { useUnreadCount } from "@/core/account/notification"
import { CartSheet } from "@/components/cart/cart-sheet"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function HeaderSearchForm() {
	const searchParams = useSearchParams()
	const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "")
	const router = useRouter()

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		const q = searchQuery.trim()
		router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search")
	}

	return (
		<form
			onSubmit={handleSearch}
			className="hidden md:flex flex-1 max-w-md mx-4"
		>
			<div className="relative w-full">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search products..."
					className="pl-10 w-full"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>
		</form>
	)
}

export function Header() {
	const { data: cart } = useGetCart()
	const { data: user, isLoading: isLoadingUser } = useGetMe()
	const signOut = useSignOut()
	const [isCartOpen, setIsCartOpen] = useState(false)
	const router = useRouter()

	const { data: unreadData } = useUnreadCount()
	const isLoggedIn = !!user
	const cartItemCount = cart?.reduce((acc, item) => acc + item.quantity, 0) ?? 0

	const handleSignOut = async () => {
		await signOut.mutateAsync()
		router.push("/")
	}

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between gap-4">
					{/* Mobile Menu */}
					<Sheet>
						<SheetTrigger asChild className="lg:hidden">
							<Button variant="ghost" size="icon">
								<Menu className="h-5 w-5" />
								<span className="sr-only">Toggle menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-[300px]">
							<nav className="flex flex-col gap-4 mt-8">
								<Link
									href="/"
									className="text-lg font-medium hover:text-primary"
								>
									Home
								</Link>
								<Link
									href="/categories"
									className="text-lg font-medium hover:text-primary"
								>
									Categories
								</Link>
								<Link
									href="/deals"
									className="text-lg font-medium hover:text-primary"
								>
									Deals
								</Link>
								<Link
									href="/new-arrivals"
									className="text-lg font-medium hover:text-primary"
								>
									New Arrivals
								</Link>
							</nav>
						</SheetContent>
					</Sheet>

					{/* Logo */}
					<Link href="/" className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
							S
						</div>
						<span className="hidden font-bold text-xl sm:inline-block">
							ShopNexus
						</span>
					</Link>

					{/* Desktop Navigation */}
					<nav className="hidden lg:flex items-center gap-6">
						<Link
							href="/"
							className="text-sm font-medium hover:text-primary transition-colors"
						>
							Home
						</Link>
						<Link
							href="/categories"
							className="text-sm font-medium hover:text-primary transition-colors"
						>
							Categories
						</Link>
						<Link
							href="/deals"
							className="text-sm font-medium hover:text-primary transition-colors"
						>
							Deals
						</Link>
						<Link
							href="/new-arrivals"
							className="text-sm font-medium hover:text-primary transition-colors"
						>
							New Arrivals
						</Link>
					</nav>

					{/* Search Bar */}
					<Suspense fallback={<div className="h-10 flex-1 max-w-md" />}>
						<HeaderSearchForm />
					</Suspense>

					{/* Actions */}
					<div className="flex items-center gap-2">
						{/* Mobile Search */}
						<Button variant="ghost" size="icon" className="md:hidden">
							<Search className="h-5 w-5" />
							<span className="sr-only">Search</span>
						</Button>

						{/* Wishlist */}
						<Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
							<Link href="/account/wishlist">
								<Heart className="h-5 w-5" />
								<span className="sr-only">Wishlist</span>
							</Link>
						</Button>

						{/* Notifications */}
						{isLoggedIn && (
							<Button variant="ghost" size="icon" className="relative hidden sm:flex" asChild>
								<Link href="/account/notifications">
									<Bell className="h-5 w-5" />
									{(unreadData?.count ?? 0) > 0 && (
										<Badge
											variant="destructive"
											className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
										>
											{(unreadData?.count ?? 0) > 99 ? "99+" : unreadData?.count}
										</Badge>
									)}
									<span className="sr-only">Notifications</span>
								</Link>
							</Button>
						)}

						{/* Theme Toggle */}
						<ThemeToggle />

						{/* Cart */}
						<Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
							<SheetTrigger asChild>
								<Button variant="ghost" size="icon" className="relative">
									<ShoppingCart className="h-5 w-5" />
									{cartItemCount > 0 && (
										<Badge
											variant="destructive"
											className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
										>
											{cartItemCount > 99 ? "99+" : cartItemCount}
										</Badge>
									)}
									<span className="sr-only">Cart</span>
								</Button>
							</SheetTrigger>
							<CartSheet onClose={() => setIsCartOpen(false)} />
						</Sheet>

						{/* User Menu */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="relative">
									{isLoggedIn ? (
										<Avatar className="h-7 w-7">
											<AvatarImage src={user?.avatar_url ?? undefined} />
											<AvatarFallback className="text-xs">
												{user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
											</AvatarFallback>
										</Avatar>
									) : (
										<User className="h-5 w-5" />
									)}
									<span className="sr-only">Account</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								{isLoggedIn ? (
									<>
										<div className="px-2 py-1.5">
											<p className="text-sm font-medium">{user?.name || user?.username}</p>
											<p className="text-xs text-muted-foreground">{user?.email}</p>
										</div>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild>
											<Link href="/account">
												<User className="h-4 w-4 mr-2" />
												My Account
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<Link href="/account/wishlist">
												<Heart className="h-4 w-4 mr-2" />
												Wishlist
											</Link>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild>
											<Link href="/seller" className="text-primary">
												<Store className="h-4 w-4 mr-2" />
												Seller Dashboard
											</Link>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={handleSignOut}
											disabled={signOut.isPending}
											className="text-destructive"
										>
											<LogOut className="h-4 w-4 mr-2" />
											Sign Out
										</DropdownMenuItem>
									</>
								) : (
									<>
										<DropdownMenuItem asChild>
											<Link href="/login">Sign In</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<Link href="/register">Create Account</Link>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild>
											<Link href="/account/wishlist">Wishlist</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<Link href="/account/settings">Settings</Link>
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</header>
	)
}
