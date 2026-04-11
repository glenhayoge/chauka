import { useQuery } from '@tanstack/react-query'
import { getLogframes } from '../api/logframes'
import { getOrganisations } from '../api/organisations'

/**
 * Resolve a logframe public_id (UUID from URL) to its internal integer id.
 * Uses the logframes list which contains both id and public_id.
 */
export function useResolveLogframeId(publicId: string | undefined) {
  const { data: logframes, isLoading } = useQuery({
    queryKey: ['logframes'],
    queryFn: getLogframes,
    enabled: !!publicId,
  })

  const logframe = logframes?.find((lf) => lf.public_id === publicId)

  return {
    id: logframe?.id ?? null,
    isLoading,
    notFound: !isLoading && !!publicId && !logframe,
  }
}

/**
 * Resolve an organisation public_id (UUID from URL) to its internal integer id.
 */
export function useResolveOrgId(publicId: string | undefined) {
  const { data: orgs, isLoading } = useQuery({
    queryKey: ['organisations'],
    queryFn: getOrganisations,
    enabled: !!publicId,
  })

  const org = orgs?.find((o) => o.public_id === publicId)

  return {
    id: org?.id ?? null,
    isLoading,
    notFound: !isLoading && !!publicId && !org,
  }
}
