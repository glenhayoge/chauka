import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getBootstrap } from '../api/logframes'
import { useLogframeStore } from '../store/logframe'
import { useAuthStore } from '../store/auth'

export function useBootstrap(logframeId: number) {
  const setData = useLogframeStore((s) => s.setData)
  const setCurrentRole = useAuthStore((s) => s.setCurrentRole)

  const query = useQuery({
    queryKey: ['bootstrap', logframeId],
    queryFn: () => getBootstrap(logframeId),
    enabled: logframeId > 0,
  })

  useEffect(() => {
    if (query.data) {
      setData(query.data)
      setCurrentRole(query.data.userRole)
    }
  }, [query.data, setData, setCurrentRole])

  return query
}
