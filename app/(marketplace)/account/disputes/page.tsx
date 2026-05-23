"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useListRefundDisputes } from "@/core/order/dispute"
import { DisputeCard } from "./_components/dispute-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Scale, Loader2 } from "lucide-react"

export default function DisputesPage() {
  const {
    data: disputesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListRefundDisputes({ limit: 10 })

  const disputes = useMemo(() => {
    return disputesData?.pages.flatMap((page) => page.data) ?? []
  }, [disputesData])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Disputes</h1>
        <p className="text-muted-foreground">
          Track disputes you&apos;ve raised on rejected refunds
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Separator className="my-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-28" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Scale className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No disputes</h3>
          <p className="text-muted-foreground mb-4">
            You haven&apos;t opened any disputes yet. Disputes can be filed when a refund request is rejected.
          </p>
          <Button asChild>
            <Link href="/account/refunds">View Refunds</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <DisputeCard key={dispute.id} dispute={dispute} />
          ))}

          {hasNextPage && (
            <div className="flex justify-center pt-4">
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
