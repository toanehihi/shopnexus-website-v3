"use client"

import { useMemo } from "react"
import { useListRefunds } from "@/core/order/refund.buyer"
import { RefundList } from "./_components/refund-list"

export default function RefundsPage() {
  const {
    data: refundsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListRefunds({ limit: 20 })

  const refunds = useMemo(() => {
    return refundsData?.pages.flatMap((page) => page.data) ?? []
  }, [refundsData])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Refunds</h1>
        <p className="text-muted-foreground">
          Track and manage your refund requests
        </p>
      </div>

      <RefundList
        refunds={refunds}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
      />
    </div>
  )
}
