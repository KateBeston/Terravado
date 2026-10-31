# Terravado — Australian property tax & legislation review

_A comprehensive catalogue of the tax rules and legislation that touch **buying, holding and selling** residential investment property in Australia, mapped to what Terravado's engine already models and what's still to build. Reviewed Oct 2026; **updated 31 Oct 2026 for the 12 May 2026 Federal Budget and the SMSF residential-borrowing ban**. General information to guide the build — not tax advice._

---

## 0.5 — ⚠️ THE 2026 STRUCTURAL SHIFT (current priority)

The 12 May 2026 Federal Budget and the mid-2026 super changes are the biggest reshaping of property-investment tax since the 1999 CGT discount. They are **structural** changes (new rule shapes, not just new numbers), so they need a new engine version — a forthcoming **`AU-2027-28`** — with date-aware, grandfathered rules sitting beside the current `AU-2026-27`. Critically: **the big tax changes bite from 1 July 2027, but the SMSF borrowing ban and the APRA DTI cap are already live**, so the current-FY engine stays correct while the new regime is built against its start dates.

**1. Negative gearing — restricted, from 1 July 2027.**
- Going forward it is **limited to new residential builds**. For **established** dwellings bought *after* budget night (12 May 2026), rental losses can no longer offset wage/salary income — they are **quarantined**, carried forward against future rental income or capital gains only.
- **Grandfathered:** anything held before 12 May 2026 keeps the current rules.
- _Engine need:_ a date-and-type-aware negative-gearing rule (new-build vs established × acquired before/after 12 May 2026 × hold vs 1 Jul 2027 start) that decides whether a loss offsets other income or is quarantined.

**2. CGT discount — replaced, from 1 July 2027.**
- The flat **50% discount is replaced** by an inflation-indexed (cost-base indexation) model, with a **30% minimum effective tax rate** on real gains for established property. New property can elect **either** the 50% discount **or** the indexed model. Gains accrued **before** 1 Jul 2027 stay under the old rules (a dual system during transition). Main-residence exemption unchanged. SMSFs excluded (accumulation keeps the 1/3 discount; retirement phase keeps its exemptions).
- _Engine need:_ a `cgtRules` block that, by sale date and property type, applies either the 50% discount or indexation-plus-30%-floor, and splits a gain straddling 1 Jul 2027 across both regimes.

**3. SMSF residential borrowing (LRBAs) — banned, LIVE from 10 August 2026.**
- **New** LRBAs to acquire **residential** property are banned (Royal Assent 26 Jun 2026; commenced 10 Aug 2026; a 45-day transition protected contracts signed before commencement). **Existing** residential LRBAs are grandfathered and may be refinanced. **Business real property** LRBAs are still allowed. Non-borrowed SMSF residential ownership is unaffected.
- _Engine need:_ disable SMSF residential **leverage** for new deals in serviceability/feasibility (an SMSF buyer can no longer gear a new residential purchase); keep business-real-property borrowing; keep existing LRBAs modellable.

**4. APRA lending — tighter (live).**
- **DTI cap (from 1 Feb 2026):** no more than **20% of a lender's new loans** at debt-to-income **≥ 6**. **Serviceability buffer held at 3%.** Together these squeeze exactly the leveraged investor deal — the backdrop to the current "lenders are gun-shy / postcode declines" market.
- _Engine need:_ reflect the DTI≥6 constraint and the 3% buffer in the serviceability engine, and surface a DTI flag on a deal.

**Why this matters strategically:** every property-investment calculator built before May 2026 (PIA, spreadsheets, the lot) now gives **wrong** answers — they still assume the 50% CGT discount and unrestricted negative gearing. A tool that models the post-2026 rules correctly is a genuine, current differentiator. This is the versioned engine + regulatory-watch architecture doing exactly the job it was designed for.

---

## 0. The meta-point: this is a maintained, versioned data layer — not hard-coded numbers

