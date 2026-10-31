/* ===========================================================================
   TERRAVADO — Assurance: the check suite (Layers 1 & 4)
   Two kinds of check, each naming the AUTHORITATIVE SOURCE it answers to:
     • reference-data known-answer checks — the engine must reproduce the
       published schedule exactly (expected values computed by hand from that
       schedule). These catch code regressions automatically.
     • engine-path invariants — the engine must run end-to-end and return
       finite, correctly-ordered outputs.
   The `source` on each check is where a human auditor (Layer 5) re-confirms the
   figure still matches the live source, since real rates and policies move.
   =========================================================================== */

import { TAX_DATA, TAX_DATA_2027_28, taxDataFor, fyStartYear, medicareLevy, medicareLevySurcharge, division293, vicVacantResidentialLandTax } from "../tax-data";
import { negativeGearingRestricted, smsfResidentialLeverageAllowed, dtiAssessment } from "../regime";
import { aggregateLandTax } from "../landtax";
import { modelDepreciation } from "../depreciation";
import { disposalCgt } from "../cgt";
import { firbApplicationFee, firbVacancyFeeAnnual, foreignInvestorOverlay } from "../firb";
import { seedContext } from "../seeds";
import {
  project, monteCarlo, feasibility, serviceability, valuation, equityChain,
} from "../engine";

export type CheckStatus = "pass" | "fail";

export interface CheckResult {
  id: string;
  category: string;
  description: string;
  source: string;
  expected: number | string | null;
  actual: number | string | null;
  status: CheckStatus;
}

interface CheckDef {
  id: string;
  category: string;
  description: string;
  source: string;
  run: () => { expected: number | string | null; actual: number | string | null; pass: boolean };
}

const TOL = 1e-6;
const near = (a: number, b: number, tol = TOL): boolean => Math.abs(a - b) <= tol;

/** Compact helper for a rounded known-answer reference check. */
function ref(
  id: string,
  category: string,
  description: string,
  source: string,
  expected: number,
  compute: () => number,
): CheckDef {
  return {
    id,
    category,
    description,
    source,
    run: () => {
      const actual = Math.round(compute());
      return { expected, actual, pass: actual === expected };
    },
  };
}

