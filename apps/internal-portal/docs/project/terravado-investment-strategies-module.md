# Terravado — investment strategies & market-climate module (spec + seed content)

_Captured 31 Oct 2026. The seed for a staff-facing "Strategies" layer in the internal portal, plus the market analysis behind it. General information to guide the build and inform licensed professionals — not personal financial, credit or tax advice._

## Purpose & placement
A **knowledge/strategy layer that sits above the calculators**. The engine answers *"does this deal stack up?"*; this layer answers *"given this climate and this client, which strategy should we even be modelling?"* It is **internal-portal, staff-facing** — decision-support and reference for the adviser/broker, feeding their judgement. It is **not** an auto-recommender that serves strategies to a client. That keeps it on the right side of the "flag, don't advise" boundary in `terravado-regulatory-compliance-review.md` (§7). Selected, general content *could* later surface on the user site as transparency/methodology ("how we think about strategy"), but the raw strategy catalogue and SWOTs stay internal.

## The thesis
**Property stays viable; what changed is which strategies win.** The 2026 changes (negative-gearing restriction, CGT reform, SMSF residential-LRBA ban, APRA DTI cap — see `terravado-tax-legislation-review.md` §0.5) retune the *incentives*, not the underlying engine of property returns. And they **sharpen Terravado's wedge**: when the tax cushion thins, the real after-tax, after-finance position becomes decisive, and finding *fundable* deals across lenders becomes the scarce skill. A market where "just negatively gear it and ride growth" no longer works is a market that needs modelling — against the *new* rules, which almost no existing tool does yet.

## What makes property work — untouched by the tax changes
These are the real drivers; NG/CGT/SMSF are overlays on top:
- **Leverage** — control a large asset on a small deposit; return compounds on the whole asset value. (This is the one thing lender tightness constrains — hence finance is now the binding issue.)
- **Compounding capital growth** on the whole asset over long holds.
- **Rental income** that tends to rise with inflation.
- **Manufactured equity** — reno, subdivision, development: growth you create, not wait for.
- **Inflation hedge** — inflation erodes debt in real terms while rents/values climb.
- **Structural demand** — Australia's chronic undersupply + population growth underpin long-run demand.

## The four 2026 retunings (deeper)

### A. Tilt toward new builds (deliberate policy)
- NG survives only on **new residential** from 1 Jul 2027; established bought after 12 May 2026 has losses **quarantined** (carried forward, not refunded against wage income — a real cash difference for high earners who got 37–47% back at the margin).
- **Depreciation compounds it:** new property gets both Div 43 capital works *and* Div 40 plant & equipment (recall the 2017 rule killed Div 40 on second-hand plant for established resi) — commonly five figures in year one.
- **CGT** reinforces: new can elect the 50% discount; established is pushed onto indexation + 30% floor.
- **Honest counterweight:** new builds carry a developer premium (resale can sit below purchase for a year or two), off-the-plan settlement/valuation risk, apartment oversupply pockets, thin-growth fringe H&L. The tax saving is visible and seductive; whether the *total* position stacks up is exactly what the model must answer.

### B. Cashflow matters more
- Without the wage-offset, a negatively geared established property's shortfall is fully out of pocket. Neutral-to-positive cashflow becomes the baseline; growth becomes the upside, not the thing you bleed for.
- Relatively better: higher-yield regional, dual-occ, granny flats/secondary dwellings, co-living/rooming houses, NDIS/SDA (high yield, specialised/regulated), commercial.
- Debt recycling and offset become more important for managing a hold the taxman no longer shares.

### C. SMSF narrowed, not dead
- **Gone:** new LRBAs gearing *residential* in super (live 10 Aug 2026).
- **Remains:** unleveraged resi in super; **geared commercial/business real property**; existing LRBAs grandfathered + refinanceable.
- **Live, intact (arguably more attractive) play:** a business owner buying their own commercial premises via SMSF (business real property), paying rent to their own fund, gearing still permitted.
- SMSF resi gearing was always a specialised corner with conflicted-advice problems; its removal cleans that up rather than touching the mainstream investor.

