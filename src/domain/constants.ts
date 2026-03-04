export const ISSUE_TAGS = [
  'brakes',
  'engine',
  'suspension',
  'exhaust',
  'battery',
  'transmission',
  'electronics',
  'air conditioning',
]

export const CAR_BRANDS = [
  'Alfa Romeo',
  'Audi',
  'BMW',
  'Chevrolet',
  'Citroën',
  'Cupra',
  'Dacia',
  'Daewoo',
  'DS',
  'Fiat',
  'Ford',
  'Honda',
  'Hyundai',
  'Infiniti',
  'Jaguar',
  'Jeep',
  'Kia',
  'Land Rover',
  'Lexus',
  'Mazda',
  'Mercedes-Benz',
  'Mini',
  'Mitsubishi',
  'Nissan',
  'Opel',
  'Peugeot',
  'Porsche',
  'Renault',
  'Seat',
  'Škoda',
  'Smart',
  'Subaru',
  'Suzuki',
  'Tesla',
  'Toyota',
  'Volkswagen',
  'Volvo',
] as const

export const MIN_CAR_YEAR = 1980
export const MAX_CAR_YEAR = new Date().getFullYear() + 1

export const DEFAULT_RADIUS_KM = 15
export const MAX_RADIUS_KM = 100
export const MIN_RADIUS_KM = 1
