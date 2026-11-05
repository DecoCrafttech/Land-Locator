# Land-Locator

A working map-first property discovery platform with a separate Partner Studio. Built in this workspace with React, Vite, TypeScript, Tailwind, React Router, TanStack Query, React Hook Form, Zod, Express, Drizzle and Neon adapters. There are no AI features or APIs.

## Start locally on Windows

Use Node.js 22.12+ (tested with Node 24.13.1) and npm. Open PowerShell in `D:\Land Locator`:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open:

| Application | Local URL |
|---|---|
| Customer PWA | http://localhost:5183 |
| Partner PWA | http://localhost:5184 |
| API configuration / readiness | http://localhost:4000/api/config |
| Sample branded storefront | http://localhost:5183/store/kovai-collective |

Ports 5183/5184 avoid the existing FixBeez development servers. Start each independently if preferred:

```powershell
npm run dev -w backend
npm run dev -w apps/customer-pwa
npm run dev -w apps/partner-pwa
```

The three commands belong in separate terminals. Vite proxies `/api` to Express; browsers use same-origin API requests. Stop a foreground server with Ctrl+C.

### Open on a phone over Wi-Fi

Keep the computer and phone on the same Wi-Fi, with `npm run dev` running. Open the Network URL printed by Vite, such as `http://192.168.1.7:5184` for Partner Studio and port 5183 for customers. Use the computer's current IPv4 address, not `localhost` on the phone. Keep the Windows network profile Private for a trusted home/work network.

