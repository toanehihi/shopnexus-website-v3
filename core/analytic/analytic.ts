import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useMutation } from "@tanstack/react-query"

// ===== Types =====

export type Analytic = {

}

// ===== Hooks =====

export const useCreateInteraction = () =>
  useMutation({
    mutationFn: async (params: {
      interactions: Array<{
        event_type: 'view' | 'add_to_cart' | 'purchase' | 'rating' | 'product_impression' | 'checkout_started'
        ref_type: 'Product' | 'Category' | 'Brand' | 'Vendor'
        ref_id: string
      }>
    }) => customFetchStandard<{ message: string }>('analytic/interaction', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  })


