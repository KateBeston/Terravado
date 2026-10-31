# Terravado — business plan

_Last updated: 27 Oct 2026. Working plan. Dollar figures are placeholders to confirm — not forecasts._

## 1. What Terravado is
A B2B property-investment modelling and origination platform for mortgage brokers, property-investment advisers and buyers agents. Where market-data tools answer *"where should I buy,"* Terravado answers *"can this client actually do it, how should it be structured, and can the professional prove it"* — then hands the qualified deal into the lending channel.

## 2. The problem & the wedge
The investor journey has two halves: **market selection** (served well by data companies) and **financial execution** — serviceability, after-tax hold, structuring, compliance. The second half is largely unmet by data tools and is done by hand across spreadsheets and separate specialists.

Terravado's wedge is that second half: **client-specific financial-execution depth + an integrated plan + compliance/BID evidence.** It's harder to build and less scalable than data — which is exactly why data companies won't prioritise it, and why it's defensible.

## 3. Market & competition
- **HtAG** — data/research company (~$159–250/mo, 150+ suburb metrics, 87-endpoint API). Deep on data, shallow on client finance *by design*. Its existence at pro price points proves the category pays.
- **StratMap** — lead-generation funnel.
- **Portals (REA/Domain)** — supply and audience, not advice.
- **The gap:** no one does the integrated finance-execution + plan + professional evidence layer. (Detail in *HtAG vs Terravado — competitive teardown*.)

## 4. Product (what exists today)
A multi-tenant internal portal (Supabase + Vercel, behind auth) with: the **Modeller** (models a property against a real client's position and across lender products — projection, Monte Carlo, scenarios, stress, serviceability, verdict, best-fit lender), tabbed **property records**, **client/contact** management, **manual lender products**, a **Finance** capacity tool, **deal export** (application-ready pack), and **The Business** document log. The modelling engine (projections, tax, land tax, depreciation, feasibility, serviceability, Monte Carlo) is built and verified. (Full detail in *Platform, portal features & modelling*.)

## 5. Business model & revenue
- **Primary: B2B SaaS** subscription to brokers/advisers/firms (per seat or per firm). Pricing anchored against HtAG's $159–250/mo, positioned at or above it given the deeper, workflow-embedded value. _[pricing to confirm]_
- **Secondary / future: origination value** — qualified, transparent deal flow into lenders through the lodgement channel; potential partnership economics, kept buyer-side and transparent, never a vendor-biased sales channel.
- **Lifecycle adjacency (parked):** an audit-vetted property-management referral network (see *Future partnerships*).

## 6. Go-to-market
- **Beachhead:** Ash's broker relationships and the property-investment adviser niche; Dino (real estate licence) as an early collaborator/channel.
- **Validate first:** test the wedge with Ash, Dino and a few advisers before heavy build/spend (see *Ash & Dino — validation questions*).
- **Channel:** the aggregator/lodgement ecosystem for origination; direct to broker and adviser firms for the SaaS.
- Credibility carried by the modelling depth and the evidence trail, not marketing spend.

## 7. The origination differentiator
Terravado is the **advice-and-origination front-end** that feeds qualified, transparent deals into the lodgement channel (LIXI → NextGen ApplyOnline / Simpology → aggregator CRMs) — aligned with the banks' interest, not competing as an aggregator. This is the lane that sidesteps the serviceability-data licensing wall. (Detail in *Origination & deal-export strategy*.)

## 8. Team
- **Kate** — founder; technical build plus a background in real estate, property, finance and hospitality; has run businesses before.
- **Ash** — 30-year property-investment mortgage broker; the domain-expertise moat (serviceability, lending, structuring). Free lifetime access for his own investing; possible equity — terms to be formalised cleanly (see *Ash & Dino — deal terms*).
- **Dino** — friend with a real estate licence; potential collaborator and channel.
- **Reality:** Kate is also building TGS, so founder bandwidth and focus are a genuine constraint to manage.

## 9. Moat & defensibility
Finance-execution depth + Ash's expertise; the integrated plan and the adviser's own compliance/BID evidence trail; owned historical-sales data for modelling and backtesting (later); and origination-channel relationships. None of these is a thing a data company replicates cheaply.

## 10. Key risks
- **Serviceability accuracy & upkeep** — a maintained-data problem; resolved by either licensing (Quickli) or keeping serviceability indicative and deferring the authoritative number to the lender's calculator (see *Serviceability — accuracy & build decision*).
- **Data licensing** — HtAG (API licence + attribution), CoreLogic (query-live only), Quickli (broker-SaaS terms block DIY integration). Mitigate with a provider-agnostic data seam.
- **Partnership/BD dependency** for the origination lane.
- **Solo-founder focus** across two startups.
- **Regulatory line** — Terravado is informational tooling; it holds no AFSL/credit licence and does not provide personal advice. The adviser owns the advice; Terravado owns the modelling accuracy and transparency.

## 11. Status & roadmap
- **Built & verified:** engine + assurance framework; portal (auth, client/property records, Modeller that's client- and property-aware, scenarios, stress, lender compare, save-run, deal export, The Business).
- **Next — build:** portfolio roll-up; wire real data (CDR product data, property-data providers, Domain listings); the property-matching engine; LIXI/lodgement integration (BD-gated); public/B2C-lite lead-funnel site (phase two); admin console.
- **Next — BD/validation:** Ash/Dino and adviser validation; aggregator/lodgement partner conversations; a Quickli partnership if pursued.

## 12. Costs
Lean by design: Supabase + Vercel infrastructure (low), AI-assisted development keeping build cost down. Deferred, revenue-justified costs: LIXI/lodgement-platform integration (paid when deal flow justifies it), data licences (HtAG/CoreLogic) when needed, Quickli (if pursued). No heavy spend is committed; the discipline is to validate before scaling.
