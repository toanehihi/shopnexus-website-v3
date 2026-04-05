"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DollarSign,
  ShoppingCart,
  Package,
  Star,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CalendarIcon,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { format, subDays, subMonths, startOfMonth, startOfYear } from "date-fns"
import {
  useSellerDashboard,
  type UseSellerDashboardParams,
} from "@/core/analytic/dashboard"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"

// ===== Date Range Presets =====

type DatePreset = {
  label: string
  getRange: () => { start: Date; end: Date }
}

const DATE_PRESETS: DatePreset[] = [
  {
    label: "Last 7 days",
    getRange: () => ({ start: subDays(new Date(), 7), end: new Date() }),
  },
  {
    label: "Last 30 days",
    getRange: () => ({ start: subDays(new Date(), 30), end: new Date() }),
  },
  {
    label: "This month",
    getRange: () => ({ start: startOfMonth(new Date()), end: new Date() }),
  },
  {
    label: "Last 3 months",
    getRange: () => ({ start: subMonths(new Date(), 3), end: new Date() }),
  },
  {
    label: "This year",
    getRange: () => ({ start: startOfYear(new Date()), end: new Date() }),
  },
]

const GRANULARITY_OPTIONS = ["day", "week", "month"] as const

function inferGranularity(start: Date, end: Date): "day" | "week" | "month" {
  const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  if (days <= 31) return "day"
  if (days <= 180) return "week"
  return "month"
}

// ===== Components =====

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  format: formatFn,
}: {
  title: string
  value: number
  change: number | null
  icon: React.ElementType
  format?: (v: number) => string
}) {
  const displayValue = formatFn ? formatFn(value) : value.toLocaleString()
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue}</div>
        {change !== null ? (
          <div className="flex items-center text-xs">
            {change >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={change >= 0 ? "text-green-500" : "text-red-500"}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
            <span className="text-muted-foreground ml-1">vs prev period</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">N/A</div>
        )}
      </CardContent>
    </Card>
  )
}

function DashboardChart({
  title,
  data,
  granularity,
  onGranularityChange,
  formatValue,
  allowedGranularities,
}: {
  title: string
  data: { date: string; value: number }[]
  granularity: string
  onGranularityChange: (g: "day" | "week" | "month") => void
  formatValue?: (v: number) => string
  allowedGranularities: readonly ("day" | "week" | "month")[]
}) {
  const chartData = data.map((d) => ({
    date: format(new Date(d.date), granularity === "month" ? "MMM yyyy" : "MMM d"),
    value: d.value,
  }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-1">
          {GRANULARITY_OPTIONS.map((g) => (
            <Button
              key={g}
              variant={granularity === g ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => onGranularityChange(g)}
              disabled={!allowedGranularities.includes(g)}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis className="text-xs" tick={{ fontSize: 12 }} tickFormatter={formatValue} />
              <Tooltip
                formatter={(value) =>
                  formatValue ? [formatValue(Number(value)), title] : [Number(value).toLocaleString(), title]
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ===== Page =====

export default function SellerDashboardPage() {
  const [activePreset, setActivePreset] = useState(1) // "Last 30 days"
  const [customRange, setCustomRange] = useState<{
    start: string
    end: string
  } | null>(null)
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day")

  const dateRange = useMemo(() => {
    if (customRange) {
      return { start: new Date(customRange.start), end: new Date(customRange.end) }
    }
    return DATE_PRESETS[activePreset].getRange()
  }, [activePreset, customRange])

  const allowedGranularities = useMemo(() => {
    const days = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    if (days <= 31) return ["day", "week", "month"] as const
    if (days <= 180) return ["week", "month"] as const
    return ["week", "month"] as const
  }, [dateRange])

  const params: UseSellerDashboardParams = useMemo(() => ({
    start: dateRange.start.toISOString(),
    end: dateRange.end.toISOString(),
    granularity,
  }), [dateRange, granularity])

  const { data, isLoading } = useSellerDashboard(params)

  const handlePresetSelect = (index: number) => {
    setActivePreset(index)
    setCustomRange(null)
    const range = DATE_PRESETS[index].getRange()
    setGranularity(inferGranularity(range.start, range.end))
  }

  const handleCustomRange = (start: string, end: string) => {
    setCustomRange({ start, end })
    setGranularity(inferGranularity(new Date(start), new Date(end)))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your store performance</p>
        </div>
        <DashboardSkeleton />
      </div>
    )
  }

  const summary = data?.summary
  const charts = data?.charts
  const topProducts = data?.top_products ?? []

  return (
    <div className="space-y-6">
      {/* Header with Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your store performance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {DATE_PRESETS.map((preset, i) => (
            <Button
              key={preset.label}
              variant={activePreset === i && !customRange ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetSelect(i)}
            >
              {preset.label}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={customRange ? "default" : "outline"} size="sm">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Custom
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Start</label>
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm"
                  defaultValue={customRange?.start?.slice(0, 10) ?? ""}
                  onChange={(e) => {
                    const end = customRange?.end ?? new Date().toISOString()
                    handleCustomRange(new Date(e.target.value).toISOString(), end)
                  }}
                />
                <label className="text-sm font-medium">End</label>
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm"
                  defaultValue={customRange?.end?.slice(0, 10) ?? ""}
                  onChange={(e) => {
                    const start = customRange?.start ?? subDays(new Date(), 30).toISOString()
                    handleCustomRange(start, new Date(e.target.value).toISOString())
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Revenue"
          value={summary?.total_revenue ?? 0}
          change={summary?.comparison.revenue_change ?? null}
          icon={DollarSign}
          format={formatPrice}
        />
        <StatCard
          title="Total Orders"
          value={summary?.total_orders ?? 0}
          change={summary?.comparison.orders_change ?? null}
          icon={ShoppingCart}
        />
        <StatCard
          title="Items Sold"
          value={summary?.items_sold ?? 0}
          change={summary?.comparison.items_sold_change ?? null}
          icon={Package}
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.average_rating?.toFixed(1) ?? "0.0"}
            </div>
            <div className="text-xs text-muted-foreground">across all products</div>
          </CardContent>
        </Card>
        {(summary?.pending_actions ?? 0) > 0 && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Pending Actions
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {summary?.pending_actions ?? 0}
              </div>
              <div className="flex gap-2 text-xs">
                <Link
                  href="/seller/orders"
                  className="text-amber-600 underline hover:text-amber-800"
                >
                  Incoming items
                </Link>
                <Link
                  href="/seller/refunds"
                  className="text-amber-600 underline hover:text-amber-800"
                >
                  Refunds
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardChart
          title="Revenue"
          data={charts?.revenue ?? []}
          granularity={granularity}
          onGranularityChange={setGranularity}
          formatValue={formatPrice}
          allowedGranularities={allowedGranularities}
        />
        <DashboardChart
          title="Orders"
          data={charts?.orders ?? []}
          granularity={granularity}
          onGranularityChange={setGranularity}
          allowedGranularities={allowedGranularities}
        />
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No product sales in this period
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.sku_id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{product.sku_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sold_count} sold
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">{formatPrice(product.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
