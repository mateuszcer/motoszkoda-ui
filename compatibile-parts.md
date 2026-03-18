Inside the workshop quote submission flow — when a shop is preparing a quote (wycena) for a repair order. This is NOT a standalone page. It's embedded in the existing order detail view, in the "Twoja wycena" section where the shop currently enters a price manually.

User flow
Step 1: Shop opens a repair order (e.g. "VW Golf VII · 2019 — Hamulce piszczą przy hamowaniu"). The VIN is already known from the order.
Step 2: Below the order details, in the "Twoja wycena" section, there's a new block: "Znajdź części". Shop clicks it.
Step 3: System calls GET /api/parts/groups?vin={vin} and shows a category picker — a list of assembly groups (e.g. "Hamulce", "Zawieszenie", "Układ wydechowy"). Display as a simple list or a grid of selectable pills.
Step 4: Shop selects a group (e.g. "Hamulce"). System calls GET /api/parts/compatible?vin={vin}&groupId={groupId}.
Step 5: Results appear as a searchable/filterable list of compatible parts

For documentation look at docs/openapi/partssearch-openapi.yml