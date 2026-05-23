"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useListRefundDisputes, TRefundDispute } from "@/core/order/dispute"
import { Status } from "@/core/common/status.type"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Scale,
  Search,
  MoreVertical,
  Eye,
  Clock,
  Loader,
  CheckCircle,
  XCircle,
  Ban,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  [Status.Pending]: { label: "Under Review", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  [Status.Processing]: { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: Loader },
  [Status.Success]: { label: "Resolved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  [Status.Failed]: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
  [Status.Canceled]: { label: "Cancelled", color: "bg-gray-100 text-gray-800", icon: Ban },
}

export default function SellerDisputesPage() {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useListRefundDisputes({
    limit: 20,
  })

  const disputes = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  )

  const filteredDisputes = useMemo(() => {
    let result = disputes

    // Filter by status tab
    if (activeTab !== "all") {
      result = result.filter((d) => d.status === activeTab)
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.refund_id.toLowerCase().includes(q) ||
          d.reason.toLowerCase().includes(q)
      )
    }

    return result
  }, [disputes, activeTab, search])

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Disputes</h1>
        <p className="text-muted-foreground">Review and respond to refund disputes</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Disputes</TabsTrigger>
          <TabsTrigger value={Status.Pending}>Under Review</TabsTrigger>
          <TabsTrigger value={Status.Processing}>In Progress</TabsTrigger>
          <TabsTrigger value={Status.Success}>Resolved</TabsTrigger>
          <TabsTrigger value={Status.Failed}>Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by dispute ID, refund ID, or reason..."
          className="pl-10 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Disputes List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDisputes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No disputes found</h3>
            <p className="text-muted-foreground">
              {search ? "Try a different search term" : "Disputes raised against your refund decisions will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDisputes.map((dispute) => {
            const config = statusConfig[dispute.status] ?? statusConfig[Status.Pending]
            const StatusIcon = config.icon

            return (
              <Card key={dispute.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Scale className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <h3 className="font-medium">Dispute</h3>
                        <Badge variant="secondary" className={cn("gap-1", config.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>

                      {/* IDs and Date */}
                      <p className="text-sm text-muted-foreground">
                        #{dispute.id.slice(0, 8)} &middot; Refund #{dispute.refund_id.slice(0, 8)} &middot; {formatDate(dispute.date_created)}
                      </p>

                      {/* Reason */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</p>
                        <p className="text-sm">{dispute.reason}</p>
                      </div>

                      {/* Note */}
                      {dispute.note && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Supporting Details</p>
                          <p className="text-sm text-muted-foreground line-clamp-3">{dispute.note}</p>
                        </div>
                      )}

                      {/* Resolved Info */}
                      {dispute.date_resolved && (
                        <p className="text-xs text-muted-foreground">
                          Resolved on {formatDate(dispute.date_resolved)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/seller/refunds`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Refund
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Load More */}
          {hasNextPage && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
