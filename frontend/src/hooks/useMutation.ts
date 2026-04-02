import { useMutation as useRQMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'

type Method = 'post' | 'patch' | 'delete'

export function useApiMutation<TData = unknown, TBody = unknown>(
  method: Method,
  url: string,
  invalidateKeys?: string[][]
) {
  const queryClient = useQueryClient()

  return useRQMutation<TData, Error, TBody>({
    mutationFn: async (body: TBody) => {
      if (method === 'delete') {
        const { data } = await apiClient.delete<TData>(url)
        return data
      }
      const { data } = await apiClient[method]<TData>(url, body)
      return data
    },
    onSuccess: () => {
      invalidateKeys?.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))
    },
  })
}
