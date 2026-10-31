# Terravado — regulatory & compliance review + the Regulatory Watch design

_Companion to `terravado-tax-legislation-review.md`. That doc covers the **tax** surface; this one covers the broader **regulatory and compliance** surface — lending/credit regulation, the regulators themselves, AML, real estate & property management, commercial property, trusts and accounting — plus best-practice principles and the design of the **fortnightly Regulatory Watch + alert system**. Reviewed Oct 2026. General information to guide the build — not legal or financial advice._

---

## 1. The regulators that touch Terravado's users

Terravado serves brokers, advisers, buyers agents, consultants and (public site) investors. The bodies whose rules and updates matter:

| Body | Remit | Why it matters to us | Monitor (newsroom / feed) |
|---|---|---|---|
| **ASIC** | Credit & financial services licensing, responsible lending, financial product advice, Best Interests Duty, DDO | The core conduct regulator for brokers/advisers; defines what "advice" vs "information" is | asic.gov.au newsroom / media releases (RSS) |
| **APRA** | Prudential standards for ADIs; macroprudential (serviceability buffer, LVR/DTI) | Sets the **3% serviceability buffer** our engine uses; lending-capacity rules | apra.gov.au news (RSS) |
| **ACCC** | Competition & Australian Consumer Law; misleading conduct; unfair contract terms | Advertising, representations, "best investment" claims, unfair terms in agreements | accc.gov.au media releases (RSS) |
| **AUSTRAC** | AML/CTF | **Tranche 2 (from 1 Jul 2026)** brings real estate agents, conveyancers, accountants, lawyers, trust/company service providers into scope — directly hits our user base | austrac.gov.au news |
| **ATO / TPB** | Tax; tax & BAS agent regulation | All of the tax doc; TPB registers tax agents; "tax (financial) advice" boundary | ato.gov.au newsroom + legislation; tpb.gov.au |
| **RBA** | Monetary policy (cash rate) | Drives interest rates → serviceability & modelling assumptions | rba.gov.au media releases (RSS) |
| **AFCA** | External dispute resolution | Credit licensees must be members | afca.org.au |
| **State Consumer Affairs / Fair Trading / Revenue Offices** | Real estate agent licensing, trust accounts, tenancy, underquoting, duty & land tax | Per-state licensing + the duty/land-tax scales (tax doc) | each state body's news |
| **OAIC** | Privacy Act / APPs | We hold client finances — privacy obligations | oaic.gov.au |
| **MFAA / FBAA** | Broker industry associations | Membership, CPD, codes of practice | industry feeds |

---

## 2. Lending & credit regulation (best practice)