The PIA changelog is the clearest possible brief: almost every release is _"updated tax scales / Medicare / stamp duty (per state) / land tax (per state) / registration fees / effective lives."_ The legislation itself rarely changes shape; the **rates and thresholds move at least annually, often mid-year, and independently per state**. So the single most important architectural truth is:

> Every rate and threshold lives in **one versioned data layer**, dated by financial year, with prior versions retained for historical reproducibility — never scattered as literals through the engine.

Terravado already does this: `src/lib/engine/tax-data.ts`, versioned `AU-2026-27`, with per-state functions for duty and land tax and prior versions retained. The work is to **widen its coverage, keep it current, and add the `AU-2027-28` regime (§0.5)**, backing every figure with a known-answer assurance check so a wrong update is caught in CI (we currently have 40 such checks).

**Recommended maintenance cadence (the PIA discipline, formalised):**
- **Each July** — update federal income tax scales, Medicare levy + thresholds, Medicare Levy Surcharge, Division 293, LITO, effective-life reviews.
- **After each state budget** — update that state's stamp duty scale, FHB thresholds, land tax scale + surcharges, and title/mortgage registration fees.
- **Ad hoc** — legislated future changes (see §6) diarised against their start dates — the 1 Jul 2027 NG/CGT changes above are the current headline items.
- Every stored figure carries a **source + effective date** (provenance), surfaced in reports.

---

## 1. ACQUISITION — buying

### 1.1 Transfer (stamp) duty — **STATE**
Progressive ad valorem duty on the dutiable value (contract price or market value, whichever is higher).
- **Have:** `transferDuty` per state (NSW, VIC, QLD, WA, SA, TAS, ACT, NT).
- **First home buyer concessions/exemptions** — thresholds and taper per state, changed frequently. **Have (partial):** `fhbConcession`. **Need:** keep all states current.
- **Off-the-plan / house-and-land** — duty on **land value only** where the building contract is separate and entered before construction. **Have:** manual duty override. **Need:** a first-class "duty on land only" switch.
- **Foreign purchaser additional duty:** NSW ~8–9%, VIC 8%, QLD 8%, WA 7%, SA 7%, TAS 8%, ACT 4%, NT nil. **Have:** `foreignDuty` per state, wired to the owner's foreign flag.
- **Corporate/trustee surcharges** and concessions (pensioner, deceased estate, family farm) — **Need:** case flags where relevant.
- **State notes:** **ACT** has largely abolished conveyance duty (phasing into higher general rates / land tax); don't apply a standard duty scale there without checking the current year.

### 1.2 Title transfer & mortgage registration fees — **STATE**
Fixed or lightly-scaled government fees on registering the transfer and the mortgage.
- **Need:** a `registrationFees` table per state (transfer fee + mortgage registration fee), small dollar amounts but real acquisition costs that belong in the cash-in and the cost base.

### 1.3 Foreign Investment Review Board (FIRB) — **FEDERAL**
- Foreign persons generally need **FIRB approval** to buy residential property; **application fees scale with value**.
- **Ban on foreign persons buying _established_ dwellings: 1 April 2025 → 31 March 2027** (limited exceptions). New dwellings and vacant land for development remain allowed subject to approval.
- **Annual vacancy fee** for foreign owners whose dwelling is not occupied or available to rent ≥183 days/year.
- **Have (built):** a foreign-person flag drives FIRB application fees, the established-dwelling ban check, surcharge duty, surcharge land tax and the vacancy fee — the foreign-investor overlay.

