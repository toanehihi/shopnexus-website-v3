import { useMutation, useQuery } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"

// ===== Types =====

export type Style = {
  name: string
  description: string
}

export type Classification = {
  category_name: string
  display_name: string
  score: number
}

export type VideoProductResult = {
  resource_id: string
  resource_url: string
  transcription: string
  description: string
  style: string
  classifications: Classification[]
}

// ===== Hooks =====

export const useProcessVideoToProduct = () => {
  return useMutation({
    mutationFn: async (params: { file: File; style: string }) => {
      const form = new FormData()
      form.append("file", params.file)
      form.append("style", params.style)
      return customFetchStandard<VideoProductResult>(
        "catalog/product-spu/from-video",
        {
          method: "POST",
          body: form,
        }
      )
    },
  })
}

export const useListStyles = () => {
  return useQuery({
    queryKey: ["catalog", "styles"],
    queryFn: () => customFetchStandard<Style[]>("catalog/styles"),
  })
}
