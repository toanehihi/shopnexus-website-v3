"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useListCategories } from "@/core/catalog/category"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight } from "lucide-react"

export default function CategoriesPage() {
  const { data: categoriesData, isLoading } = useListCategories({ limit: 50 })

  const categories = useMemo(() => {
    return categoriesData?.pages.flatMap(page => page.data) ?? []
  }, [categoriesData])

  // Group categories by parent
  const { rootCategories, childrenMap } = useMemo(() => {
    const childrenMap = new Map<string, typeof categories>()
    const rootCategories: typeof categories = []

    categories.forEach((category) => {
      if (!category.parent_id) {
        rootCategories.push(category)
      } else {
        const children = childrenMap.get(category.parent_id) ?? []
        children.push(category)
        childrenMap.set(category.parent_id, children)
      }
    })

    return { rootCategories, childrenMap }
  }, [categories])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Categories</span>
      </nav>

      <h1 className="text-3xl font-bold mb-8">Shop by Category</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="grid grid-cols-4 gap-1.5 mb-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="aspect-square rounded-md" />
                  ))}
                </div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rootCategories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No categories found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rootCategories.map((category) => {
            const children = childrenMap.get(category.id) ?? []
            const resources = category.resources ?? []
            return (
              <Card key={category.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                <Link href={`/categories/${category.id}`}>
                  {resources.length > 0 ? (
                    <div className="grid grid-cols-4 gap-1 p-2 pb-0">
                      {resources.slice(0, 4).map((resource) => (
                        <div key={resource.id} className="aspect-square relative rounded-md overflow-hidden bg-muted">
                          <Image
                            src={resource.url}
                            alt=""
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 25vw, 10vw"
                          />
                        </div>
                      ))}
                      {/* Fill empty slots */}
                      {Array.from({ length: Math.max(0, 4 - resources.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square rounded-md bg-muted/50" />
                      ))}
                    </div>
                  ) : (
                    <div className="h-24 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary/30">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </Link>
                <CardContent className="p-4">
                  <Link
                    href={`/categories/${category.id}`}
                    className="flex items-center justify-between mb-2"
                  >
                    <div>
                      <h2 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>

                  {children.length > 0 && (
                    <div className="border-t pt-3 space-y-1.5">
                      {children.slice(0, 5).map((child) => (
                        <Link
                          key={child.id}
                          href={`/categories/${child.id}`}
                          className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                      {children.length > 5 && (
                        <Link
                          href={`/categories/${category.id}`}
                          className="block text-sm text-primary font-medium"
                        >
                          +{children.length - 5} more
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
