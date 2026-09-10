# Architecture Overview

## System Diagram

```mermaid
graph TB
    subgraph Client["Frontend — Vue 3 + Vite (:3000)"]
        Router["main.js\nvue-router"]
        Views["Views\nDashboard / Inventory / Orders /\nDemand / Spending / Reports"]
        Composables["Composables\nuseFilters / useAuth / useI18n"]
        ApiClient["api.js (axios)"]
        Router --> Views
        Views --> Composables
        Views --> ApiClient
    end

    subgraph Server["Backend — FastAPI (:8001)"]
        Main["main.py\nendpoints + Pydantic models\n+ filter helpers"]
        MockData["mock_data.py\nloads JSON into memory at startup"]
        Main --> MockData
    end

    subgraph Data["Data — JSON files"]
        JSON["server/data/*.json\ninventory, orders, demand_forecasts,\nbacklog_items, purchase_orders,\nspending, transactions"]
    end

    ApiClient -- "HTTP/JSON (CORS *)" --> Main
    MockData --> JSON
```

## Data-Flow Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant V as View (e.g. Dashboard.vue)
    participant F as useFilters composable
    participant A as api.js
    participant S as FastAPI main.py
    participant D as mock_data.py (in-memory)

    U->>F: change filter (warehouse/category/status/month)
    F->>V: reactive filter state updates
    V->>A: api.getX(filters)
    A->>S: GET /api/x?warehouse=&category=&status=&month=
    S->>D: read in-memory lists
    S->>S: apply_filters() / filter_by_month()
    S->>S: validate response via Pydantic model
    S-->>A: JSON response
    A-->>V: response.data
    V->>V: store in ref, derive computed properties
    V-->>U: render tables/charts
```

## Frontend Notes
- `client/src/main.js` — app entry, mounts `App.vue`, defines `vue-router` routes to each view.
- `client/src/views/*.vue` — one per nav tab; owns data loading (`ref` + `onMounted`) and page-level `computed` derivations.
- `client/src/components/*.vue` — reusable UI: `FilterBar`, detail modals (`InventoryDetailModal`, `ProductDetailModal`, `BacklogDetailModal`, `CostDetailModal`), `ProfileMenu`, `TasksModal`, `LanguageSwitcher`.
- `client/src/composables/` — shared reactive state: `useFilters` (the 4 global filters), `useAuth`, `useI18n`.
- `client/src/api.js` — single axios client, one function per endpoint; base URL hardcoded to `http://localhost:8001/api`.
- Some `api.js` functions (`getTasks`, `createTask`, `deleteTask`, `toggleTask`, purchase-order endpoints) have no matching route in `server/main.py` — verify before relying on them.

## Backend Notes
- `server/main.py` — all routes, Pydantic models, and the shared `apply_filters` / `filter_by_month` helpers live in this one file (no routers/services split yet).
- `server/mock_data.py` — loads `server/data/*.json` once at import time into module-level lists; this is the only "data layer" (no database).
- `server/generate_data.py` — standalone script to (re)generate the JSON fixtures in `server/data/`.
- Filtering (`warehouse`, `category`, `status`, `month`) is done in Python over in-memory lists per-request; nothing is cached or indexed.
- CORS is wide open (`allow_origins=["*"]`) — dev-only setting.

## Key Files
| Concern | Path |
|---|---|
| Frontend entry / routing | `client/src/main.js` |
| Frontend API client | `client/src/api.js` |
| Global filter state | `client/src/composables/useFilters.js` |
| Backend entry / all endpoints | `server/main.py` |
| Backend data loader | `server/mock_data.py` |
| Fixture generator | `server/generate_data.py` |
| Raw data | `server/data/*.json` |