If Windows blocks the connection, run the following once in **Administrator PowerShell**:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\Land Locator\scripts\enable-lan.ps1"
```

This narrowly allows TCP ports 5183/5184 from the local subnet on Private networks. Port 4000 does not need to be exposed to the phone because Vite proxies API calls. If login reports an origin error, add both exact Wi-Fi origins to `ALLOWED_ORIGINS` in `.env` and restart the backend. Set `VITE_CUSTOMER_URL`/`VITE_PARTNER_URL` to the same Wi-Fi host so cross-app links work on the phone. These values must be updated if the router changes the computer's IP. Guest Wi-Fi isolation or a VPN can also prevent devices from reaching each other.

The property wizard uses `getRandomValues` when `randomUUID` is absent on plain-HTTP LAN origins. Installation, service workers, geolocation and some clipboard features still depend on HTTPS; a local HTTP preview supports ordinary browsing, login and property editing.

## Demo and authentication

With `DEMO_MODE=true` and no database URL, the first backend start creates `data/demo.json` with 24 illustrative Coimbatore listings. Data and uploaded images persist across restarts. This single-process JSON store is only for local demonstrations, not production or multiple API instances. Photos come from Unsplash and are illustrative landscapes, not evidence of the listed parcel. Demo facility coordinates are sample points; their straight-line distances are computed using Haversine. Road distances and travel times are deliberately unavailable in demo mode.

| Role | Email | Password |
|---|---|---|
| Demo partner | `partner@demo.landlocator.test` | `LandLocator!2026` |
| Demo platform admin | `admin@demo.landlocator.test` | `LandLocator!2026` |

The login screen can fill these credentials. Demo accounts are only bootstrapped in the local demo store. When using Neon, run migrations, seed only an explicitly designated demo database, and use the bootstrap command to create an administrator. Never seed a live marketplace with sample inventory. `DEMO_MODE=false` excludes sample property records from public results. `NODE_ENV=production` refuses demo mode entirely.

Guest favourites live in browser local storage. Enquiry contact information lives in the backend and is available only to the owning authenticated partner. In demo mode, submitting an enquiry records a sample enquiry and contacts no one. Call and WhatsApp actions appear when the partner supplies real contact numbers.

## Implemented

- Interactive OpenStreetMap/Leaflet demo map; configurable Google Maps JavaScript provider with Advanced Markers in production. Normal pan, zoom, layers, reset, explicit geolocation, clustering, cluster expansion and coloured Sale/Rent/Lease markers.
- Debounced viewport queries, TanStack request deduplication, AbortSignal cancellation, shared filters across Map/List, locality suggestions, price/area/category filters, sorting and list pagination. Clusters are computed from filtered inventory, not invented totals.
- Preview sheets, property details, galleries, pricing, land conversion, parcel boundaries, exact-location privacy, availability and manual confirmation dates, saved properties, sharing and enquiry/site-visit forms.
- Location Intelligence with category icons, synchronized map/table selection, driving/walking modes, a provider-backed distance matrix, missing-route states, directions links and attributed factual infrastructure. Private coordinates are removed from public detail and marker payloads; nearby lookup is disabled for approximate-only listings.
- Partner authentication, persisted opaque HttpOnly cookie sessions, CSRF tokens, origin checking, password hashing/change, tenant ownership checks, rate limits, validated requests and audit events.
- Partner dashboard, listing status management, editing, archive with retained history, duplication, enquiry status management and confirmation reminders.
- Four-step publishing form: property facts; search/pin/drag/coordinates and polygon drawing with editable vertices; uploads/cover ordering/Reel link; review/draft/publish. Local draft recovery, pending controls and retry-safe creation IDs are included.
- Land boundary marking: manually tap parcel corners, drag numbered corner handles, add/undo/remove corners, fit the map to the parcel, and compare spherical map area with the entered size in the selected unit. The drawn shape has a semi-transparent purple fill with a clear outline and a declared-size/price label. Both Leaflet and Google map providers support corner adjustment. No shape is inferred from a pin or area. Empty boundaries are allowed; incomplete, crossing, repeated and zero-area shapes are rejected on save. The saved coordinates live in the property's JSONB data (or demo JSON store), so this feature needs no new database migration. Customer details and selected map previews display the saved parcel, subject to exact-location privacy.
- Validated image decoding, pixel/byte limits, optimized WebP delivery and tenant-owned upload metadata. Local demo files or private Neon S3-compatible storage behind the API.
- Tenant name/logo/colour/contact/slug branding, isolated public storefronts, opt-in marketplace visibility and basic administrator partner creation/suspension. Customer and partner URLs are configurable.
- Separate PWA manifests, 192/512px icons, precached application shells and offline notice. API responses, private enquiries, photos and map tiles are not service-worker cached. No offline availability is represented as current.

## Folder structure

```text
land-locator/
  apps/
    customer-pwa/       # Customer routes, Vite/PWA config, icons
    partner-pwa/        # Partner Studio, Vite/PWA config, icons
  backend/
    src/
      app.ts           # Validated public/partner/admin REST routes
      config.ts        # Environment and production guards
      location.ts      # Google Places/Routes and sample provider
      store.ts         # Neon/Drizzle or local demo persistence
      seed.ts          # Clearly labelled Coimbatore samples
      db/schema.ts     # Schema, foreign keys and indexes
    scripts/           # Migrations, sample seed, admin bootstrap
    migrations/        # Generated SQL and Drizzle metadata
  packages/shared/src/
    index.ts           # Types, schemas, filters and calculations
    client.tsx         # API client, feedback and shared components
    Map.tsx            # Leaflet/Google map provider component
    styles.css         # Responsive customer and studio design
  tests/
    core.test.ts
    api.test.ts
    e2e/workflows.spec.ts
  scripts/             # Icon regeneration and screenshot helper
  artifacts/           # Local visual QA screenshots
  .env.example
  package.json
  README.md