- **NCCP Act 2009 + National Credit Code** — anyone providing credit assistance needs an **Australian Credit Licence (ACL)** or to be a **credit representative**. Terravado is a **modelling/origination tool**, not a licensee — its outputs are information that a licensed broker uses; keep that perimeter explicit.
- **Responsible lending (ASIC RG 209)** — reasonable inquiries into requirements/objectives and financial situation, **verify**, and assess the loan is **"not unsuitable."** (The Westpac "wagyu and shiraz" case clarified HEM use.) Terravado's serviceability engine should mirror this: real income/expense capture, HEM floor, buffered assessment.
- **APRA macroprudential** — the **mortgage serviceability buffer remains at 3.0%** (confirmed held through 2025); plus interest-rate floors and the ability to impose **LVR/DTI limits**. Our engine already applies a lender buffer + HEM; keep the 3% default and make it a maintained parameter. _(Update Oct 2026: APRA added a DTI cap — ≤20% of a lender's new loans at DTI ≥ 6 — from 1 Feb 2026; see the tax doc §0.5.)_
- **Best Interests Duty (BID)** — since **1 Jan 2021**, mortgage brokers must act in the client's **best interests**, prioritise the client over conflicts, and meet conflicted-remuneration rules. Terravado can *support* BID (documented, data-backed recommendations) but must not *be* the adviser.
- **Design & Distribution Obligations (DDO)** — target market determinations for credit products.
- **Comprehensive Credit Reporting (CCR)**, anti-hawking, disclosure documents (Credit Guide, Credit Proposal/Quote).
- **Posture:** Terravado is "information and modelling," not "credit assistance," unless operated by a licensed broker within their own obligations. The public site especially needs the general-information perimeter.

---

## 3. AML/CTF — Tranche 2 (NEW, live from 1 July 2026)

Australia's **Tranche 2 AML/CTF reforms** extend the regime beyond banks to **real estate agents, conveyancers, accountants, lawyers and trust/company service providers**, with customer due diligence (CDD/KYC) and AUSTRAC enrolment obligations **commencing 1 July 2026**. This directly affects Terravado's user base and is both:
- a **compliance watch item** (the first thing the Regulatory Watch should track), and
- a **feature opportunity** — CDD/KYC support, source-of-funds capture, and risk flags could be a genuine value-add for agents/advisers now caught by the regime.

---

## 4. Real estate & property management — STATE

- **Agent licensing** per state (Fair Trading / Consumer Affairs); **statutory trust accounts** with strict rules; CPD requirements.
- **Residential Tenancy Acts** (per state) — tenant/landlord rights, bonds, rent-increase frequency/notice, minimum standards, ending tenancies, repairs. A property-management module must **localise per state**.
- **Underquoting laws** — price guides and evidence (NSW, VIC especially); **ACL** misleading-conduct rules on advertising.
- **Property management operations** — trust accounting, routine inspections, maintenance, arrears, tenancy management — a natural Terravado module adjacent to the property record.

---

## 5. Commercial real estate

- **Retail Leases Acts** (per state) — mandatory **disclosure statements**, minimum terms, outgoings rules, bans on certain ratchet clauses, dispute processes.
- **Tax differs:** commercial supplies are **taxable for GST** (not input-taxed like residential); **no PPOR/land-tax exemption**; lease incentives, make-good, and outgoings modelling.
- **Valuation** by cap rate / net operating income — Terravado's **feasibility engine already models commercial cap-rate** mechanics; the regulatory and lease overlay is the gap.

---

## 6. Trusts

- **Trust deed governs**; trustee duties; discretionary vs unit vs SMSF.
- **Land-tax surcharges** — NSW discretionary trust loses the threshold and attracts the foreign surcharge **unless the deed irrevocably excludes foreign persons**; VIC absentee-trust surcharge. (Capture a **deed-excludes-foreign** flag on the entity record — already recommended in the tax doc.)
- **s100A** reimbursement agreements; **Division 7A** (loans from a related company); **vesting dates**; family trust elections and streaming.
- **Foreign-person status** drives duty surcharge, land-tax surcharge, FIRB and vacancy fee (tax doc §1.3).

---

## 7. Accounting & the advice boundary

- **TPB** registers **tax agents**; providing tax advice for a fee generally requires registration. "**Tax (financial) advice**" sits at the ATO/TPB/ASIC intersection.
- **Financial product advice** requires an **AFSL** and adviser professional standards; **SMSF property advice is financial product advice** — Terravado must **flag, not advise**.
- **The boundary principle:** Terravado is a **tool that informs licensed professionals** (brokers, accountants, advisers) and gives investors **general information**. It does not itself give personal credit, tax or financial-product advice. Every module that edges toward a recommendation carries the general-information perimeter and points to a licensed professional.

---

## 8. Best-practice principles (bake these in)

1. **Provenance on every figure** — source + effective date, shown in reports (already the posture).
2. **General information, not advice** — per-module disclaimers; the advice perimeter above.
3. **Assurance** — known-answer checks gated in CI (40 today; grow with each rate/rule).
4. **Privacy** — Privacy Act / APPs: we hold client finances; RLS, least-privilege, consent, retention limits (already RLS-enforced).
5. **Maintained, versioned data layer** — the single source of truth for every rate/rule (tax doc §0).
6. **Responsible-lending alignment** — real capture + verification + buffered assessment, mirroring RG 209.

---

## 9. The Regulatory Watch & Alert system — design

**What's wanted:** fortnightly checks of the regulators' sites for updates (legislation, media releases, articles) across tax, lending/financial services, real estate, property management, commercial property, trusts and accounting — with an **alert system in the portal** that surfaces changes.

**Architecture (same honest pattern as ABS/CDR — runs live on Vercel, degrades gracefully):**

- **`regulatory_sources` registry** — one row per source: body, category (tax / lending / real-estate / AML / property-management / commercial / trusts / accounting), and a **monitorable URL**, preferring **RSS/Atom feeds** (ASIC, APRA, ACCC, RBA all publish them) and falling back to newsroom/media-release pages (AUSTRAC, ATO newsroom, state revenue offices, TPB, state fair trading). RSS is far more robust to parse than scraping HTML.
- **Watcher endpoint + schedule** — a route (e.g. `/api/regwatch`) that fetches each source, extracts items (title, published date, url, summary), and **diffs against the last-seen set**. Run it **fortnightly via Vercel Cron** (the deployed-app equivalent of a scheduled task; the build sandbox can't reach these sites, Vercel can).
- **`regulatory_alerts` table** (tenant- or platform-scoped) — new/changed items become alert rows: source, category, title, url, published date, status (new / acknowledged). RLS as usual.
- **Portal surfacing** — a **"Regulatory Watch"** section (its own page, or folded into Data Sources) listing recent alerts with category filters; a **badge in the nav** when unacknowledged alerts exist; mark-as-read; link out to the source article. Optionally email/push on new high-priority items.
- **Seeding** — ship the sources registry pre-populated with the bodies in §1 and their feeds, each tagged by category, so it works on first deploy.
- **Honest limits** — it surfaces *that something changed and links to it*; it does not interpret the law. Interpretation and any engine/rate update stays a human-reviewed step (which then flows through the versioned tax-data layer and its assurance checks). That keeps the "fact, with provenance" discipline intact.

**Build sizing:** this is its own subsystem (migration + sources registry + fetch/diff route + alerts UI + cron). Recommend building it as a focused increment. It also pairs naturally with the **Data Sources** section already in the portal.

---

## 10. Build sequencing (across both review docs)

1. ✅ **Income tax → 2026-27** (done — correctness).
2. ✅ **CGT / disposal engine** (tax doc §3) — built.
3. **`AU-2027-28` regime** (tax doc §0.5) — the 2026-budget structural changes; new top priority.
4. **Regulatory Watch + alert system** (§9) — the fortnightly monitor + in-portal alerts.
5. **Lending-regulation parameters** — surface the 3% buffer, DTI≥6 cap, HEM, BID support as maintained settings.
6. **Registration fees; land-tax completeness** (tax doc §7).
7. **AML/CDD support** (§3) — ride the Tranche-2 obligation as a feature.
8. **Property-management & commercial overlays** (§4–5) — localised, as modules mature.

---

### Sources (key, current as at Oct 2026)
- APRA mortgage serviceability buffer held at 3%; DTI cap (≤20% of new loans at DTI ≥ 6) from 1 Feb 2026 — APRA.
- AML/CTF **Tranche 2** reforms (real estate agents, accountants, lawyers; CDD from 1 Jul 2026) — AUSTRAC / Attorney-General's Department.
- Best Interests Duty for mortgage brokers (from 1 Jan 2021) — ASIC RG 273 / NCCP.
- Responsible lending — ASIC RG 209. Consumer law & unfair contract terms — ACCC / ACL.
- See `terravado-tax-legislation-review.md` for the tax surface and sources.
