# Terravado — platform, portal features & modelling

_Last updated: 27 Oct 2026. The build as it stands, and what it does._

## Architecture
- **Stack:** Next.js 14 (app router) + TypeScript; Supabase Postgres as the system of record with row-level security; Vercel (region syd1).
- **Multi-tenant:** each adviser/firm is a tenant; RLS isolates every tenant's clients, contacts, properties, lenders, documents and snapshots; a tenant is auto-provisioned on first sign-in.
- **Swappable seams (none load-bearing):** a repository interface (local-first in dev, Supabase in prod); a `FinanceProvider` seam (→ Quickli); a `PropertyDataProvider` seam (→ Valuer-General / ABS / Geoscape / CoreLogic / Google). Each can be swapped without touching the UI.
- **Auth:** Supabase Auth with Google OAuth (MFA pattern mirrors the TGS portal).
- **Assurance** is cross-cutting: every output is stamped and checked.

## Internal portal features (built)
- **Login** — email + Google, with a dev-mode fallback.
- **Dashboard.**
- **Modeller** — the core surface. Select a **client** (models against their real financial position) and a **property** (loads its record and deep financials). Produces: scored **verdict**, headline metrics, acquisition & serviceability, **Monte Carlo** risk (p10/p50/p90, cash-shortfall probability), **stress test** (combined shock, hold-survival), **scenarios** (named what-ifs), a 10-year **projection**, and a **lender comparison** (best-fit across lender products). Actions: save the run to the client's file, save the client's position, and **export the deal**.
- **Workspace** — the full original Terravado modelling app ported in (portfolio, deep property workspace, clients, serviceability, equity chain, lenders, feasibility, contacts, audit). In-memory for now, behind auth; a clean seam to Supabase later.
- **Clients** — CRUD plus a stored **financial position** (income, partner, living expenses, dependants, liabilities) that drives serviceability; saved runs listed on each client's file.
- **Contacts** — CRUD.
- **Properties** — a **tabbed record**: Overview; **Title** (title ref, lot/DP, zoning, heritage, easements, encumbrances); **Locality** (suburb stats, with a data-provider pull); **Sales history** (records + compound growth); **Physical**; **Financials** (deep inputs — operating expenses, loan structure, acquisition costs, depreciation, capex); **Modelling** (opens the property in the Modeller).
- **Lenders** — manual **lender/bank products** with the full serviceability policy as typed fields (buffer, floor, rates, income shading, HEM, debt rules, DTI/LVR caps, fees). These drive the comparison. Quickli status shown.
- **Finance** — borrowing capacity across the lender products (engine), or Quickli when connected.
- **The Business** — the business-development document log; documents are openable, readable and editable, and hold all the strategy docs.
- **Deal export** — an application-ready **deal pack** (fact-find) plus a structured JSON export grouped to LIXI CAL sections, ready to hand into the lodgement channel.

## Modelling (the engine)
- **Projection** — multi-year value, equity, LVR, pre- and after-tax cashflow.
- **Serviceability** — per-lender capacity (assessment rate = max(floor, actual+buffer); income shading; HEM; negative-gearing add-back; existing-debt assessment; DTI and LVR caps), multi-lender comparison and best-fit.
- **Risk — Monte Carlo** — the distribution of outcomes across simulated paths (p10/p50/p90 IRR, probability of a cash-shortfall year); mean-reversion growth; the empirical distribution will later come from owned sales data.
- **Scenario analysis** — discrete named cases (rate rises, rate shock, rent drop, low growth, downturn) — the "what ifs" a client understands.
- **Stress test** — a combined shock (rates up, rent down, income down), with a hold-survival verdict from the serviceability margin.
- **Verdict** — a scored band with material flags.
- **Tax** — income tax, CGT, Medicare, negative gearing, depreciation (Div 40 / Div 43), and land tax per state and entity with portfolio aggregation.
- **Feasibility** — development feasibility (GST margin scheme, residual land value).
- **Why several methods, not one number:** Monte Carlo shows *how wide* outcomes are, scenarios show *specific cases*, the stress test shows *whether they can hold it*. Together they give range, narrative and survival instead of false precision.

## Assurance & accuracy
- **Known-answer tests** tied to authoritative sources (state Revenue Offices, ATO, QS schedules, lender calculators) — not internal self-consistency.
- **Versioned, effective-dated reference data** (TAX_DATA, ENGINE_VERSION) so historic reports reproduce exactly.
- **Provenance** stamps on outputs; immutable **report snapshots**; an append-only **audit log**.
- **CI gate** (verify-engine) blocks any change that breaks a known answer; input validation at the boundary; scheduled re-verification.
- **Serviceability specifically:** sourced and tested from each lender's own calculator, never from memory (see *Serviceability — accuracy & build decision*).

## Data strategy
- **Three tiers:** aggregate/derived market data stored; client properties fetched live and snapshotted per client; bulk raw records not stored.
- **Per-source retention:** store (VG sales, ABS, Geoscape, HtAG with attribution); query-live only (CoreLogic); reference-only (Google Maps).
- **CDR Open Banking** for lender product data (rates/fees) — automatable, public.
- **Historical sales** (Valuer-General / land titles) as the owned data moat, later.
- **Listings** via Domain now, PropTrack later; never scrape the portals.

## Integrations & status
- **Serviceability/finance:** manual lender products live; Quickli seam present but gated on an API agreement + key (its broker-SaaS terms block a DIY integration — see *Quickli — integration terms assessment*).
- **Property data:** built-in stub live; CoreLogic (query-live, keyed); VG/ABS/Geoscape to ingest.
- **Origination:** deal export built; the LIXI → ApplyOnline/Simpology mapping is BD-gated (partner access).
- **CDR:** product data buildable now; consumer data needs accreditation or a licensed intermediary (later).

## Roadmap — still to build / wire
- **Portfolio roll-up** — a client's whole set of properties and saved runs aggregated (the last prototype module not yet native).
- **Real data wiring** — CDR product data, property-data providers, Domain listings.
- **Property-matching engine** — the discovery side of the wedge (client fit → ranked areas → properties).
- **LIXI / lodgement integration** — origination go-live, once partner access is in place.
- **Client-facing / public site** — a cut-down, not-advice lead funnel (phase two).
- **Admin console** — rule/rate-block configuration and audit sign-off.