```

## Environment

Set variables in the repository-root `.env`. Restart the development servers after changes. Variables beginning `VITE_` are public and compiled into the browser bundle; all others must remain server-side.

| Variable | Purpose |
|---|---|
| `DEMO_MODE` | `true` for illustrative local inventory; `false` requires PostgreSQL |
| `DATABASE_URL` | Neon PostgreSQL connection string with SSL |
| `PORT` | Express port, default 4000 |
| `ALLOWED_ORIGINS` | Comma-separated exact customer/partner origins |
| `VITE_CUSTOMER_URL`, `VITE_PARTNER_URL` | Public application origins used for cross-app links |
| `VITE_GOOGLE_MAPS_KEY` | Browser-restricted Maps JavaScript API key |
| `VITE_GOOGLE_MAP_ID` | Google Cloud map ID for Advanced Markers |
| `GOOGLE_MAPS_SERVER_KEY` | Server-restricted Places/Routes key; never expose to the browser |
| `NEON_STORAGE_ENDPOINT` | Account/branch S3-compatible endpoint supplied by Neon |
| `NEON_STORAGE_REGION` | Region for S3 client, default `us-east-1` |
| `NEON_STORAGE_BUCKET` | Private image bucket |
| `NEON_STORAGE_ACCESS_KEY_ID` | Neon scoped storage credential ID |
| `NEON_STORAGE_SECRET_ACCESS_KEY` | Neon scoped storage credential secret |
| `BOOTSTRAP_EMAIL`, `BOOTSTRAP_PASSWORD` | One-time admin bootstrap (12+ character password) |

No external credentials were supplied during implementation. Live Google calls, Neon migrations against a real server and Neon object uploads have not been verified against an account.

## Google Maps setup

1. Create a Google Cloud project with billing; enable Maps JavaScript API, Places API (New) and Routes API.
2. Create a browser key restricted by HTTP referrer and Maps JavaScript API. Add the local and deployed customer/partner origins. Put it in `VITE_GOOGLE_MAPS_KEY`; configure a production map ID in `VITE_GOOGLE_MAP_ID`.
3. Create a separate server key restricted to Places API (New), Routes API and appropriate server network restrictions. Set `GOOGLE_MAPS_SERVER_KEY`. Do not use a referrer-restricted browser key for server requests.
4. Set quotas and billing alerts in Google Cloud. Use `DEMO_MODE=false` with your own listings to enable production facility retrieval. Both public PWAs should use the configured Google map when presenting Google Places results.
5. Nearby Search uses `places:searchNearby` with a minimal field mask. Text search uses `places:searchText`. Routes are batched through `distanceMatrix/v2:computeRouteMatrix`, with driving/walking mode. Responses are deduplicated in flight and held in bounded, short-lived memory caches (five minutes). Review provider retention terms for your deployment.

Official references: [Load Maps JavaScript](https://developers.google.com/maps/documentation/javascript/load-maps-js-api), [Nearby Search](https://developers.google.com/maps/documentation/places/web-service/nearby-search), [Route Matrix](https://developers.google.com/maps/documentation/routes/compute_route_matrix). The demo base map uses standard OpenStreetMap tiles with attribution. Provision an appropriate tile service for high-volume non-Google use; do not bulk-download or offline-cache community tiles.

## Neon PostgreSQL setup

1. Create a Neon project and a dedicated development branch. Copy its SSL connection string to `DATABASE_URL`.
2. For a real marketplace set `DEMO_MODE=false`. For a separate sample database only, leave it `true`.
3. Apply the committed migrations:

```powershell
npm run db:migrate
```

4. Set bootstrap environment values in `.env`, then:

```powershell
npm run bootstrap
```

5. Remove bootstrap credentials from `.env` after successful creation. Sign into Partner Studio as the administrator; create partners through Platform Admin.
6. To seed a dedicated demonstration database:

```powershell
npm run db:seed
```

`npm run db:generate` regenerates migrations from the Drizzle schema. No database credentials are necessary to generate/check migration files. Actual migration execution requires a reachable database.

The MVP schema uses separate partners, users, sessions, properties, property_images (upload registry), enquiries, saved_properties, audit_logs and platform_settings tables. Core filterable geographic/ownership/status fields are indexed columns; property facts, boundary vertices and presentation metadata use JSONB snapshots. Visit requests are enquiries with date/time. Branding is partner metadata. This is a compact MVP schema, rather than every normalized table proposed in the original brief. The server applies tenant scope on private queries. It does not yet use PostgreSQL row-level security or PostGIS.

## Neon Object Storage setup

1. Enable Neon Object Storage for the intended backend/branch and create a private bucket.
2. Obtain the endpoint and a scoped credential with `storage:read` and `storage:write` permission. Fill the `NEON_STORAGE_*` variables from the returned values; do not assume AWS IAM keys or guess the endpoint.
3. Restart Express, sign in and upload a real image through the property form. The server decodes/validates it, strips embedded metadata, resizes within 1800×1800, encodes WebP and writes a tenant-prefixed object key.
4. The browser receives an opaque `/api/media/:id` URL. The API permits the owning partner, publicly listed photos or active public branding; private bucket credentials never reach the browser.

The original upload is intentionally not retained. The image is optimized before storage, and this policy should be changed if your business needs source-image retention. Maximum file size is 8 MB, decoded input is capped at 40 million pixels, and only JPEG/PNG/WebP content is accepted. Deleting a listing archives it; objects are retained to preserve history. A production orphan-object retention/cleanup job is still needed.

Official references: [Neon Object Storage](https://neon.com/docs/storage/overview), [storage credential mapping](https://neon.com/docs/storage/authentication).

## Checks and production builds

```powershell
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm audit --omit=dev
```

Core/API tests use a temporary demo directory. End-to-end tests currently use running local demo servers and create clearly named browser test records. They exercise customer selection/save/nearby/enquiry; partner photo upload/pinning/publishing; tenant creation/branding/storefront isolation; and no horizontal overflow at 320, 360, 390, 430, 768 and 1440px. Provider calls incur no Google API charges in these tests.

Implementation validation: TypeScript passed; 24 core/API tests passed; 6 Playwright workflows passed; both PWA builds and the backend bundle passed; the compiled backend responded successfully to a readiness request; migration generation reported no schema drift; the runtime-only npm audit reported zero vulnerabilities. PostgreSQL migration execution and real Google/Neon requests remain untested without credentials. `node scripts/preview.mjs` refreshes screenshots and checks 30 partner page/viewport combinations. After stopping the API, `node scripts/clean-test-records.mjs` removes only the explicitly named local automated-test records.

Build outputs are `apps/customer-pwa/dist`, `apps/partner-pwa/dist` and `backend/dist/server.mjs`. Run the compiled backend with `npm start -w backend`. A production Node host needs runtime dependencies installed. Host each PWA over HTTPS, rewrite non-asset routes to its `index.html`, and reverse-proxy `/api` to the backend. Set `NODE_ENV=production`, `DEMO_MODE=false`, exact allowed origins and both public app URLs before building/deploying. Sessions use Secure cookies in production; keep each frontend's API on the same public origin through the proxy.

PWA service workers are generated for production builds, not the development server. Test install/offline behaviour on HTTPS or localhost with a built version. Never cache `/api`, including authentication and enquiry responses.

## Remaining scope and limits

This implementation completes the primary customer/partner/white-label vertical slices. It is not a claim that all production acceptance criteria in the extensive original brief are finished.

- Customer sign-in, cross-device saved-property synchronization, password reset/email delivery and external social login are not implemented. Guests browse and save locally. Partners can change an existing password; administrator bootstrap is the initial access mechanism.
- Advanced administrator reporting, reported-listing moderation, city management, plan/branding permission management and platform settings UI are not implemented. Basic partner creation/suspension and a totals API are present.
- Infrastructure is partner-entered factual text, not independently verified. There are no legal, investment or AI scores. No supplied sample property is labelled independently verified.
- List results are paginated; the map response caps sidebar previews at 100 and database candidate queries at 2,000. A production-scale listing index, date/price/area SQL filtering, cursor pagination and load testing remain necessary before large deployments. Demo persistence is single-process only.
- Map pinning, draggable/coordinate-based corner editing, simple-polygon validation and saved boundary display work. Survey-grade area, automatic radius search around arbitrary search locations, draggable sheet/swipe gestures and dedicated camera capture UI are not implemented.
- Photos have cover-first reordering, removal, sequential uploads and manual retry, but no upload percentage progress or full drag-reordering UI. There is no background upload queue or abandoned-upload cleanup job.
- Facilities have a five-kilometre default radius; no road route is drawn as a polyline. Production distance/time requests are implemented, but provider availability/charges depend on your credentials and project settings.
- Sessions expire after seven days. Password changes invalidate the current session, not all other devices. Add global session revocation, managed account recovery, secrets management, backups, monitoring and security review before public deployment.
- Service workers and manifests are built successfully; OS-level install prompts and real-device offline lifecycle require device verification.
- Development-tool dependency advisories may remain even when the runtime audit is clean. See your current `npm audit` output; do not expose development servers publicly.

Use the numbered tests and this limitations list as the handoff for further production hardening, rather than treating an unconfigured integration as live.
