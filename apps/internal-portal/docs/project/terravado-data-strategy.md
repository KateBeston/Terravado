# Terravado — data strategy

_Last updated: 26 Oct 2026._

## The unit of work: the modelling run
Terravado isn't a data-display tool, it's a modelling system. The unit of work is a **modelling
run**: assemble inputs (property figures, suburb growth and volatility, client financials,
assumptions) → engine → result (cashflow, IRR, Monte Carlo distribution, serviceability, verdict).
Data is pulled *as inputs to a run*, scoped to what the model needs; what you store is the
**modelled result** (inputs snapshot + outputs + provenance), not a cache of raw provider data.

## Two data concerns
- **General market data** — suburb/area-level figures for analytics and ranking. Shared across
  tenants, read-mostly, externally sourced. Lives in `suburb_data`.
- **Client properties in active use** — per-tenant records the adviser manages, in `properties`,
  with pulled market data attached as point-in-time snapshots (`property_snapshots`).

## Serverless ≠ no storage
Vercel is serverless *compute* (stateless, per-request). Supabase (Postgres) is the persistent
*database* — the system of record. You store data in Supabase; the functions query it. You are not
replicating a provider's national server; you are consuming it or storing the slice you need.

## Three storage tiers
1. **Aggregate / derived market data — store it.** Suburb medians, yields, growth, volatility.
   Small (megabytes), cheap, fast; the assumption layer for ranking and Monte Carlo. `suburb_data`.
2. **Client-specific properties — fetch live, snapshot per client.** Store the handful in play,
   not all 11M. `property_snapshots`.
3. **Bulk raw firehose — don't store (now).** National transaction/property records at full
   granularity is a warehouse project; query live or ingest selectively instead.

## Per-source retention policy (encoded in `retention.ts`)
- **Store (own it):** Valuer-General sales, ABS, Geoscape/G-NAF, HtAG (with attribution).
- **Query live, don't retain:** CoreLogic/Cotality — a point-in-time snapshot into one client's
  report is permitted; a derived dataset is not.
- **Reference only:** Google Maps — store `place_id` + coordinates, refetch the rest in-window.

## Listings (property supply)
- **realestate.com.au dominates by audience, not inventory.** Portals compete on buyers, not
  listings; REA won the eyeballs via network effects. Agents **dual-list**, so Domain's reachable
  API captures the large majority of on-market stock.
- **Domain API** — the reachable path (restrictive terms: no resale, onshore hosting). Start here.
- **PropTrack (REA)** — the fuller source, but enterprise, sales-gated, expensive, and a strategic
  dependency on a dominant gatekeeper that's also building investor tools. A funded, later upgrade.
- **Don't scrape the portals** — prohibited, robots-blocked, legally risky.
- **Off-market / developer stock** — relationships only. Solves supply cheaply but introduces
  vendor-side bias; disclose it and keep the match genuinely client-first, or you become a sales
  channel. Lean buyer-side.

## Access vs assess (the practical split)
- **Access (discovery):** Domain-level gets you *most* of the on-market market; gaps are
  REA-exclusives and off-market. Be transparent ("sourced from available on-market listings");
  the adviser fills gaps with their own knowledge and off-market contacts.
- **Assess (modelling):** essentially unaffected by portal choice — the engine runs on price +
  attributes + suburb data + client financials. You can model anything you can identify, at full
  depth. PropTrack only *polishes* inputs (better AVM, deeper comparables).
- Listings often show a price guide / auction, not a firm number — the adviser sets the assumed
  purchase price; the engine models from there.

## Historical sales — the owned data moat
Unlike listings, historical sales are **accessible, storable, ownable**. Source: state
**Valuer-General / land titles** — the root record every provider builds from, and largely public
(NSW bulk sales free; other states vary). It powers:
- **Macro** — long-term growth, cycles, rate sensitivity over decades.
- **Micro** — suburb/street/property growth and volatility.
- **The Monte Carlo** — the empirical *distribution* (mean + volatility) the simulation samples
  from. This is what turns the MC from a party trick into real risk modelling.
- **Backtesting** — proving the matching/ranking against history: defensible evidence to a client.
It's state-by-state data-engineering graft (the two years HtAG spent). Owning the raw lets you
compute the statistics transparently and show your working — the provenance-and-trust advantage.

## Property matching = the wedge
- **Matching logic (yours, buildable):** client's budget/serviceability/strategy/tax → commercial-
  fit criteria → rank areas (from `suburb_data`), then specific properties. This is the IP.
- **Property supply (external dependency):** Domain + area data + curated stock now; PropTrack +
  developer arrangements later.

## Sequencing
Build the matching engine on reachable supply (Domain, area data, adviser shortlists) to prove the
client-fit ranking. The VG historical-sales ingestion and comprehensive supply (PropTrack) are
later, funded, data-engineering phases — don't hold the engine hostage to them.
