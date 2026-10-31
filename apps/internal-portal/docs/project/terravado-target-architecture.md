# Terravado — target architecture

_Last updated: 29 Oct 2026. Corrected to the two-application model (main site + internal
portal) after clarifying who works where. Supersedes the earlier single-app framing._

## The correction that drives this document

Terravado is **two applications sharing one engine and one database**, not one app with a thin
client view bolted on:

- **Main site (public-facing) — the workspace people log into.** Advisers, investment
  consultants, brokers and buyer's agents *and* their clients all sign in here, manage their
  accounts, and do the actual work (modelling, clients, properties, portfolios, deals). This is
  the product users touch. It **pulls** the calculators and data from the internal portal, and
  what users add or change **writes back** to the internal portal's database.
- **Internal portal (back office) — the engine room.** The master database, the calculators and
  mechanisms, the data pipelines and operations/admin management — run by **internal Terravado
  staff only**. It is the source of truth; the main site consumes it.

Earlier the internal portal was being built *as if* it were the access point advisers log into.
It is not. The user-facing workspace belongs in the main site; the internal portal keeps the
engine, the data and operations.

## Principle (unchanged)

The UI is downstream of the logic. The engine, rules, data and operations are the durable,
moat-bearing **one source of truth**; the user-facing app is a surface that reads from it. Invest
in the backend; keep the surface provisional until validation (Ash, Dino) tells us what users need
to see.

## How the two apps relate (decision: option 1 — shared DB + shared engine package)

- **One shared database.** The central multi-tenant Supabase lives with the internal portal and is
  the single master store. The main site reads and writes the *same* Supabase under RLS; internal
  staff reach it with elevated (platform-admin) access. No second database, no sync.
- **One shared engine package.** The calculators (projections, tax, land tax, depreciation, CGT,
  FIRB, feasibility, Monte Carlo, equity chain, scorecard/verdict, shortlist, matching) are
  extracted into a single package both apps import. One engine, no duplication, both apps always on
  the same version.
- **Evolution path:** start with the shared package + shared DB for speed; later, where it matters
  (protecting the modelling IP, serving the eventual public marketing site or partners), harden the
  engine behind an **internal-portal API** the main site calls. Not now.

## Repository — a monorepo

One Git repository, workspaces:

- `packages/engine` — the shared calculators + rules + assurance (the modelling backend).
- `packages/domain` — shared domain types and the repository interface over Supabase.
- `apps/main-site` — the public-facing login workspace (advisers/brokers/consultants + clients).
- `apps/internal-portal` — engine source home, master DB migrations, operations/admin surfaces.
- `supabase/` — the shared schema + migrations (the multi-tenant schema, RLS).

Two Vercel projects deploy from the one repo, each pointing at its app folder. Delivery stays
**one ZIP of the whole monorepo**.

## The three layers (conceptual — now split across the two apps)

### 1. Data layer — persistence + reference data
- Supabase Postgres with RLS (multi-tenant schema, already built and audited). Shared by both apps.
- Reference data as versioned, effective-dated blocks (`TAX_DATA`, currently `AU-2026-27`).
- Behind a **repository interface**, so persistence stays swappable (local-first in dev, Supabase
  in production).

### 2. Backend / domain layer — "how it works" (source of truth, in `packages/engine` + `packages/domain`)
- **Engine** — projections, serviceability, tax, land tax, depreciation, CGT, FIRB, feasibility,
  Monte Carlo, equity chain, the 22-driver growth scorecard and the verdict engine. *(Built, 40
  assurance checks passing.)*
- **Rules & reference data** — versioned tax blocks + the assurance framework. *(Built.)*
- **Domain / business operations** — clients/contacts, properties, entities, portfolios,
  advisers/tenants, audit log, report snapshots.
- **Integration seams** — each external service behind its own interface, none load-bearing
  (finance/serviceability provider; property-data: Valuer-General / titles, ABS, Geoscape/G-NAF,
  CoreLogic, Google Maps). *(Scaffolded with graceful fallback.)*
- **Provenance / assurance** — every output stamped and checked.

### 3. Presentation layer — what users see
- **Main site** — the adviser/broker/consultant + client workspace. The workspace pages already
  built (modeller, properties, contacts, portfolio, shortlist, lenders, finance, stock, match,
  Atlas, data sources, regulatory watch, etc.) are **mirrored into here** from the internal-portal
  prototype, pulling engine + data from the shared layers.
- **Internal portal (staff)** — operations and admin: platform-admin console, account provisioning,
  data-source management + ingestion, regulatory-watch ingestion, the Atlas data pipeline,
  assurance/monitoring, and the per-source data-governance policy.

## Two property-data concerns (unchanged)
- **General market data** — suburb-level figures for analytics and ranking. Shared across all
  tenants, read-mostly, externally sourced. Lives in the data layer as a market-data store.
- **Client properties in active use** — per-tenant, read-write, the client's own records behind RLS.
  Attach market data by reference or point-in-time snapshot.

## Data management & retention (per-source policy — unchanged)
How external property data is stored is decided **per source by its licence**, not by one rule:
- **Store — you own the copy.** Primary/open sources (Valuer-General sales, ABS, Geoscape/G-NAF;
  HtAG's API with attribution). Ingested on a schedule into the market-data store.
- **Query live — don't retain.** CoreLogic/Cotality. Queried on demand under licence, used for that
  session, not accumulated.
- **Reference only.** Google Maps — store the stable `place_id` and coordinates; refetch volatile
  content within the allowed window.

**Live-use without storage** is fine; the one exception that preserves auditability is a
**point-in-time snapshot of the specific figures used in a client's plan**, written into that
client's report/audit record. Every stored or snapshotted figure carries a provenance stamp
(source, date, licence basis). The retention policy itself is a governance document that lives in
the **internal portal's admin layer**. Read each provider's caching/retention/redistribution terms
before storing — it is a licensing line and varies per provider.

## Auth & multi-tenancy
- **Supabase Auth (Google OAuth + MFA)** on the **main site** — email + Google + second factor +
  forgot/reset — the login pattern mirrored from the TGS internal portal.
- **Multi-tenant:** each adviser or firm is a tenant; RLS isolates every tenant's clients, contacts
  and properties (built and audited). A **platform-admin** role (internal staff) sees across tenants
  from the internal portal for support, config and operations.

## Build order (from here)
1. Stand up the monorepo: `packages/engine` + `packages/domain` extracted from the current
   internal-portal repo; `apps/internal-portal` keeps the engine home + DB + ops; add `apps/main-site`.
2. Mirror the user-facing workspace pages into `apps/main-site`, importing the shared engine and the
   shared Supabase.
3. Thin the internal portal to engine + DB + operations/admin (move user-facing pages out, or keep
   staff-only previews).
4. Later: harden the engine behind an internal-portal API where it protects IP or serves the public
   site/partners.

## What stays thin until validated
The main-site surfaces and the client-facing view. Build the shared engine and data properly; keep
the windows cheap until Ash and Dino confirm what advisers actually need.
