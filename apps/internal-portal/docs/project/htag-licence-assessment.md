# HtAG — is the commercial licence worth it, and what it means for Terravado

_Last updated: 26 Oct 2026. Research synthesis, not legal advice — get the API terms lawyer-reviewed before signing._

## The decisive finding

HtAG sells the **same dataset through two legally opposite licences**:

- **SaaS subscription (Clause 22) — blocks Terravado.** Licence is personal/internal-business use only; you must **not** redistribute the data or use it "to develop, train, or operate a product or service that competes with the Services." Embedding a $159–$250/mo subscription's data into Terravado would breach this. Don't go this route.
- **Commercial API licence (Clause 35) — permits exactly what you want.** Expressly grants a sublicensable licence to "use, display, incorporate, cache, redistribute, resell" the API data, to incorporate it "into your Application(s) and products," to on-sell it, and — stated outright — to build "products or services that compete with HtAG Analytics."

So if Terravado uses HtAG, it **must** be via the **Developer Portal / API**, never the subscription. On paper the API terms are unusually permissive.

## The catch — three conditions that attach to the API licence

1. **Mandatory attribution, shown to your users and passed downstream (Clause 39).** "Clear and reasonably prominent attribution to HtAG" wherever their data appears, and it must flow to anyone you share it with. In plain terms: you'd be stamping "data by HtAG" across your product — **publicly branding a competitor's engine inside Terravado**, and signposting your professional users straight to your own data source. This applies even if you only pull *raw metrics* and rank them yourself.
2. **No reverse-engineering their methodology (Clause 7).** You can *use* their raw metrics and scores; you cannot reconstruct how Dex/RCS are computed. Your plan — pull raw metrics, build your own *client-oriented* ranking — is fine, because you're not rebuilding their scores. Confirm the API exposes the raw underlying metrics (it advertises 150+), not just the finished scores.
3. **Server-side keys (Clause 36/38).** No API keys in client-side code. A browser-based Terravado must proxy HtAG calls through your own server.

## The one number that's missing

The **per-row API rate card is not public** — it's gated behind the Developer Portal (developer.htagai.com). What's known: billing is **usage-based, per row returned**, five value tiers, a **free row allowance**, volume discounts, and **no subscription or minimum spend** (startup-friendly). Linked-plan discounts: Professional tier gets 75–90% off API rates.

**To get the rate:** self-register the free Developer Portal allowance (HtAG explicitly pushes solo builders/startups to self-serve, not enterprise sales) — you see the rate card and can confirm the raw metrics without committing. This is the number that decides the unit economics; everything else is known.

## The backtest — treat as marketing, not audited fact

Methodology is described rigorously (point-in-time, no look-ahead, top decile, ~150,000 observations) and the figures check out on their pages (1-yr 17.6% vs 9.1%, 87% beat rate). But: **internally validated only** (they build the signal, the price index *and* the benchmark — no third-party audit), **growth-only** (excludes costs, rent, tax), small effective N (they use 14 years, not 3,769 picks, as the unit), 2012 rests on 15 picks, and their own whitepaper **walks back** a prior risk claim. The honest limit they disclose — edge converges with the market over a 10-year hold — confirms it's an **entry-timing** signal, not a long-hold one. Since you'd build your own ranking, their backtest matters little to you anyway.

## Credibility & data provenance

- HtAG Analytics Pty Ltd, Sydney. **Founded 2018** (~8 yrs), founders Alex Fedoseev & Matija Djolic; four named execs, small team, **no funding disclosed**.
- **Trustpilot 4.8/5 (~67 reviews, 97% 5-star)** — praised for data depth and support. The one critical review flags a **data-accuracy mismatch** vs real-estate listings. No neutral third-party reviews found (PropertyChat/Reddit silent) — reputation evidence is thin and vendor-adjacent.
- **Provenance matters:** HtAG **curates its own dataset** ("online and offline listings"), *not* reselling CoreLogic/PropTrack. Upside — it's why they can license so liberally, and you wouldn't inherit CoreLogic-style constraints. Downside — it's a derived dataset with imputation (they draw straight lines where sales are thin), which may explain the accuracy complaint. For numbers you put in front of professionals, verify accuracy before relying on it. Updates monthly.

## The verdict

**Is the licence worth it?** For getting to a validated v1 *fast*, the HtAG API is the pragmatic start: usage-based, no minimum, no CoreLogic contract, self-serve, and legally clear for embedding. Use it to prove the wedge.

**But go in eyes-open on two real costs:** the attribution requirement advertises a competitor inside your own product, and you'd depend on a direct competitor's feed — one who could change terms or build the finance layer themselves.

**The move that keeps it reversible:** build your data layer behind a clean internal interface (one abstraction, provider-agnostic), so Terravado isn't hard-wired to HtAG and you can swap to independent sources (CoreLogic/PropTrack/ABS/valuer-general, computing your own scores) later without a rebuild. Start on HtAG to move fast; design so you're never trapped on it.

**Before committing anything:** self-register the Developer Portal, read the per-row rate, and confirm raw metrics are exposed. That one number tells you whether the maths works.

Sources: [Pricing](https://www.htag.com.au/pricing/), [Terms & Conditions](https://www.htag.com.au/terms-and-conditions/), [Enterprise](https://www.htag.com.au/enterprise/), [Dex methodology](https://www.htag.com.au/dex-suburb-ranking-compare-thousands-of-suburbs-across-150-property-investment-metrics/), [Backtest article](https://www.htag.com.au/property-investment-algorithm-backtest/), [Trustpilot](https://www.trustpilot.com/review/www.htag.com.au).