### D. Serviceability is the binding constraint
- The **DTI≤6 cap** rations rather than bans high-DTI lending (≤20% of a lender's new loans above DTI 6) — lenders get choosy; borderline deals decline/reprice/shift lender. Capacity is unevenly spread across lenders → knowing *which* lender suits this borrower is valuable.
- The **3% buffer** assesses a ~6% loan as ~9% — a structural capacity haircut regardless of the actual cash rate.
- **Overlays bite:** postcode/location restrictions, apartment-density limits, LVR caps. (Ash's real example: a WA development site declined by seven lenders at 40% LVR purely on postcode — the deal was fine, the lender appetite wasn't.)
- **Who wins:** the investor who knows real capacity across lenders, sequences purchases to keep DTI manageable (equity recycling, staggering — the equity-chain engine), and matches deal to lender policy. The hard part moved from *finding* to *funding*.

## The strategy catalogue (the SWOT-able set)
Each entry becomes a structured record: strengths, weaknesses, opportunities, threats; the conditions/climate it suits; the tax & lending levers it leans on; and the Terravado engine mechanisms that test it.

1. **New-build buy-and-hold** — the legitimate tax-lever play (NG + full depreciation + CGT election); watch developer premium and growth quality. _Engine: projection, depreciation (Div 43/40), after-tax cashflow, CGT (new-regime election)._
2. **Cashflow / yield** (dual-occ, granny flat, regional high-yield, co-living) — self-funding for capacity-constrained investors. _Engine: yield, after-tax cashflow, serviceability._
3. **Value-add / manufactured equity** (reno, subdivision, small development) — creates growth and recycles equity past the DTI ceiling. _Engine: feasibility (residual land value, GST margin), equity chain._
4. **Commercial, incl. SMSF business real property** — higher yield, different lending, gearing retained in super for business owners. _Engine: commercial feasibility (cap rate/NOI), entity/SMSF overlay._
5. **Rentvesting** — rent where you live, invest where the numbers work. _Engine: serviceability, cashflow, CGT main-residence interplay._
6. **Debt recycling / structuring** — manage the unsubsidised hold, improve deductibility. _Engine: cashflow, tax, entity overlay._
7. **Lower-LVR / within-capacity buying** — slower accumulation to stay fundable. _Engine: serviceability, DTI flag, equity chain._

## Climate-awareness design
- Tag each strategy against **current conditions** — rate environment, NG/CGT regime (which engine tax-version is in force), DTI/lending settings — so the module surfaces *"what's working now"* rather than a static list.
- **Pair with the Regulatory Watch:** when a rule changes (new tax-data version, an APRA change), the strategy fit changes — a strategy's "conditions it suits" should be driven off the same versioned levers the engine uses, so the catalogue updates as the regime does.

## Module design sketch (how it'd be built)
- A **`strategies` registry** (staff-maintained): one record per strategy — SWOT fields, suited-conditions tags, the tax/lending levers it depends on, and references to the engine mechanisms that test it.
- A **climate/conditions model** that reads the in-force tax-data version + lending settings and scores or filters strategies for "fit now."
- **Portal surface:** a "Strategies" section listing the catalogue, filterable by client type / conditions, each opening to its SWOT and a "model this" hook into the Modeller with the relevant mechanisms pre-selected.
- Optional later: a light **matching layer** that, given a client's capacity/goals/tax position, surfaces candidate strategies for the adviser to consider (still decision-support, not advice).

## Honest risks
Volume genuinely is down (investor lending/activity softened — Ash's lived experience). The 2026–27 transition distorts behaviour around the 1 Jul 2027 start (possible established-price softness, new-build premium inflation). Higher-yield strategies usually trade away growth or add management/specialised risk. Policy itself is a live risk — the argument for building flexibly. Property stays illiquid, concentrated, and leverage cuts both ways.

## Compliance boundary (hold this line)
General information and SWOT for the licensed professional; internal/staff-facing; never an auto-recommender to a client. Every strategy entry points the adviser to their own duty and a licensed professional for personal advice. SMSF/structuring content is flagged, not advised (SMSF property advice is financial-product advice).

## Sequencing
Build **after** the `AU-2027-28` engine — the module points at strategies the engine must be able to model correctly under the new rules, so the engine is the prerequisite. This is a content/knowledge module, not an engine build; a focused increment on top of a correct engine.

## Sources
Market analysis synthesised 31 Oct 2026 from `terravado-tax-legislation-review.md` (§0.5) and `terravado-regulatory-compliance-review.md`, which carry the primary legislative sources (ATO/Treasury, APRA, AUSTRAC, ASIC).
