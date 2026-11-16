import { apiClient } from './client'
import type { PG, LocalityOption, PGCategory, RentSort, SharingOption } from '../types'

export interface FetchPGsParams {
  category?: PGCategory[]
  city?: string
  locality?: string
  sort?: RentSort
  facilities?: string[]
  sharing?: SharingOption | 'Any'
  food?: string
  minRent?: number | ''
  maxRent?: number | ''
  page?: number
  limit?: number
}

export interface FetchPGsResponse {
  data: PG[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export async function fetchPGs(params: FetchPGsParams = {}): Promise<FetchPGsResponse> {
  const query = new URLSearchParams()

  if (params.category && params.category.length > 0) {
    query.set('category', params.category.join(','))
  }
  if (params.city) {
    query.set('city', params.city)
  }
  if (params.locality) {
    query.set('locality', params.locality)
  }
  if (params.sort && params.sort !== 'default') {
    query.set('sort', params.sort)
  }
  if (params.facilities && params.facilities.length > 0) {
    query.set('facilities', params.facilities.join(','))
  }
  if (params.sharing && params.sharing !== 'Any') {
    query.set('sharing', params.sharing)
  }
  if (params.food) {
    query.set('food', params.food)
  }
  if (typeof params.minRent === 'number') {
    query.set('minRent', params.minRent.toString())
  }
  if (typeof params.maxRent === 'number') {
    query.set('maxRent', params.maxRent.toString())
  }
  if (params.page) {
    query.set('page', params.page.toString())
  }
  if (params.limit) {
    query.set('limit', params.limit.toString())
  }

  const qs = query.toString()
  return apiClient.get<FetchPGsResponse>(`/pgs${qs ? `?${qs}` : ''}`)
}

export async function fetchPGBySlug(slug: string): Promise<PG> {
  const res = await apiClient.get<{ data: PG }>(`/pgs/${encodeURIComponent(slug)}`)
  return res.data
}

export async function fetchLocalities(): Promise<LocalityOption[]> {
  const res = await apiClient.get<{ data: LocalityOption[] }>('/localities')
  return res.data
}
