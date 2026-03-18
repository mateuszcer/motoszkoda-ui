export interface AssemblyGroup {
  id: string
  name: string
  parentId?: string
}

export interface CompatiblePart {
  articleNumber: string
  brandName: string
  articleName: string
}

export interface WholesalerSource {
  code: string
  name: string
}

export interface WholesalerError {
  sourceCode: string
  errorCode: string
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
  source: string
}

export interface PartsVehicle {
  ktypeId: string
  make: string
  model: string
  type: string
  yearFrom?: number
  yearTo?: number
}

export interface AssemblyGroupsResponse {
  vin: string
  vehicle: PartsVehicle
  groups: AssemblyGroup[]
}

export interface CompatiblePartsResponse {
  vin: string
  vehicle: PartsVehicle
  assemblyGroupId: string
  parts: CompatiblePart[]
  totalBeforeLimit: number
}

export interface PartsSearchResponse {
  resultCode: 'OK' | 'NO_GROUP_MATCH'
  vin: string
  vehicle: PartsVehicle
  offers: PartOffer[]
  totalFound: number
  queriedSources: WholesalerSource[]
  failedSources: WholesalerError[]
  groups?: AssemblyGroup[]
}
