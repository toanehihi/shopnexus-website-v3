import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { getQueryClient } from "@/lib/queryclient/query-client"
import { useMutation, useQuery } from "@tanstack/react-query"
import qs from "qs"

// ===== Types =====

// Mirrors backend commonbiz.OptionListItem. The list endpoint hides owner_id
// and exposes ownership via `owned` (true when the row's OwnerID matches the
// authenticated caller). Anonymous callers always get owned=false.
export type Option = {
  id: string
  type: OptionType
  provider: string
  is_enabled: boolean
  name: string
  description: string
  priority: number
  logo_rs_id: string | null
  data: Record<string, unknown>
  owned: boolean
}

// Wire shape accepted by UpsertOptions. Mirrors sharedmodel.Option — owner_id
// is set server-side from auth claims, so callers never populate it directly.
export type OptionInput = {
  id: string
  type: OptionType
  provider: string
  is_enabled: boolean
  name: string
  description: string
  priority: number
  logo_rs_id: string | null
  data: Record<string, unknown>
}

export type OptionType = "payment" | "transport" | "object_store"

// ===== Hooks =====

export const useListOption = (params: { type: string }) =>
  useQuery({
    queryKey: ["common", "option", "list", params],
    queryFn: () =>
      customFetchStandard<Option[]>(`common/option?${qs.stringify(params)}`),
  })

export const useUpsertOptions = () =>
  useMutation({
    mutationFn: async (params: { type: string; configs: OptionInput[] }) =>
      customFetchStandard<{ message: string }>("common/option", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      const qc = getQueryClient()
      await qc.invalidateQueries({ queryKey: ["common", "option"] })
    },
  })

export const useDeleteOptions = () =>
  useMutation({
    mutationFn: async (params: { ids: string[] }) =>
      customFetchStandard<{ message: string }>("common/option", {
        method: "DELETE",
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      const qc = getQueryClient()
      await qc.invalidateQueries({ queryKey: ["common", "option"] })
    },
  })

// Legacy alias kept so older imports keep compiling. Prefer `Option`.
export type ServiceOption = Option

// Legacy hook alias matching the old signature. Prefer `useListOption`.
export const useListServiceOption = useListOption
