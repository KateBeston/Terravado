# Project Marketing / Stock Visibility Platform — parked idea

**Status:** Parked for later. Not being built. Captured 27 Oct 2026.
**Why it's here:** It is adjacent to Terravado, but it is a different product with a
different buyer. This note records the idea and the integrate-vs-standalone call so it
isn't lost. It will live in its own Claude project.

## The idea
Developers hand off completed/under-construction projects to the sales channel — project
marketers, house-and-land salespeople, display-village agents. There is no good single
place, from a **marketing** (not project-management) perspective, to see:
- title and registration timeframes
- settlement timing for new builds / off-the-plan
- stage releases and what stock is available
- the handoff from developer delivery to the marketing channel
- all projects in one view for the people selling them

Today this runs on spreadsheets and developer emails. The project-management tools exist;
the marketing/stock-visibility layer is thinner.

## Why it's a separate product, not a Terravado feature
- **Different buyer:** developers and project marketers / land-sales agents — not mortgage
  brokers, advisers or investors.
- **Different core objects:** projects → stages → lots/releases → titles → settlements →
  allocations. Terravado's objects are clients, properties, serviceability and modelled runs.
- **Different workflow:** supply-side stock/release management vs buy-side investor modelling
  and advice.
- Bolting it into the Terravado portal would blur what Terravado is at exactly the moment
  that needs to be clear (Dino/Ash conversations).

## Where it genuinely connects to Terravado
It is the **supply side of Terravado's property-matching wedge.** A live feed of
house-and-land and off-the-plan stock — with real title and settlement timing — is exactly
the inventory Terravado would match investor-clients against. The connective tissue is the
**matching engine** (stock on one side, modelled client demand on the other), not shared
screens. Integration story: **data bridge, separate product.**

## How stock gets in (ingestion)
Two ways in — want both eventually, start manual:
1. **Developer self-serve portal** — developers upload a project, its information and live
   availability directly. Works day one, no integrations needed, and proves whether
   developers will keep stock current. This is the starting point.
2. **API feeds from the developer's existing tools** — added once there's demand.

**Source nuance (important):** point each API at the right system.
- **Project / site / planning detail** (zoning, feasibility, development potential) could
  come from tools like **Archistar** — a feasibility/site-analysis platform.
- **Availability and settlement/title timing** does NOT live in a feasibility tool. It sits
  in the developer's **sales / project-marketing CRM or stock-management system** (what the
  sales channel updates as lots sell and titles register), or in the self-serve portal.
Don't expect live stock/settlement data from a feasibility tool.

## Scope guardrail
NOT a project-management tool (no Gantt, no trade scheduling, no construction management).
It's a marketing/stock-visibility layer: what's selling, what's coming, when titles register,
when it settles — in one view for the sales channel.

## Risk / why parked
Solo founder already carrying TGS and Terravado. A third buyer and go-to-market before
Terravado's core is validated is a focus risk, not an opportunity yet. Revisit after
Terravado's core is proven.

## When revisited — first questions
1. Validate the gap with 3–5 project marketers / H&L sales teams: is title/settlement
   visibility really the pain, and would they pay for it?
2. Map existing incumbents in AU project-marketing / stock-management software.
3. Confirm which systems hold availability/settlement data vs project/planning data, and
   which expose an API (Archistar for planning/feasibility; sales CRMs for stock).
4. Decide standalone vs Terravado module, confirming the matching-engine data bridge either way.
