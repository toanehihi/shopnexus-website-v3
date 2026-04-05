"use client"

import Link from "next/link"
import { useGetProductDetail } from "@/core/catalog/product.customer"
import { cn } from "@/lib/utils"

export function ProductLink({
  spuId,
  children,
  className,
  onClick,
  hash,
}: {
  spuId: string
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
  hash?: string
}) {
  const { data } = useGetProductDetail({ id: spuId })
  const base = data?.slug ? `/product/${data.slug}` : `/product/${spuId}`
  const href = hash ? `${base}#${hash}` : base

  return (
    <Link
      href={href}
      className={cn("block font-medium truncate text-primary hover:underline", className)}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}