/* ---- Layer 1: reference-data known-answer checks ------------------------- */
const referenceChecks: CheckDef[] = [
  ref("duty-nsw-760k", "Transfer duty", "NSW duty on $760,000", "Revenue NSW — transfer duty", 28729, () => TAX_DATA.transferDuty.NSW(760000)),
  ref("duty-nsw-1m", "Transfer duty", "NSW duty on $1,000,000", "Revenue NSW — transfer duty", 39529, () => TAX_DATA.transferDuty.NSW(1000000)),
  ref("duty-vic-500k", "Transfer duty", "VIC duty on $500,000", "SRO Victoria — land transfer duty", 25070, () => TAX_DATA.transferDuty.VIC(500000)),
  ref("duty-qld-540k", "Transfer duty", "QLD duty on $540,000", "Queensland Revenue Office — transfer duty", 17325, () => TAX_DATA.transferDuty.QLD(540000)),
  ref("landtax-nsw-1_5m", "Land tax", "NSW land tax on $1.5m land value", "Revenue NSW — land tax", 6900, () => TAX_DATA.landTax.NSW(1500000)),
  ref("landtax-nsw-threshold", "Land tax", "NSW land tax at $1,075,000 threshold is nil", "Revenue NSW — land tax", 0, () => TAX_DATA.landTax.NSW(1075000)),
  ref("landtax-aggregation-effect", "Land tax", "Two NSW $800k holdings under one entity: $8,500 aggregated vs $0 standalone", "Revenue NSW — land tax aggregation",
    8500, () => aggregateLandTax([
      { id: "a", label: "A", region: "NSW", landValue: 800000, ownerKey: "e1", ownerName: "Trust", ownerKind: "Trust", deedExcludesForeign: true },
      { id: "b", label: "B", region: "NSW", landValue: 800000, ownerKey: "e1", ownerName: "Trust", ownerKind: "Trust", deedExcludesForeign: true },
    ]).totalAggregated),
  ref("landtax-nsw-trust-surcharge", "Land tax", "NSW trust (no foreign-exclusion deed) on $1m: $16,000 no-threshold surcharge", "Revenue NSW — trust land tax",
    16000, () => aggregateLandTax([{ id: "t", label: "T", region: "NSW", landValue: 1000000, ownerKey: "tr", ownerName: "Trust", ownerKind: "Trust" }]).totalAggregated),
  ref("landtax-foreign-surcharge", "Land tax", "Foreign owner, NSW $1m land: $50,000 surcharge (5%)", "Revenue NSW — foreign owner surcharge",
    50000, () => aggregateLandTax([{ id: "f", label: "F", region: "NSW", landValue: 1000000, ownerKey: "fo", ownerName: "Foreign Co", ownerKind: "Company", foreign: true }]).totalAggregated),
  ref("vic-vrlt-y1", "Land tax", "VIC Vacant Residential Land Tax: $800k CIV, year 1 → $8,000 (1%)", "SRO Victoria — VRLT",
    8000, () => vicVacantResidentialLandTax(800000, 1)),
  ref("dep-div43-2_5pct", "Depreciation", "Div 43 capital works: $320k construction, post-1987 → $8,000 year 1", "ATO — Div 43 capital works (2.5% p.a.)",
    8000, () => modelDepreciation({ mode: "assumed", constructionCost: 320000, buildYear: 2015 }, 1).rows[0].div43),
  ref("dep-div40-dv-y1", "Depreciation", "Div 40 diminishing value: $5,000 asset, 10-yr life → $1,000 year 1", "ATO — Div 40 diminishing value (200%/life)",
    1000, () => modelDepreciation({ mode: "schedule", div40: [{ name: "Asset", value: 5000, life: 10, method: "Diminishing value" }] }, 1).rows[0].div40),
  ref("cgt-individual-50pc", "CGT", "Individual, $200k gain held >12m at 39% marginal → $39,000 (50% discount)", "ATO — CGT 50% discount",
    39000, () => disposalCgt({ entityType: "individual", salePrice: 800000, purchasePrice: 600000, heldMonths: 24, marginalRatePct: 39 }).cgtPayable),
  ref("cgt-company-nodisc", "CGT", "Company, $200k gain → $60,000 (no discount, 30%)", "ATO — company CGT",
    60000, () => disposalCgt({ entityType: "company", salePrice: 800000, purchasePrice: 600000, heldMonths: 24 }).cgtPayable),
  ref("cgt-smsf-third", "CGT", "SMSF, $300k gain held >12m → $30,000 (1/3 discount, 15%)", "ATO — SMSF CGT (effective 10%)",
    30000, () => disposalCgt({ entityType: "smsf", salePrice: 900000, purchasePrice: 600000, heldMonths: 24 }).cgtPayable),
  ref("frcgw-15pc", "CGT", "Foreign resident: 15% FRCGW on $800k sale → $120,000 withheld", "ATO — FRCGW (15%, from 1 Jan 2025)",
    120000, () => disposalCgt({ entityType: "individual", salePrice: 800000, purchasePrice: 600000, heldMonths: 24, foreignResident: true }).frcgwWithheld),
  ref("firb-fee-900k", "Foreign investment", "FIRB application fee on $900,000 → $15,600", "Treasury/ATO — FIRB residential fees 2026–27",
    15600, () => firbApplicationFee(900000)),
  ref("firb-fee-2_5m", "Foreign investment", "FIRB application fee on $2,500,000 → $62,600", "Treasury/ATO — FIRB residential fees 2026–27",
    62600, () => firbApplicationFee(2500000)),
  ref("firb-fee-6m", "Foreign investment", "FIRB application fee on $6,000,000 → $156,500 (+$31,300/m above $5m)", "Treasury/ATO — FIRB residential fees 2026–27",
    156500, () => firbApplicationFee(6000000)),
  ref("firb-vacancy-900k", "Foreign investment", "Annual vacancy fee on $900,000 → $31,200 (2× fee, post-9 Apr 2024)", "ATO — vacancy fee (doubled from 9 Apr 2024)",
    31200, () => firbVacancyFeeAnnual(900000)),
  ref("firb-overlay-upfront", "Foreign investment", "Foreign buyer, new NSW $1m dwelling: FIRB $15,600 + 9% duty surcharge → $105,600 upfront", "Composite — FIRB fee + Revenue NSW surcharge duty",
    105600, () => foreignInvestorOverlay({ value: 1000000, state: "NSW", dwelling: "new", foreign: true, landValue: 600000 }).upfrontExtra),
  {
    id: "firb-established-ban", category: "Foreign investment", description: "Foreign person barred from established dwelling",
    source: "Treasury — established-dwelling ban (1 Apr 2025 – 31 Mar 2027)",
    run: () => { const ok = foreignInvestorOverlay({ value: 1000000, state: "NSW", dwelling: "established", foreign: true }).eligibility.permitted; return { expected: "not permitted", actual: ok ? "permitted" : "not permitted", pass: ok === false }; },
  },
  ref("inctax-au-100k", "Income tax", "AU income tax + Medicare on $100,000", "ATO — individual rates 2026–27", 22520, () => TAX_DATA.incomeTax.AU(100000)),
  ref("inctax-au-200k", "Income tax", "AU income tax + Medicare on $200,000", "ATO — individual rates 2026–27", 59870, () => TAX_DATA.incomeTax.AU(200000)),
  ref("medicare-phasein-30k", "Medicare", "Medicare levy low-income phase-in at $30,000 → $400", "ATO — Medicare levy thresholds (single)", 400, () => medicareLevy(30000)),
  ref("medicare-nil-25k", "Medicare", "Medicare levy nil below the threshold ($25,000)", "ATO — Medicare levy thresholds (single)", 0, () => medicareLevy(25000)),
  ref("mls-single-160k", "Medicare", "MLS: single on $160,000 without hospital cover → $2,400 (1.5%)", "ATO — Medicare Levy Surcharge (single tiers)", 2400, () => medicareLevySurcharge(160000, false)),
  ref("div293-27_5k", "Super tax", "Division 293: $300k income + $27,500 concessional → $4,125 (15%)", "ATO — Division 293 ($250k threshold)", 4125, () => division293(300000, 27500)),
  {
    id: "cgt-individual", category: "CGT", description: "Individual CGT discount = 50%",
    source: "ATO — CGT discount",
    run: () => ({ expected: 0.5, actual: TAX_DATA.cgtDiscount.individual, pass: near(TAX_DATA.cgtDiscount.individual, 0.5) }),
  },
  {
    id: "cgt-smsf", category: "CGT", description: "SMSF CGT discount = 1/3",
    source: "ATO — CGT discount (super)",
    run: () => ({ expected: "0.3333", actual: +TAX_DATA.cgtDiscount.smsf.toFixed(4), pass: near(TAX_DATA.cgtDiscount.smsf, 1 / 3) }),
  },
  {
    id: "gst-rate", category: "GST", description: "GST rate = 10%",
    source: "ATO — GST",
    run: () => ({ expected: 0.1, actual: TAX_DATA.gstRate, pass: near(TAX_DATA.gstRate, 0.1) }),
  },

  /* ---- 2027-28 regime: income tax (14% bottom bracket from 1 Jul 2027) ---- */
  ref("inctax-2728-100k", "Income tax (2027-28)", "AU income tax + Medicare on $100,000 (14% bracket)", "ATO — legislated 2027-28 scale", 22252, () => TAX_DATA_2027_28.incomeTax.AU(100000)),
  ref("inctax-2728-200k", "Income tax (2027-28)", "AU income tax + Medicare on $200,000 (14% bracket)", "ATO — legislated 2027-28 scale", 59602, () => TAX_DATA_2027_28.incomeTax.AU(200000)),

  /* ---- Tax-data versioning: the date selector picks the in-force block ---- */
  {
    id: "taxdata-select-2026", category: "Tax-data versioning", description: "taxDataFor(2026-09-01) → AU-2026-27",
    source: "Engine — effective-dated selection",
    run: () => { const v = taxDataFor("2026-09-01").version; return { expected: "AU-2026-27", actual: v, pass: v === "AU-2026-27" }; },
  },
  {
    id: "taxdata-select-2027", category: "Tax-data versioning", description: "taxDataFor(2027-08-01) → AU-2027-28",
    source: "Engine — effective-dated selection",
    run: () => { const v = taxDataFor("2027-08-01").version; return { expected: "AU-2027-28", actual: v, pass: v === "AU-2027-28" }; },
  },
  {
    id: "taxdata-select-pre-start", category: "Tax-data versioning", description: "taxDataFor(2027-06-30) still AU-2026-27 (before 1 Jul 2027)",
    source: "Engine — effective-dated selection",
    run: () => { const v = taxDataFor("2027-06-30").version; return { expected: "AU-2026-27", actual: v, pass: v === "AU-2026-27" }; },
  },
  ref("fy-start-aug", "Tax-data versioning", "FY start for 2027-08-01 is 2027", "Engine — AU financial year", 2027, () => fyStartYear("2027-08-01")),
  ref("fy-start-mar", "Tax-data versioning", "FY start for 2027-03-01 is 2026", "Engine — AU financial year", 2026, () => fyStartYear("2027-03-01")),

  /* ---- Negative gearing: the 2027-28 quarantine decision ------------------ */
  {
    id: "ng-established-restricted", category: "Negative gearing", description: "Established, acquired 2026-06-01, FY2027-28 → quarantined",
    source: "2026 Budget — NG restriction (established, post-budget-night)",
    run: () => { const r = negativeGearingRestricted({ propertyKind: "established", acquisitionDateISO: "2026-06-01", fyStartYear: 2027 }).restricted; return { expected: "restricted", actual: r ? "restricted" : "offset", pass: r === true }; },
  },
  {
    id: "ng-grandfathered", category: "Negative gearing", description: "Established, acquired 2026-02-14 (pre-budget) → offset retained",
    source: "2026 Budget — grandfathering (on/before 12 May 2026)",
    run: () => { const r = negativeGearingRestricted({ propertyKind: "established", acquisitionDateISO: "2026-02-14", fyStartYear: 2030 }).restricted; return { expected: "offset", actual: r ? "restricted" : "offset", pass: r === false }; },
  },
  {
    id: "ng-newbuild", category: "Negative gearing", description: "New build, acquired 2026-06-01 → offset retained",
    source: "2026 Budget — NG retained on new residential",
    run: () => { const r = negativeGearingRestricted({ propertyKind: "new", acquisitionDateISO: "2026-06-01", fyStartYear: 2030 }).restricted; return { expected: "offset", actual: r ? "restricted" : "offset", pass: r === false }; },
  },
  {
    id: "ng-not-yet", category: "Negative gearing", description: "Established, post-budget, FY2026-27 → not yet in force",
    source: "2026 Budget — restriction starts FY2027-28",
    run: () => { const r = negativeGearingRestricted({ propertyKind: "established", acquisitionDateISO: "2026-06-01", fyStartYear: 2026 }).restricted; return { expected: "offset", actual: r ? "restricted" : "offset", pass: r === false }; },
  },

  /* ---- CGT (2027-28): indexation + 30% floor, and the new-property election */
  ref("cgt-indexed-39", "CGT (2027-28)", "Established, $200k nominal gain, factor 1.10, 39% → $54,600 (indexed, 39% > floor)", "2026 Budget — CGT indexation",
    54600, () => disposalCgt({ entityType: "individual", salePrice: 800000, purchasePrice: 600000, heldMonths: 24, marginalRatePct: 39, cgtRegime: "indexed-floor", propertyKind: "established", indexationFactor: 1.10 }).cgtPayable),
  ref("cgt-indexed-floor-binds", "CGT (2027-28)", "Established, same gain at 20% marginal → $42,000 (30% floor binds)", "2026 Budget — CGT 30% minimum effective rate",
    42000, () => disposalCgt({ entityType: "individual", salePrice: 800000, purchasePrice: 600000, heldMonths: 24, marginalRatePct: 20, cgtRegime: "indexed-floor", propertyKind: "established", indexationFactor: 1.10 }).cgtPayable),
  ref("cgt-new-election", "CGT (2027-28)", "New property elects the lower of discount vs indexed → $39,000 (discount)", "2026 Budget — new property may elect the 50% discount",
    39000, () => disposalCgt({ entityType: "individual", salePrice: 800000, purchasePrice: 600000, heldMonths: 24, marginalRatePct: 39, cgtRegime: "indexed-floor", propertyKind: "new", indexationFactor: 1.10 }).cgtPayable),

  /* ---- SMSF residential LRBA ban (from 10 Aug 2026) ---------------------- */
  {
    id: "smsf-resi-new-banned", category: "SMSF lending", description: "New residential LRBA, contract 2026-09-01 → not allowed",
    source: "2026 — SMSF residential LRBA ban (10 Aug 2026)",
    run: () => { const ok = smsfResidentialLeverageAllowed({ assetClass: "Residential", isNewLRBA: true, contractDateISO: "2026-09-01" }).allowed; return { expected: "not allowed", actual: ok ? "allowed" : "not allowed", pass: ok === false }; },
  },
  {
    id: "smsf-commercial-ok", category: "SMSF lending", description: "Commercial (business real property) LRBA → allowed",
    source: "2026 — business real property unaffected",
    run: () => { const ok = smsfResidentialLeverageAllowed({ assetClass: "Commercial", isNewLRBA: true, contractDateISO: "2026-09-01" }).allowed; return { expected: "allowed", actual: ok ? "allowed" : "not allowed", pass: ok === true }; },
  },
  {
    id: "smsf-existing-ok", category: "SMSF lending", description: "Existing residential LRBA → grandfathered (allowed)",
    source: "2026 — existing LRBAs grandfathered",
    run: () => { const ok = smsfResidentialLeverageAllowed({ assetClass: "Residential", isNewLRBA: false }).allowed; return { expected: "allowed", actual: ok ? "allowed" : "not allowed", pass: ok === true }; },
  },

  /* ---- APRA DTI cap flag ------------------------------------------------- */
  {
    id: "dti-high-6", category: "APRA / DTI", description: "DTI 6.0× flagged as inside the capped band",
    source: "APRA — DTI ≥ 6 cap (≤20% of new lending, from 1 Feb 2026)",
    run: () => { const h = dtiAssessment(6).high; return { expected: "high", actual: h ? "high" : "ok", pass: h === true }; },
  },
  {
    id: "dti-ok-5_5", category: "APRA / DTI", description: "DTI 5.5× below the cap band",
    source: "APRA — DTI ≥ 6 cap",
    run: () => { const h = dtiAssessment(5.5).high; return { expected: "ok", actual: h ? "high" : "ok", pass: h === false }; },
  },
];

