# Terravado

Property investment modelling platform — Australian market. Migration of the
original single-file `terra-platform.html` to a **Next.js · TypeScript ·
Supabase · Vercel** stack, delivered as a Progressive Web App.

> The product name lives in one place: `src/config/brand.ts`. Change it there to
> rename everything (UI, PWA, metadata). "Terravado" is intentionally a swappable
> value until the public domain is registered.

---

## What's in this first build

This is the **foundation increment** — the engine and the scaffold, verified:

- **The modelling engine, ported 1:1 to TypeScript** (`src/lib/engine/`). Every
  calculation from the original is preserved, including the four corrected bugs
  (transfer-duty brackets, Monte Carlo renovation-expense classification,
  serviceability double-count, commercial void spillover). The only change is
  that the data store is passed in as an explicit `ctx` instead of a global, so
  the engine is now a pure, deterministic, testable module.
  - `tax-data.ts` — versioned, effective-dated tax block (`AU-2025-26`) + the
    pluggable country layer (AU/NZ/UK/US/custom).
  - `engine.ts` — projection, IRR, required growth, driver ladder, demand index,
    tax profile, depreciation, acquisition, portfolio land-tax aggregation,
    sensitivity tornado, Monte Carlo, valuation, serviceability, equity chain,
    feasibility.
  - `seeds.ts` — the sample portfolio (demo working state + verification input).
- **Database schema** (`supabase/migrations/0001_initial_schema.sql`) — the full
  ~40-table multi-tenant schema with row-level security, the property-type and
  SDA/agricultural tables, the geography + analytics layer, versioned tax blocks,
  append-only audit log and immutable report snapshots. Ready to apply when you
  connect a Supabase project.
- **Supabase wiring** (`src/lib/supabase/`) — browser + server clients via
  `@supabase/ssr`, ready for auth + RLS.
- **PWA** — installable, offline app shell (`public/sw.js`, `src/app/manifest.ts`,
  icons). Manifest is generated from the brand config.
- **A live demo page** (`src/app/page.tsx`) — runs the sample property through the
  ported engine and renders the headline metrics + 10-year projection, proving the
  migration works end to end.

### Not yet built (next stages)

The ten input/output UI modules (property workspace, clients, serviceability,
equity chain, lenders, feasibility, portfolio, documents), Supabase auth screens,
and the data-access layer that reads/writes the schema. The engine and schema they
build on are done.

---

## Quick start

```bash
npm install
npm run verify:engine     # runs the engine against the sample portfolio — all checks should pass
npm run dev               # http://localhost:3000 — the live demo page
```

No environment variables are needed to run the demo (the engine runs in-memory on
the seed data). Supabase is only required once you wire the data layer.

---

## Connecting Supabase (when you're ready)

Kept free for now — do this at go-public, or whenever you want real auth/storage.

1. Create a Supabase project in the **Sydney region (`ap-southeast-2`)**. (The
   account's free tier allows 2 projects; both are currently used by TGS, so use a
   separate free account, pause a TGS project, or upgrade to Pro.)
2. Apply the schema: paste `supabase/migrations/0001_initial_schema.sql` into the
   Supabase SQL editor, or `supabase db push` with the CLI.
3. Copy `.env.example` to `.env.local` and fill in the project URL + anon key.
4. Create a Storage bucket named `documents` (Sydney) for uploaded files.

---

## Deploying to Vercel

1. Push this repo to GitHub, import it in Vercel.
2. Add the two `NEXT_PUBLIC_SUPABASE_*` env vars.
3. `vercel.json` pins functions to **Sydney (`syd1`)**.

### Compliance note

Because this handles credit-related data for a licensed broker, both the database
(Supabase Sydney) **and** the server-side compute (Vercel `syd1`, set in
`vercel.json` and `next.config.mjs`) are kept in Australia, so sensitive data does
not transit offshore. Confirm this posture before storing real client data. Tax
outputs are indicative and must be verified against the relevant revenue office
before being represented to a client.

---

## Architecture decisions carried from the schema review

- **Multi-tenant from the ground up** — `org → membership(role) → client → entity
  → property`, enforced by RLS. The original's role model maps directly onto this.
- **Inputs are the source of truth; engine outputs are recomputable** — only
  immutable report snapshots are stored, for Best Interests Duty evidence.
- **Reference data is data, not code** — property types, tax blocks, geography
  levels, metrics and drivers are rows you extend without a migration.
- **Append-only audit log**; documents in Storage with metadata in Postgres.

---

## Project layout

```
src/
  config/brand.ts            # product name + theme — single source of truth
  lib/engine/                # the ported pure modelling engine (verified)
  lib/supabase/              # browser + server clients
  app/                       # Next.js app router (layout, demo page, manifest)
supabase/migrations/         # 0001_initial_schema.sql — the approved schema
scripts/verify-engine.ts     # engine verification harness
public/                      # PWA service worker + icons
```

Engine version: `engine-2026.07` · App: `0.1.0`
