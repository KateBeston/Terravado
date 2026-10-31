# Terravado — Australian property tax & legislation review

_A comprehensive catalogue of the tax rules and legislation that touch **buying, holding and selling** residential investment property in Australia, mapped to what Terravado's engine already models and what's still to build. Reviewed Oct 2026; updated 31 Oct 2026 for the 12 May 2026 Federal Budget and the SMSF residential-borrowing ban. **Engine updated 1 Nov 2026 — the AU-2027-28 regime is now built** (date-aware negative gearing, CGT indexation + 30% floor, SMSF residential-LRBA ban, APRA DTI flag). General information to guide the build — not tax advice._

---

## 0.5 — ✅ THE 2026 STRUCTURAL SHIFT (now built in the engine)

The 12 May 2026 Federal Budget and the mid-2026 super changes are the biggest reshaping of property-investment tax since the 1999 CGT discount. They are **structural** changes (new rule shapes, not just new numbers), and they are **now implemented as the `AU-2027-28` engine regime (built 1 Nov 2026)** — a future-dated tax-data block selected by date beside the current `AU-2026-27`, with date-aware, grandfathered rules. The big tax changes bite from 1 July 2027, but the SMSF borrowing ban and the APRA DTI cap are already live, so the current-FY engine stays correct while the new regime waits on its start dates. _(The property form's new-vs-established toggle + purchase-date field drive the regime — built 1 Nov 2026.)_

**1. Negative gearing — restricted, from 1 July 2027. ✅ Built.**
- Going forward it is **limited to new residential builds**. For **established** dwellings bought *after* budget night (12 May 2026), rental losses can no longer offset wage/salary income — they are **quarantined**, carried forward against future rental income or capital gains only.
- **Grandfathered:** anything held before 12 May 2026 keeps the current rules.
- _Engine: built_ — `negativeGearingRestricted()` decides per deal from the new-build/established flag, acquisition date and the modelled FY; `project()` applies it in the loss branch (quarantined losses stop crediting the holder's other income from FY2027-28). Records without a post-budget purchase date are unaffected.

**2. CGT discount — replaced, from 1 July 2027. ✅ Built.**
- The flat **50% discount is replaced** by an inflation-indexed (cost-base indexation) model, with a **30% minimum effective tax rate** on real gains for established property. New property can elect **either** the 50% discount **or** the indexed model. Gains accrued **before** 1 Jul 2027 stay under the old rules (a dual system during transition). Main-residence exemption unchanged. SMSFs excluded (accumulation keeps the 1/3 discount; retirement phase keeps its exemptions).
- _Engine: built_ — `disposalCgt()` gains an opt-in `"indexed-floor"` regime (indexed cost base + 30% minimum effective rate), the **new-property election** (takes the lower of discount vs indexed), and a time-apportioned **pre/post 1 Jul 2027 straddle split**. SMSFs keep the 1/3 discount; the default discount path is unchanged.

**3. SMSF residential borrowing (LRBAs) — banned, LIVE from 10 August 2026. ✅ Built.**
- **New** LRBAs to acquire **residential** property are banned (Royal Assent 26 Jun 2026; commenced 10 Aug 2026; a 45-day transition protected contracts signed before commencement). **Existing** residential LRBAs are grandfathered and may be refinanced. **Business real property** LRBAs are still allowed. Non-borrowed SMSF residential ownership is unaffected.
- _Engine: built_ — `smsfResidentialLeverageAllowed()` encodes the rule (residential new LRBA → not allowed; business real property and existing LRBAs → allowed); the verdict flags a geared SMSF residential deal.

**4. APRA lending — tighter (live). ✅ DTI flag built.**
- **DTI cap (from 1 Feb 2026):** no more than **20% of a lender's new loans** at debt-to-income **≥ 6**. **Serviceability buffer held at 3%.** Together these squeeze exactly the leveraged investor deal — the backdrop to the current "lenders are gun-shy / postcode declines" market.
- _Engine: built (flag)_ — `serviceability()` returns a DTI≥6 flag (`dtiHigh`) and the verdict surfaces it; the 3% buffer was already applied. (A portfolio-level 20%-of-new-lending model is a lender-side concern, not a per-deal one.)

**Why this matters strategically:** every property-investment calculator built before May 2026 (PIA, spreadsheets, the lot) now gives **wrong** answers — they still assume the 50% CGT discount and unrestricted negative gearing. A tool that models the post-2026 rules correctly is a genuine, current differentiator. This is the versioned engine + regulatory-watch architecture doing exactly the job it was designed for — and it is now the thing most competitors can't do.

---

## 0. The meta-point: this is a maintained, versioned data layer — not hard-coded numbers

The PIA changelog is the clearest possible brief: almost every release is _"updated tax scales / Medicare / stamp duty (per state) / land tax (per state) / registration fees / effective lives."_ The legislation itself rarely changes shape; the **rates and thresholds move at least annually, often mid-year, and independently per state**. So the single most important architectural truth is:

> Every rate and threshold lives in **one versioned data layer**, dated by financial year, with prior versions retained for historical reproducibility — never scattered as literals through the engine.

Terravado already does this: `src/lib/engine/tax-data.ts`, versioned `AU-2026-27` with `AU-2027-28` now beside it and a `taxDataFor(date)` selector, per-state functions for duty and land tax, and prior versions retained. The work is to **keep it current and widen its coverage**, backing every figure with a known-answer assurance check so a wrong update is caught in CI (we currently have **66** such checks, grown from 40 as the AU-2027-28 regime, LITO, registration fees and borrowing-cost amortisation were added).

**Recommended maintenance cadence (the PIA discipline, formalised):**
- **Each July** — update federal income tax scales, Medicare levy + thresholds, Medicare Levy Surcharge, Division 293, LITO, effective-life reviews.
- **After each state budget** — update that state's stamp duty scale, FHB thresholds, land tax scale + surcharges, and title/mortgage registration fees.
- **Ad hoc** — legislated future changes (see §6) diarised against their start dates. The 1 Jul 2027 NG/CGT changes are built and future-dated; confirm the exact mechanics against ATO/Treasury primary sources as the legislation finalises.
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
- **Have (opt-in):** `registrationFees` per state + `registrationFeesTotal()`, added to the acquisition cash-in and cost base when the "auto registration fees" flag is set (off by default so it doesn't double-count a manual line). Figures are indicative — verify per state LRS.

### 1.3 Foreign Investment Review Board (FIRB) — **FEDERAL**
- Foreign persons generally need **FIRB approval** to buy residential property; **application fees scale with value**.
- **Ban on foreign persons buying _established_ dwellings: 1 April 2025 → 31 March 2027** (limited exceptions). New dwellings and vacant land for development remain allowed subject to approval.
- **Annual vacancy fee** for foreign owners whose dwelling is not occupied or available to rent ≥183 days/year.
- **Have (built):** a foreign-person flag drives FIRB application fees, the established-dwelling ban check, surcharge duty, surcharge land tax and the vacancy fee — the foreign-investor overlay.

### 1.4 Acquisition items that feed later calculations
- **Cost-base builders (for CGT):** duty, legals, buyer's-agent fee, building & pest, search fees, improvements.
- **Borrowing costs** (loan application, LMI, mortgage registration, valuation, lender's legals) — **deductible over 5 years** or the loan term if shorter (s25-25). **Have (opt-in):** `borrowingCostAmortisation()` deducts a `loan.borrowingCosts` figure over 5 years (or the term if shorter).

---

## 2. HOLDING — owning & renting

### 2.1 Rental income — **FEDERAL**
Assessable in full; **apportioned for any private use**; holiday-letting and "available but not genuinely for rent" rules.

### 2.2 Deductions — **FEDERAL**
- **Interest / negative gearing** — deductible against other income for **individuals & partnerships**; **losses trapped** in companies, trusts and SMSFs. **Have:** `taxProfile` encodes this per entity type. **✅ 2027-28 restriction built (§0.5):** losses on post-12-May-2026 established dwellings are quarantined from FY2027-28 even for individuals.
- **Repairs & maintenance** (immediate, s25-10) **vs capital improvements** (Div 43 or cost base). PIA cites **TR 2021/D5** on house-and-land. **Need:** a repairs-vs-capital classification.
- **Vacant-land holding-cost denial (s26-102, from 1 July 2019):** interest, rates and land tax on **vacant land are not deductible** until a substantial, usable structure exists and is rented/available. **Have (opt-in):** a `tax.vacantLand` flag denies holding-cost deductions in the projection while set.
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
- **2026-27 resident scale (current FY):** nil to $18,200; **15%** $18,201–45,000; 30% $45,001–135,000; 37% $135,001–190,000; 45% $190,001+. **Have:** engine on `AU-2026-27`.
- **Legislated further cut: 14% from 1 July 2027** — **✅ built** in `AU-2027-28` (date-selected).
- **Low Income Tax Offset (LITO)** — up to $700. **Have:** `lowIncomeTaxOffset()` applied in both scale versions (non-refundable, nil above ~$66,667).

---

## 3. DISPOSAL — selling

### 3.1 Capital Gains Tax — **FEDERAL**
- **Gain = capital proceeds − cost base.** **50% discount** (individuals/trusts, held >12m); **1/3** (SMSF); **none** (company). **✅ 2027-28 regime built (§0.5):** from 1 Jul 2027 established property moves to indexation + a 30% minimum effective rate; new property may elect the discount; SMSFs retain the 1/3 discount.
- **Cost base**, **main residence exemption** + **6-year absence rule**, **capital losses** offset before the discount. **Have:** the disposal/CGT engine (`cgt.ts`) covers cost base, discount by entity, main-residence (full/partial), carried losses, FRCGW, **and now the indexed-floor regime + new-property election + straddle split**.

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
- **Individual / joint:** marginal rates; negative-gearing offset (restricted from 1 Jul 2027, §0.5 — built); 50% CGT discount (indexed-floor from 1 Jul 2027, built).
- **Company:** flat **25%/30%**; no CGT discount; losses trapped.
- **Trust:** distributed to beneficiaries at their rates; losses trapped; s100A risk; NSW foreign land-tax surcharge unless the deed excludes foreign persons. **Have (partial).**
- **SMSF:** **15%** income (0% pension), **1/3 CGT discount**. **✅ New residential LRBA ban built (§0.5).** Structural rules still to model: in-house asset 5% cap, NALI (45%), sole-purpose test. **Need:** NALI/in-house guardrails and warnings (SMSF property advice is financial-product advice — flag, don't advise).

---

## 5. SUPERANNUATION TOUCHPOINTS
- **Division 293** (§2.5). **Have.**
- **New residential SMSF borrowing banned (§0.5).** **✅ Built.**
- **Contribution caps**, **First Home Super Saver Scheme**, **Home Guarantee Scheme** — informational flags + deposit/serviceability hooks. **Need.**

---

## 6. RECENT & UPCOMING CHANGES TO DIARISE (2024–2027)

| Date | Change | Jurisdiction | Engine status |
|---|---|---|---|
| 9 May 2017 | Second-hand plant depreciation denied (residential) | Federal | modelled |
| 1 Jul 2019 | Vacant-land holding-cost deductions denied (s26-102) | Federal | **built (opt-in flag)** |
| 1 Jan 2025 | FRCGW → 15%, threshold removed, all sales | Federal | modelled |
| 1 Jan 2025 | VIC Vacant Residential Land Tax statewide | VIC | modelled |
| 2024–2033 | VIC COVID-debt land-tax surcharge ($50k threshold) | VIC | **gap (not year-bounded)** |
| 1 Apr 2025 – 31 Mar 2027 | Foreign ban on established dwellings | Federal | modelled |
| 1 Feb 2026 | APRA DTI cap: ≤20% of new loans at DTI ≥ 6 | Federal (APRA) | **built (flag)** |
| 1 Jul 2026 | Lowest bracket 16% → 15% | Federal | modelled (AU-2026-27) |
| 10 Aug 2026 | SMSF new residential LRBAs banned | Federal | **built (AU-2027-28)** |
| 1 Jul 2027 | Negative gearing limited to new builds; established post-12-May-2026 losses quarantined | Federal | **built (AU-2027-28)** |
| 1 Jul 2027 | CGT 50% discount replaced by indexation + 30% floor (established) | Federal | **built (AU-2027-28)** |
| 1 Jul 2027 | Lowest bracket 15% → 14% | Federal | **built (AU-2027-28)** |
| Ongoing | State duty/land-tax scales, FHB thresholds, registration fees, effective lives, Medicare thresholds | All | annual |

---

## 7. HAVE vs NEED — and the build priority

**Already in the engine:** per-state transfer duty; FHB concessions (partial); foreign purchaser duty surcharge; per-state land tax **with aggregation**; foreign land-tax surcharge; NSW trust surcharge; VIC VRLT; income tax + marginal rates (**2026-27**); Medicare levy thresholds + MLS + Division 293; GST + margin scheme (feasibility); **full CGT/disposal engine** (discount by entity, main-residence, losses, FRCGW); Div 43 + Div 40 depreciation with the 2017 rule; effective lives; **FIRB/foreign-investor overlay**; entity-aware treatment; **and the full `AU-2027-28` regime** — date-aware negative-gearing quarantining, CGT indexation + 30% floor with the new-property election and 1 Jul 2027 straddle split, SMSF residential-LRBA ban, APRA DTI≥6 flag, 14% bottom bracket; the dwelling-type UI that drives the regime; **LITO; per-state registration fees (opt-in); borrowing-cost 5-year amortisation (opt-in); vacant-land holding-cost denial (opt-in).** **66 assurance checks.**

**Gaps, in recommended build order:**
1. **Land-tax completeness** — the VIC trust surcharge scale + absentee trust surcharge (needs the SRO Victoria scale); year-aware land tax so temporary levies (VIC COVID) reproduce by FY. _(Medium.)_
2. **Repairs vs capital improvements** classification (s25-10 vs Div 43 / cost base). _(Medium.)_
3. **GST withholding at settlement.** _(Medium.)_
4. **SMSF guardrails** — in-house/NALI/sole-purpose warnings (flag, don't advise). _(Medium.)_
5. **First Home Super Saver / Home Guarantee hooks; build-to-rent.** _(Small / niche.)_

_(The live cross-project backlog is `terravado-backlog.md`.)_

---

## 8. Architecture recommendations

- **Keep one versioned `TAX_DATA` per financial year** — now `AU-2026-27` and `AU-2027-28`, selected by date, so the old and new regimes coexist and the engine picks the right one (this is what gives grandfathering and transition for free). Add future FYs the same way.
- **Two kinds of change, two mechanisms:** *parametric* (rate/threshold moves) = data edit + assurance re-check; *structural* (new rule shape, e.g. NG quarantining, CGT indexation) = regulatory-watch alert → human build-out. The AU-2027-28 regime is the first worked example of the structural path.
- **Drive rules off record flags:** entity type, foreign-person status, deed-excludes-foreign, PPOR/6-year, vacant land, **new-vs-established**, **acquisition date**, held-in-SMSF — captured on the contact/entity/property records so the right rules fire automatically. (New/established + acquisition date are now surfaced on the property form, driving the rules.)
- **Extend assurance:** one known-answer check per new bracket/threshold/rule — now 66.
- **Provenance everywhere:** every figure stamped with source + effective date.
- **Compliance perimeter:** **general information, not tax or financial-product advice** — keep the disclaimer; treat SMSF/structuring outputs as flags for a licensed professional, especially on the public site.

---

### Sources (key, current as at 31 Oct 2026)
- 2026 Federal Budget — negative gearing & CGT changes (from 1 Jul 2027): ABC News (12 May 2026); PIPA Federal Budget 2026 summary; Acumentis budget analysis.
- SMSF residential LRBA ban (commenced 10 Aug 2026): MFAA; SMSF Adviser.
- APRA DTI cap (≤20% of new loans at DTI ≥ 6, from 1 Feb 2026) & 3% serviceability buffer: APRA; Money Magazine.
- FRCGW (15%, no threshold, 1 Jan 2025); foreign ban on established dwellings (1 Apr 2025 – 31 Mar 2027); depreciation (Div 43/40, 2017 rule); CGT; GST withholding; s26-102 — ATO / FIRB / Treasury.
- VIC VRLT & COVID-debt levy — SRO Victoria.
_Exact per-state duty/land-tax brackets and registration fees are maintained in `tax-data.ts` per financial year against each revenue office's published scale. The AU-2027-28 regime is built against the budget's announced mechanics; confirm the exact rules against ATO/Treasury primary sources as the legislation finalises before relying on client-facing output._
