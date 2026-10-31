# HtAG vs Terravado — competitive teardown and the wedge

_Last updated: 26 Oct 2026_

## The one-line distinction

**HtAG answers "where should I buy."** It is a data and research company: 150+ suburb
metrics, growth/ROI forecasts, heatmaps, research reports, an 87-endpoint API. That is its
moat.

**Terravado answers "can this person actually do it — and can the professional prove it."**
It is a finance, tax and compliance modelling engine: multi-lender serviceability, after-tax
cashflow, depreciation, land tax across states and entities, structuring, development
feasibility, and the evidence trail behind an adviser's recommendation.

Same investor journey, different halves. HtAG picks the market around a strategy; Terravado
works out whether the client can execute it, how to structure it, and whether it holds up after
tax and across lenders.

## Why HtAG's data is deep but its modelling is shallow

It is shallow on purpose, not by accident:

1. **Different economics.** Data scales — build once, sell to thousands. Orienting to one
   client's circumstances and building a plan is bespoke, lower-margin, and edges toward
   personal advice, liability and licensing. Data companies deliberately stop at "here's the
   intel, you decide."
2. **Different discipline.** Serviceability is broker knowledge; after-tax cashflow and land tax
   are accountant knowledge; structuring is accountant/lawyer knowledge. A data-science team
   doesn't hold this, so it compresses messy domains into a **score** (Cashflow RCS,
   Affordability Index). A score is not a plan.
3. **The last mile.** Data covers 90% of a market map. The final 10% — what *this* person
   should do given their income, equity, serviceability, tax position and risk — is the hardest,
   least scalable, most valuable part. That last mile is Terravado's home.

Note: HtAG *is* moving toward professional, client-oriented workflows (evidence packs, branded
reports, "for mortgage brokers"). But it orients the **data** to the client's strategy. It does
not model the client's **financial ability to execute** it. That line is the wedge.

## Feature-by-feature map

Terravado state noted honestly: engine built and verified, full product UI still in progress.

| Capability | HtAG | Terravado |
|---|---|---|
| Suburb/market data (150+ metrics) | **Deep — core moat** | None native (would licence) |
| Growth / ROI forecasts, heatmaps | **Deep — proprietary** | None (consumes data) |
| Suburb shortlisting around a strategy | **Strong** (Dex, GeoDex, "matched to brief") | Light (demand index / growth-driver ladder) |
| Street / listing validation, due diligence | **Yes** (StreetLens risk layers) | Partial |
| Portfolio modelling & tracking | Yes, but **score-based** (RCS) | **Deep** — full projections, IRR, equity chain |
| After-tax cashflow | No — "Cashflow RCS" score + indicative yield | **Deep** — deductibility, negative gearing, CGT |
| Depreciation (Div43 / Div40) | No | **Yes** |
| Serviceability (multi-lender) | No — "Affordability Index" metric only | **Deep** — multi-lender comparison |
| Equity chain / borrowing progression | No | **Yes** |
| Land tax (per state, per entity aggregation) | No | **Deep — distinctive** |
| Entity / ownership structuring (trust, SMSF, company) | No | **Yes** |
| Development feasibility (GST margin, residual land value) | Name only ("Deal Feasibility") | **Deep** |
| Monte Carlo / void-risk simulation | "Portfolio Stress Test" (depth unclear) | **Deep** — discrete-void MC |
| Client management / white-label reports | **Yes** (branded PDFs, share links) | Planned / partial |
| Adviser compliance (BID) evidence | "Evidence Portal" — *their* picks marked to market | Audit log + assumption snapshot — *the adviser's own* process |
| Enterprise API / MCP | **Yes** (87 endpoints) | No (not the model) |
| Coaching, community, buyers-agent directory | **Yes** (mastermind, directory) | No |
| Pricing anchor | $159–$250/mo ($1,350–$2,250/yr) | TBD |

## Where HtAG genuinely leads — don't fight these

- **Data and forecasting.** You will not out-data a data company. Licence, don't rebuild.
- **Market selection and shortlisting.** Their strategy-led ranking across 7,000+ markets is strong.
- **Enterprise distribution.** The API/MCP layer is a real business Terravado isn't in.
- **Ecosystem.** Coaching, community and a buyers-agent directory create stickiness and a moat of relationships.
- **They are shipped and charging.** Paying customers at $1,350–$2,250/yr — which also *validates* that professionals pay real money in this category.

## Terravado's defensible wedge

The client-specific financial execution layer plus professional evidence:

- What can this client **borrow** across lenders (real serviceability, not an index).
- What they can **hold** after tax (real cashflow, depreciation, land tax, CGT — not a score).
- How to **structure** it (entity, land-tax and asset-protection implications).
- Whether a **development** stacks up (feasibility with GST margin scheme, residual land value).
- Whether the **professional can prove** the recommendation met their duty (the adviser's own audit trail, not the vendor's).

This is harder to build and less scalable — which is precisely why a data company won't prioritise
it, and why it's defensible.

## Strategic implications

1. **The me-too version is dead on arrival.** Another suburb-data-plus-dashboard loses to HtAG.
   The only viable Terravado is the finance/tax/lending/compliance-depth version.
2. **Treat HtAG's API as a convenient early data source, not a long-term spine.** They're building
   into the professional layer, so depending on a competitor's feed is strategically fraught.
3. **Validate before building more.** The open question is whether professionals will pay for
   *that specific depth* HtAG doesn't give them. Worth confirming with brokers/advisers before
   heavy build.
4. **Good news in the bad news.** HtAG surviving at pro price points proves the category pays.
