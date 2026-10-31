# Terravado — backlog & working to-do (the running log)

_The single place that tracks what's done, what's in flight, and everything recommended-but-not-yet-built across the whole project. Maintained as we go, so when we pick one avenue the other options from that step aren't lost. Updated 1 Nov 2026._

Status key: ✅ done · 🔨 in progress · ⬜ to do · 💤 parked (deliberate).

---

## A. Legislation / engine — the tax & rules layer

### Done
- ✅ Income tax → 2026-27 scale; Medicare levy + low-income phase-in; MLS; Division 293.
- ✅ Full CGT / disposal engine (discount by entity, main-residence + 6-yr, carried losses, FRCGW).
- ✅ Div 43 + Div 40 depreciation (incl. 9 May 2017 second-hand rule); effective lives.
- ✅ Land tax per state **with aggregation**; NSW trust no-threshold surcharge; foreign land-tax surcharge; VIC VRLT.
- ✅ FIRB / foreign-investor overlay (fees, established-dwelling ban, surcharge duty + land tax, vacancy fee).
- ✅ **AU-2027-28 regime** (1 Nov 2026): date-selected tax-data block; negative-gearing quarantine (date + new/established aware); CGT indexation + 30% floor + new-property election + 1 Jul 2027 straddle; SMSF residential-LRBA ban; APRA DTI≥6 flag; 14% bottom bracket. Projection exit-CGT wired to it. UI dwelling-type toggle drives it.
- ✅ **LITO** (low-income tax offset) — applied in both scale versions (non-refundable, nil above ~$66,667).
- ✅ **Registration/transfer fees per state** — `registrationFeesTotal()` + opt-in acquisition component (off by default to avoid double-counting a manual line) + form checkbox.
- ✅ **Borrowing-cost 5-year amortisation (s25-25)** — `borrowingCostAmortisation()` + `loan.borrowingCosts` field (deducted over 5 yrs, or the term if shorter).
- ✅ **Vacant-land holding-cost denial (s26-102)** — `tax.vacantLand` flag denies holding-cost deductions until a usable structure exists + is rented.

### To do (recommended, not yet built)
- ⬜ **VIC land-tax completeness** — the VIC **trust surcharge scale** and **absentee trust** surcharge (needs the SRO Victoria trust scale; not faked). The VIC COVID-debt levy ($50k threshold) is effectively embedded in the current VIC scale but is **not time-bounded to 2024–2033**.
- ⬜ **Year-aware land tax** — so temporary levies (VIC COVID) and scale changes reproduce by FY like the income-tax blocks do.
- ⬜ **Repairs vs capital improvements** classification (s25-10 immediate vs Div 43 / cost base; cf. TR 2021/D5).
- ⬜ **GST withholding at settlement** (developer cashflow — purchaser withholds 1/11th or 7% margin).
- ⬜ **SMSF guardrails** — in-house asset 5% cap, NALI (45%), sole-purpose warnings (flag, don't advise).
- ⬜ **FHB duty concessions** — keep all states current; first-class "duty on land only" (off-the-plan/H&L) switch.
- ⬜ **FHSS / Home Guarantee Scheme hooks; build-to-rent** concessions. (Niche.)

---

## B. Regulatory / compliance

- ⬜ **Regulatory Watch + alert system** — fortnightly source monitor (RSS/newsroom), `regulatory_sources` registry, fetch/diff route on Vercel Cron, `regulatory_alerts` table + in-portal surfacing. (Own subsystem.)
- ⬜ Lending-regulation parameters as **maintained settings** (3% buffer, DTI cap, HEM, BID support).
- ⬜ **AML/CDD (Tranche 2)** support as a feature (CDD/KYC, source-of-funds, risk flags).
- ⬜ Property-management & commercial-lease overlays (localised per state).

---

## C. Investment strategies module (specced 31 Oct)
- ⬜ Build the staff-facing strategy/climate layer per `terravado-investment-strategies-module.md` — strategy catalogue + SWOT, climate tagging off the versioned levers, "model this" hook into the Modeller. (After the engine is regime-correct — now unblocked.)

---

## D. Platform / product

- ⬜ **Portfolio roll-up** — native aggregation of a client's holdings + saved runs.
- ⬜ **Real data wiring** — CDR product data; property-data providers (VG / ABS / Geoscape / CoreLogic); Domain listings. Provider-agnostic seam already scaffolded.
- ⬜ **Property-matching engine** — client fit → ranked areas → properties (the wedge).
- ⬜ **LIXI / lodgement integration** — deal export → ApplyOnline / Simpology (BD-gated).
- ⬜ **Account model** build order: capability gating per persona → broker-on-team role → external guest deal-sharing (cross-tenant, RLS; build last, carefully).
- ⬜ **Bank data (Open Banking)** — build sandbox flow now; representative go-live later. Near-term: statement-upload tier (no accreditation needed).
- ⬜ **Developer stock & advisor module** — stock foundation (developments + lots + PDF) → matching → advisor business tooling (commission calc, revenue tracker, deal pipeline).
- ⬜ **Public / B2C-lite lead-funnel site** (phase two).
- ⬜ **Admin console** — rule/rate-block config + audit sign-off.
- 💤 Project Marketing / Stock Visibility Platform — parked (separate product, different buyer).
- 💤 Property-management referral network partnership — parked (after core validated).

---

## E. Security (from the hardening pass)

- ✅ Next.js CVE bump; Supabase stack upgrade (ssr 0.12.7 + supabase-js 2.118.0); central auth gate (fail-closed) + middleware relocation fix.
- ⬜ **Security headers** — CSP, HSTS, frame-ancestors, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- ⬜ **Supabase leaked-password protection** toggle (dashboard).
- ⬜ Callback-redirect tidy.
- ⬜ **Kate to do:** manual login round-trip on both deployed apps (middleware now runs live for the first time).

---

## F. Accuracy & assurance (safeguards doc)

- ✅ Known-answer suite in CI (now **66**, growing) + engine-path invariants.
- ⬜ Tie each assertion to its **authoritative source**; Ash / an accountant sign off a set of "golden" cases. (Note: registration-fee figures are indicative placeholders — verify per state LRS.)
- ⬜ Surface the **assumption + data-version stamp** on client-facing outputs (not just internally).
- ⬜ **Input validation** at the boundary (reject implausible LVR/yield/income).
- ⬜ Documented **rate-update process** with domain-expert sign-off before a new block goes live.
- ⬜ Scheduled re-verification; independent sign-off on high-stakes engines; data-source freshness checks.
- ⬜ Assurance checks for the opt-in engine flags wired into project() (vacant-land denial; borrowing-cost deduction in a full projection).

---

## G. Ops / docs

- ⬜ Keep project docs ↔ `apps/internal-portal/docs/project/` repo copies in sync on every change.
- ⬜ Optional: a staff-only `/docs` viewer page in the portal that renders these markdown docs.
- ⬜ Validation: Ash / Dino wedge-validation conversations; aggregator/lodgement partner talks; Quickli if pursued.
