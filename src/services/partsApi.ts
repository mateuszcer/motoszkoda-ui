import type { AssemblyGroupsResponse, CompatiblePartsResponse, PartsSearchResponse } from '../domain/parts-types'
import { api, cachedGet } from './apiClient'

const DAY_MS = 24 * 60 * 60 * 1000

export const partsApi = {
  async getAssemblyGroups(vin: string): Promise<AssemblyGroupsResponse> {
    return cachedGet<AssemblyGroupsResponse>('/api/parts/groups', {
      params: { vin },
      ttlMs: DAY_MS,
      cacheKey: `parts_groups_${vin}`,
    })
  },

  async getCompatibleParts(vin: string, groupId: string, limit?: number): Promise<CompatiblePartsResponse> {
    return cachedGet<CompatiblePartsResponse>('/api/parts/compatible', {
      params: { vin, groupId, limit },
      ttlMs: DAY_MS,
      cacheKey: `parts_compat_${vin}_${groupId}_${limit ?? ''}`,
    })
  },

  async searchParts(vin: string, opts: { q?: string; groupId?: string; limit?: number }): Promise<PartsSearchResponse> {
    return api.get<PartsSearchResponse>('/api/parts/search', {
      params: {
        vin,
        q: opts.q,
        groupId: opts.groupId,
        limit: opts.limit,
      },
    })
  },
}
