import type {
  Attachment,
  CreateRepairRequestPayload,
  QuoteOffer,
  RepairRequest,
  ShopQuoteCard,
  ShopThread,
  ThreadMessage,
} from '../domain/types'

const seedNow = new Date('2026-02-27T09:30:00.000Z').getTime()

let idCounter = 2000

const minutesAgo = (minutes: number): string => {
  return new Date(seedNow - minutes * 60_000).toISOString()
}

const nextId = (prefix: string): string => {
  idCounter += 1
  return `${prefix}_${idCounter}`
}

const createMessage = (
  author: 'driver' | 'shop',
  text: string,
  sentAt: string,
  attachments: Attachment[] = [],
): ThreadMessage => ({
  id: nextId('msg'),
  author,
  text,
  sentAt,
  attachments,
})

const quote = (
  minPricePln: number,
  maxPricePln?: number,
  comment?: string,
  durationDays?: number,
  validUntil?: string,
): QuoteOffer => ({
  minPricePln,
  maxPricePln,
  comment,
  durationDays,
  validUntil,
})

const q = (
  shopId: string,
  shopName: string,
  distanceKm: number,
  state: ShopQuoteCard['state'],
  overrides: Partial<ShopQuoteCard> = {},
): ShopQuoteCard => ({
  shopId,
  shopName,
  distanceKm,
  state,
  interested: false,
  ignored: false,
  lastUpdatedAt: minutesAgo(40),
  ...overrides,
})

const t = (
  shopId: string,
  shopName: string,
  unreadCount: number,
  messages: ThreadMessage[],
): ShopThread => ({
  shopId,
  shopName,
  unreadCount,
  messages,
  lastActivityAt: messages[messages.length - 1]?.sentAt ?? minutesAgo(120),
})

export const initialMockRequests: RepairRequest[] = [
  {
    id: 'req_1001',
    status: 'open',
    createdAt: minutesAgo(120),
    updatedAt: minutesAgo(5),
    car: {
      vin: 'WAUZZZ8V9KA101234',
      make: 'Audi',
      model: 'A3',
      variant: 'Sportback',
      year: 2019,
      fuelType: 'Benzyna',
      mileageKm: 112000,
    },
    issue: {
      description:
        'Szlifujący dźwięk z przednich hamulców i wibracje przy zwalnianiu z prędkości autostradowej.',
      tags: ['brakes', 'suspension'],
      attachments: [],
    },
    location: {
      address: 'Domaniewska 42, Warszawa',
      latitude: 52.183,
      longitude: 21.003,
      radiusKm: 18,
    },
    shopQuotes: [
      q('shop_1', 'Metro Auto Serwis', 3.2, 'delivered', {
        lastUpdatedAt: minutesAgo(20),
      }),
      q('shop_2', 'Garaż Północ', 4.8, 'acknowledged', {
        lastUpdatedAt: minutesAgo(14),
      }),
      q('shop_3', 'Hamulce Premium', 6.1, 'question_sent', {
        questionPreview: 'Czy może Pan przesłać zdjęcie tarcz hamulcowych?',
        lastUpdatedAt: minutesAgo(7),
      }),
      q('shop_4', 'FixPoint Auto', 8.7, 'quote_sent', {
        quote: quote(
          500,
          700,
          'W cenie klocki + regeneracja tarcz. Części zamienne klasy OEM.',
          1,
          '2026-03-05T23:59:00.000Z',
        ),
        phone: '+48 501 111 222',
        lastUpdatedAt: minutesAgo(5),
      }),
      q('shop_5', 'Rapid Motors', 9.9, 'declined', {
        lastUpdatedAt: minutesAgo(12),
      }),
    ],
    threads: {
      shop_3: t('shop_3', 'Hamulce Premium', 1, [
        createMessage(
          'shop',
          'Czy może Pan przesłać zdjęcie tarcz hamulcowych? Pomoże nam to ocenić, czy konieczna jest wymiana.',
          minutesAgo(7),
        ),
      ]),
      shop_4: t('shop_4', 'FixPoint Auto', 0, [
        createMessage(
          'shop',
          'Możemy umówić wizytę na jutro rano. Proszę dać znać, czy to odpowiada.',
          minutesAgo(5),
        ),
      ]),
    },
  },
  {
    id: 'req_1002',
    status: 'closed',
    createdAt: minutesAgo(680),
    updatedAt: minutesAgo(240),
    car: {
      vin: 'WVWZZZ1KZBW250978',
      make: 'Volkswagen',
      model: 'Golf',
      variant: 'VII',
      year: 2018,
      engineType: '1.4 TSI',
      fuelType: 'Benzyna',
      mileageKm: 134000,
    },
    issue: {
      description:
        'Klimatyzacja nie chłodzi, po uruchomieniu słychać syczący dźwięk.',
      tags: ['air conditioning', 'engine'],
      attachments: [],
    },
    location: {
      address: 'Puławska 17, Warszawa',
      latitude: 52.218,
      longitude: 21.02,
      radiusKm: 10,
    },
    shopQuotes: [
      q('shop_8', 'Klimat Serwis', 2.4, 'quote_sent', {
        quote: quote(350, 480, 'W cenie kontrola szczelności i napełnienie.', 1),
        interested: true,
        phone: '+48 501 222 777',
        lastUpdatedAt: minutesAgo(280),
      }),
      q('shop_9', 'Miejski Serwis', 5.9, 'declined', {
        lastUpdatedAt: minutesAgo(400),
      }),
    ],
    threads: {
      shop_8: t('shop_8', 'Klimat Serwis', 0, [
        createMessage('shop', 'Czy może Pan potwierdzić, kiedy zaczął się problem?', minutesAgo(520)),
        createMessage('driver', 'Zaczęło się w zeszłym tygodniu.', minutesAgo(500)),
      ]),
    },
  },
]

export const deepCloneRequests = (requests: RepairRequest[]): RepairRequest[] => {
  return JSON.parse(JSON.stringify(requests)) as RepairRequest[]
}

export const createRequestFromPayload = (
  payload: CreateRepairRequestPayload,
): RepairRequest => {
  const createdAt = new Date().toISOString()

  return {
    id: nextId('req'),
    status: 'open',
    createdAt,
    updatedAt: createdAt,
    car: payload.car,
    issue: payload.issue,
    location: payload.location,
    shopQuotes: [
      q('shop_10', 'Auto Centrum', 2.1, 'delivered', {
        lastUpdatedAt: createdAt,
      }),
      q('shop_11', 'Klinika Aut', 4.3, 'delivered', {
        lastUpdatedAt: createdAt,
      }),
      q('shop_12', 'Mechanika Ekspresowa', 7.9, 'delivered', {
        lastUpdatedAt: createdAt,
      }),
    ],
    threads: {},
  }
}

export const createDriverMessage = (
  text: string,
  attachments: Attachment[],
): ThreadMessage => ({
  id: nextId('msg'),
  author: 'driver',
  text,
  attachments,
  sentAt: new Date().toISOString(),
})

export const createShopMessage = (text: string): ThreadMessage => ({
  id: nextId('msg'),
  author: 'shop',
  text,
  attachments: [],
  sentAt: new Date().toISOString(),
})

export const nextTimestamp = (): string => new Date().toISOString()
