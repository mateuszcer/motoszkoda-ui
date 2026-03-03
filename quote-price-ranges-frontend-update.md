# API Breaking Change: Quote Price Ranges & Line Items

## What changed

Quotes now support **price ranges** (min/max) instead of a single flat price, and **optional line-item breakdowns**.

## Breaking field renames

Everywhere `priceMinorUnits` appeared, it's now split into two fields:

| Old field | New fields |
|---|---|
| `priceMinorUnits` | `priceMinMinorUnits` + `priceMaxMinorUnits` |

This affects:
- **Quote responses** — all endpoints returning quotes (`/shop-actions/quote`, `/shop-response`, `/shop-responses`, `/shop-inbox`)
- **Submit quote request** — `priceMinorUnits` → `priceMinMinorUnits` (with optional `priceMaxMinorUnits`)
- **Compare view** — `quoteSummary.priceMinorUnits` → `quoteSummary.priceMinMinorUnits` + `quoteSummary.priceMaxMinorUnits`

## New fields on quote responses

Each quote now includes a `lineItems` array (empty when no breakdown was provided):

```json
{
  "priceMinMinorUnits": 15000,
  "priceMaxMinorUnits": 22000,
  "lineItems": [
    {
      "id": "...",
      "position": 0,
      "description": "Brake pads",
      "totalPriceMinMinor": 10000,
      "totalPriceMaxMinor": 15000
    },
    {
      "id": "...",
      "position": 1,
      "description": "Labor",
      "workPriceMinMinor": 5000,
      "workPriceMaxMinor": 7000
    }
  ]
}
```

## Submit quote — new request shape

Single price (backward-compatible pattern — just rename the field):
```json
{ "priceMinMinorUnits": 15000, "currency": "PLN" }
```
`priceMaxMinorUnits` defaults to `priceMinMinorUnits` when omitted.

Price range:
```json
{ "priceMinMinorUnits": 15000, "priceMaxMinorUnits": 22000, "currency": "PLN" }
```

With line items (top-level prices are ignored, auto-calculated from items):
```json
{
  "currency": "PLN",
  "estimatedDays": 3,
  "lineItems": [
    { "position": 0, "description": "Brake pads", "totalPriceMinMinor": 10000, "totalPriceMaxMinor": 15000 },
    { "position": 1, "description": "Labor", "workPriceMinMinor": 5000, "workPriceMaxMinor": 7000 }
  ]
}
```

Each line item uses **either** `totalPrice*` **or** `work/partsPrice*` — not both. Max defaults to min when omitted on line items too.

## Full schema details

- `docs/openapi/shop-response-openapi.yml` — `SubmitQuoteRequest`, `LineItemRequest`, `QuoteResponse`, `LineItemResponse`
- `docs/openapi/readmodel-openapi.yml` — `QuoteSummary`