### 1.4 Acquisition items that feed later calculations
- **Cost-base builders (for CGT):** duty, legals, buyer's-agent fee, building & pest, search fees, improvements.
- **Borrowing costs** (loan application, LMI, mortgage registration, valuation, lender's legals) — **deductible over 5 years** or the loan term if shorter (s25-25). **Need:** 5-year borrowing-cost amortisation (engine currently treats LMI as capitalised).

---

## 2. HOLDING — owning & renting

### 2.1 Rental income — **FEDERAL**
Assessable in full; **apportioned for any private use**; holiday-letting and "available but not genuinely for rent" rules.

### 2.2 Deductions — **FEDERAL**
- **Interest / negative gearing** — deductible against other income for **individuals & partnerships**; **losses trapped** in companies, trusts and SMSFs. **Have:** `taxProfile` encodes this per entity type. **⚠️ Changing from 1 Jul 2027 — see §0.5:** losses on post-12-May-2026 established dwellings become quarantined even for individuals.
- **Repairs & maintenance** (immediate, s25-10) **vs capital improvements** (Div 43 or cost base). PIA cites **TR 2021/D5** on house-and-land. **Need:** a repairs-vs-capital classification.
- **Vacant-land holding-cost denial (s26-102, from 1 July 2019):** interest, rates and land tax on **vacant land are not deductible** until a substantial, usable structure exists and is rented/available. **Need:** a vacant-land flag.
- **Other deductible holding costs:** council & water rates, insurance, strata, property-management fees, land tax, letting fees, pest/garden, depreciation. **Have.**

### 2.3 Depreciation — **FEDERAL**
- **Div 43 capital works** — 2.5% p.a. straight line over 40 years, construction after 15 Sep 1987. **Have:** full depreciation modeller.
- **Div 40 plant & equipment** — by effective life. **Second-hand plant denied for residential from 9 May 2017 (s40-27).** **Have.**
- **Effective lives** — ATO reviews periodically. **Have:** `effectiveLives` table.

### 2.4 Land tax — **STATE**
Annual tax on **unimproved land value**, **aggregated per owner per state**. PPOR exempt.
- **Have:** land tax per state **and** the aggregation engine (the most commonly missed line).
- **Foreign/absentee owner surcharge.** **Have:** `foreignLandTax`.
- **Trust surcharge / no-threshold:** NSW discretionary trusts lose the threshold unless the deed excludes foreign persons. **Have:** NSW trust surcharge wired to the deed-excludes-foreign flag; **Need:** VIC absentee trust surcharge.
- **Vacant Residential Land Tax (VIC):** statewide from 1 Jan 2025, escalating 1%→2%→3%. **Have:** `vicVacantResidentialLandTax`.
- **VIC "COVID-debt" temporary land-tax surcharge (2024–2033):** threshold dropped to **$50,000**. **Need:** reflect in the VIC scale for the affected years.
- **ACT:** land tax on all rented residential property with **no threshold**. **Have (partial):** ACT no-threshold treatment.
- **QLD:** interstate aggregation was **shelved** — do not model it. **NT:** no land tax.

### 2.5 Medicare, surcharge & Division 293 — **FEDERAL**
- **Medicare levy 2%** with **low-income thresholds**. **Have:** phased low-income thresholds.
- **Medicare Levy Surcharge (MLS) 1–1.5%** on higher earners without private hospital cover. **Have:** `medicareLevySurcharge`.
- **Division 293 — extra 15%** on concessional super contributions above **$250,000** income+contributions. **Have:** `division293`.

### 2.6 Income tax scales & offsets — **FEDERAL**
- **2026-27 resident scale (current FY):** nil to $18,200; **15%** $18,201–45,000; 30% $45,001–135,000; 37% $135,001–190,000; 45% $190,001+. **Have:** engine updated to `AU-2026-27`.
- **Legislated further cut: 14% from 1 July 2027** — diarise into `AU-2027-28`.
- **Low Income Tax Offset (LITO)** — up to $700. **Need.**

---

## 3. DISPOSAL — selling

### 3.1 Capital Gains Tax — **FEDERAL**
- **Gain = capital proceeds − cost base.** **50% discount** (individuals/trusts, held >12m); **1/3** (SMSF); **none** (company). **⚠️ Replaced from 1 Jul 2027 — see §0.5** (indexation + 30% floor for established property; election for new property; SMSFs retain the 1/3 discount).
- **Cost base**, **main residence exemption** + **6-year absence rule**, **capital losses** offset before the discount. **Have:** the disposal/CGT engine (`cgt.ts`) covers cost base, discount by entity, main-residence (full/partial), carried losses, FRCGW.

### 3.2 Foreign Resident Capital Gains Withholding (FRCGW) — **FEDERAL**
- **From 1 Jan 2025: 15% withholding, NO price threshold, ALL sales.** Clearance certificate or the purchaser withholds 15%. **Have:** modelled in `cgt.ts`.

### 3.3 GST on sale — **FEDERAL**
- **Existing residential:** input-taxed, no GST. **New residential / potential residential land:** GST (1/11th, or margin scheme). **Have:** margin scheme in the feasibility engine.
- **GST withholding at settlement (from 1 Jul 2018):** purchaser withholds 1/11th (or 7% margin scheme). **Need:** reflect in developer cashflow at settlement.

### 3.4 Selling costs
Agent commission, marketing, conveyancing → reduce net proceeds and feed the CGT calc. **Have.**

---

## 4. ENTITY & STRUCTURE OVERLAY (cross-cutting)

The same property is taxed differently by owner. **Have:** `taxProfile` differentiates these.
- **Individual / joint:** marginal rates; negative-gearing offset (changing 1 Jul 2027, §0.5); 50% CGT discount.
- **Company:** flat **25%/30%**; no CGT discount; losses trapped.
- **Trust:** distributed to beneficiaries at their rates; losses trapped; s100A risk; NSW foreign land-tax surcharge unless the deed excludes foreign persons. **Have (partial).**
- **SMSF:** **15%** income (0% pension), **1/3 CGT discount**. **⚠️ New residential LRBAs banned 10 Aug 2026 (§0.5).** Structural rules: in-house asset 5% cap, NALI (45%), sole-purpose test. **Need:** LRBA/NALI guardrails and warnings (SMSF property advice is financial-product advice — flag, don't advise).

---

## 5. SUPERANNUATION TOUCHPOINTS
- **Division 293** (§2.5). **Have.**
- **New residential SMSF borrowing banned (§0.5).**
- **Contribution caps**, **First Home Super Saver Scheme**, **Home Guarantee Scheme** — informational flags + deposit/serviceability hooks. **Need.**

---

## 6. RECENT & UPCOMING CHANGES TO DIARISE (2024–2027)

| Date | Change | Jurisdiction | Engine status |
|---|---|---|---|
| 9 May 2017 | Second-hand plant depreciation denied (residential) | Federal | modelled |
| 1 Jul 2019 | Vacant-land holding-cost deductions denied (s26-102) | Federal | **gap** |
| 1 Jan 2025 | FRCGW → 15%, threshold removed, all sales | Federal | modelled |
| 1 Jan 2025 | VIC Vacant Residential Land Tax statewide | VIC | modelled |
| 2024–2033 | VIC COVID-debt land-tax surcharge ($50k threshold) | VIC | **gap** |
| 1 Apr 2025 – 31 Mar 2027 | Foreign ban on established dwellings | Federal | modelled |
| 1 Feb 2026 | **APRA DTI cap: ≤20% of new loans at DTI ≥ 6** | Federal (APRA) | **gap — serviceability** |
| 1 Jul 2026 | Lowest bracket 16% → 15% | Federal | modelled (AU-2026-27) |
| **10 Aug 2026** | **SMSF new residential LRBAs banned** | Federal | **gap — AU-2027-28** |
| **1 Jul 2027** | **Negative gearing limited to new builds; established post-12-May-2026 losses quarantined** | Federal | **gap — AU-2027-28** |
| **1 Jul 2027** | **CGT 50% discount replaced by indexation + 30% floor (established)** | Federal | **gap — AU-2027-28** |
| 1 Jul 2027 | Lowest bracket 15% → 14% | Federal | diarise — AU-2027-28 |
| Ongoing | State duty/land-tax scales, FHB thresholds, registration fees, effective lives, Medicare thresholds | All | annual |

---

## 7. HAVE vs NEED — and the build priority

**Already in the engine:** per-state transfer duty; FHB concessions (partial); foreign purchaser duty surcharge; per-state land tax **with aggregation**; foreign land-tax surcharge; NSW trust surcharge; VIC VRLT; income tax + marginal rates (**2026-27**); Medicare levy thresholds + MLS + Division 293; GST + margin scheme (feasibility); **full CGT/disposal engine** (discount by entity, main-residence, losses, FRCGW); Div 43 + Div 40 depreciation with the 2017 rule; effective lives; **FIRB/foreign-investor overlay**; entity-aware treatment. **40 assurance checks.**

**Gaps, in recommended build order:**
1. **`AU-2027-28` regime (§0.5)** — the new top priority: date-aware negative-gearing quarantining (new-build vs established × acquisition date), CGT indexation + 30% floor with the dual-regime split, SMSF residential-LRBA ban in serviceability/feasibility, APRA DTI≥6 cap, 14% bottom bracket. _(Large, high value, timely.)_
2. **Registration/transfer fees per state** — acquisition-cost completeness. _(Small.)_
3. **Land-tax completeness** — VIC COVID levy, VIC absentee trust surcharge. _(Medium.)_
4. **Borrowing-cost 5-year amortisation; vacant-land holding-cost denial; repairs-vs-capital.** _(Medium.)_
5. **GST withholding at settlement.** _(Medium.)_
6. **SMSF guardrails** — in-house/NALI/sole-purpose warnings (flag, don't advise). _(Medium.)_
7. **LITO; First Home Super Saver / Home Guarantee hooks; build-to-rent.** _(Small / niche.)_

---

## 8. Architecture recommendations

- **Keep one versioned `TAX_DATA` per financial year**; add `AU-2027-28` with the §0.5 rules as **effective-dated** logic so the old and new regimes coexist and the engine picks the right one by date (this is what gives grandfathering and transition for free).
- **Two kinds of change, two mechanisms:** *parametric* (rate/threshold moves) = data edit + assurance re-check; *structural* (new rule shape, e.g. NG quarantining, CGT indexation) = regulatory-watch alert → human build-out. Design for the first, rely on the alert-and-build loop for the second.
- **Drive rules off record flags:** entity type, foreign-person status, deed-excludes-foreign, PPOR/6-year, vacant land, **new-vs-established**, **acquisition date**, held-in-SMSF — captured on the contact/entity/property records so the right rules fire automatically.
- **Extend assurance:** one known-answer check per new bracket/threshold/rule.
- **Provenance everywhere:** every figure stamped with source + effective date.
- **Compliance perimeter:** **general information, not tax or financial-product advice** — keep the disclaimer; treat SMSF/structuring outputs as flags for a licensed professional, especially on the public site.

---

### Sources (key, current as at 31 Oct 2026)
- 2026 Federal Budget — negative gearing & CGT changes (from 1 Jul 2027): ABC News (12 May 2026); PIPA Federal Budget 2026 summary; Acumentis budget analysis.
- SMSF residential LRBA ban (commenced 10 Aug 2026): MFAA; SMSF Adviser.
- APRA DTI cap (≤20% of new loans at DTI ≥ 6, from 1 Feb 2026) & 3% serviceability buffer: APRA; Money Magazine.
- FRCGW (15%, no threshold, 1 Jan 2025); foreign ban on established dwellings (1 Apr 2025 – 31 Mar 2027); depreciation (Div 43/40, 2017 rule); CGT; GST withholding; s26-102 — ATO / FIRB / Treasury.
- VIC VRLT & COVID-debt levy — SRO Victoria.
_Exact per-state duty/land-tax brackets and registration fees are maintained in `tax-data.ts` per financial year against each revenue office's published scale. Secondary sources (brokers/valuers/property bodies) give the shape of the 2026 budget changes; confirm the exact mechanics against ATO/Treasury primary sources before hard-coding `AU-2027-28`._
