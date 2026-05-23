"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useGetMe } from "@/core/account/account"
import { useRequireAuth, useSignOut } from "@/core/account/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  User,
  Package,
  ShoppingCart,
  RotateCcw,
  Scale,
  Tag,
  BarChart3,
  MessageCircle,
  Settings,
  LogOut,
  Store,
} from "lucide-react"

const personalLinks = [
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/chat", label: "Chat", icon: MessageCircle },
  { href: "/seller/settings", label: "Settings", icon: Settings },
]

const sellerLinks = [
  { href: "/seller", label: "Dashboard", icon: BarChart3 },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/orders", label: "Orders", icon: ShoppingCart },
  { href: "/seller/refunds", label: "Refunds", icon: RotateCcw },
  { href: "/seller/disputes", label: "Disputes", icon: Scale },
  { href: "/seller/promotions", label: "Promotions", icon: Tag },
]

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthenticated = useRequireAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { data: user, isLoading } = useGetMe()
  const signOut = useSignOut()

  if (!isAuthenticated) return null

  const handleSignOut = async () => {
    await signOut.mutateAsync()
    router.push("/")
  }

  const isLinkActive = (href: string) => {
    if (href === "/seller") return pathname === href
    return pathname.startsWith(href)
  }

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
      isLinkActive(href)
        ? "bg-primary text-primary-foreground"
        : "hover:bg-muted text-muted-foreground hover:text-foreground"
    )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          {/* Store Info */}
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
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Store className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {user?.name || "My Store"}
                    </p>
                    <Badge variant="secondary" className="text-xs">Seller</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {user?.email || user?.phone}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {personalLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}

            <Separator className="!my-3" />

            {sellerLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}

            <Separator className="!my-3" />

            <Link
              href="/account"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Switch to Buyer
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

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