/* ---- Sample development used by the feasibility invariant ---------------- */
const sampleFeasibility = () => ({
  country: "AU", region: "NSW", landCost: 950000, landAcqCostsPct: 5.5, demolition: 35000,
  units: [{ count: 3, gfa: 150, buildRate: 2900, salePrice: 1150000 }],
  profFeesPct: 8, authorityFees: 45000, contributions: 70000, headworks: 35000,
  contingencyPct: 7, marketingPct: 1.2, sellingPct: 2.2, buildMonths: 14, sellMonths: 8,
  debtLVRpct: 65, debtLTCpct: 70, debtRate: 8.5, lineFeePct: 1.5,
  gstApplies: true, marginScheme: true, targetMarginPct: 20, holdingRatesPa: 9000,
});

/* ---- Layer 4: engine-path invariants ------------------------------------ */
function engineChecks(): CheckDef[] {
  const INV = "Engine invariant — internal consistency";
  const ctx = seedContext();
  const p = ctx.properties[0];
  const client = ctx.clients[0];
  const lender = ctx.lenders[0];

  return [
    {
      id: "proj-irr-finite", category: "Projection", description: "project() returns a finite IRR", source: INV,
      run: () => { const v = project(p, {}, ctx).metrics.irr; return { expected: "finite", actual: v, pass: v !== null && isFinite(v) }; },
    },
    {
      id: "proj-rows-10", category: "Projection", description: "10-year model produces 10 rows", source: INV,
      run: () => { const n = project(p, {}, ctx).rows.length; return { expected: 10, actual: n, pass: n === 10 }; },
    },
    {
      id: "proj-growth", category: "Projection", description: "end value exceeds purchase price", source: INV,
      run: () => { const P = project(p, {}, ctx); const pass = P.metrics.valueEnd > p.market.price; return { expected: "> price", actual: Math.round(P.metrics.valueEnd), pass }; },
    },
    {
      id: "mc-order", category: "Monte Carlo", description: "percentiles ordered p90 ≥ p50 ≥ p10", source: INV,
      run: () => {
        const mc = monteCarlo(p, { runs: 200 }, ctx);
        const pass = [mc.p10, mc.p50, mc.p90].every(isFinite) && mc.p90 >= mc.p50 && mc.p50 >= mc.p10;
        return { expected: "p90≥p50≥p10", actual: `${mc.p10} / ${mc.p50} / ${mc.p90}`, pass };
      },
    },
    {
      id: "mc-prob-bounds", category: "Monte Carlo", description: "cash-shortfall probability within 0–100%", source: INV,
      run: () => { const v = monteCarlo(p, { runs: 200 }, ctx).probCashShortfall; return { expected: "0–100", actual: v, pass: v >= 0 && v <= 100 }; },
    },
    {
      id: "feas-gr", category: "Feasibility", description: "gross realisation = sum of unit sales (3 × $1.15m)", source: INV,
      run: () => { const gr = Math.round(feasibility(sampleFeasibility()).gr); return { expected: 3450000, actual: gr, pass: gr === 3450000 }; },
    },
    {
      id: "val-blended", category: "Valuation", description: "blended valuation is positive", source: INV,
      run: () => { const v = valuation(p).blended; return { expected: "> 0", actual: Math.round(v), pass: v > 0 }; },
    },
    {
      id: "svc-capacity", category: "Serviceability", description: "borrowing capacity is finite and ≥ 0", source: INV,
      run: () => {
        const sv = serviceability(client, lender, { proposedLoan: 760000, newAnnualRent: 33000 }, ctx);
        return { expected: "≥ 0", actual: Math.round(sv.capacity), pass: isFinite(sv.capacity) && sv.capacity >= 0 };
      },
    },
    {
      id: "eq-rows-15", category: "Equity chain", description: "15-year horizon produces 15 rows", source: INV,
      run: () => { const n = equityChain({ targetPrice: 850000 }, ctx).rows.length; return { expected: 15, actual: n, pass: n === 15 }; },
    },
  ];
}

/** Run every assurance check and return structured results. */
export function runChecks(): CheckResult[] {
  const defs: CheckDef[] = [...referenceChecks, ...engineChecks()];
  return defs.map((d) => {
    let r: { expected: number | string | null; actual: number | string | null; pass: boolean };
    try {
      r = d.run();
    } catch (e) {
      r = { expected: "(ran clean)", actual: `ERROR: ${(e as Error).message}`, pass: false };
    }
    return {
      id: d.id, category: d.category, description: d.description, source: d.source,
      expected: r.expected, actual: r.actual, status: (r.pass ? "pass" : "fail") as CheckStatus,
    };
  });
}

export function summarise(results: CheckResult[]): { total: number; passed: number; failed: number } {
  const failed = results.filter((r) => r.status === "fail").length;
  return { total: results.length, passed: results.length - failed, failed };
}
