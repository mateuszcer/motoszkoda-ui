export interface AssemblyGroup {
  id: number
  name: string
  parentId?: number
}

export interface CompatiblePart {
  articleNumber: string
  brandName: string
  articleName: string
}

export type WholesalerSource = string

export interface WholesalerError {
  source: WholesalerSource
  error: string
}

export interface PartOffer {
  sku: string
  articleNumber: string
  name: string
  brand: string
  priceMinorUnits: number
  currency: string
  availability: 'IN_STOCK' | 'LOW_STOCK' | 'ON_ORDER' | 'UNAVAILABLE'
  quantityAvailable?: number
  leadTimeDays?: number
  source: WholesalerSource
}

export interface PartsVehicle {
  ktypeId: number
  make: string
  model: string
  type: string
  yearFrom?: number
  yearTo?: number
}

export interface AssemblyGroupsResponse {
  vehicle: PartsVehicle
  groups: AssemblyGroup[]
}

export interface CompatiblePartsResponse {
  vehicle: PartsVehicle
  groupId: number
  parts: CompatiblePart[]
  total: number
}

export interface PartsSearchResponse {
  vehicle: PartsVehicle
  offers: PartOffer[]
  total: number
  failedSources: WholesalerError[]
}
