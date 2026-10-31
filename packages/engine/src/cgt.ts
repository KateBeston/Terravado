/* ===========================================================================
   CAPITAL GAINS TAX — disposal engine (FEDERAL)
   ---------------------------------------------------------------------------
   Computes the CGT on selling an investment property, by entity type:
     • Capital proceeds = sale price − selling costs.
     • Cost base = purchase price + acquisition costs + capital improvements +
       non-deductible (third-element) holding costs − capital-works deductions
       claimed (Div 43 reduces the cost base).
     • Main residence exemption (full, or partial via the 6-year absence rule).
     • Net against carried-forward capital losses BEFORE the discount.
     • Discount: 50% individuals/trusts, 1/3 SMSF, nil company — only if held
       >12 months and the owner is not a foreign resident.
     • CGT payable at the owner's marginal rate (individual/trust-distributed),
       30% (company) or 15% (SMSF).
     • Foreign resident: no discount, no main-residence exemption, and 15%
       Foreign Resident Capital Gains Withholding (FRCGW) is withheld at
       settlement as a credit against the liability (from 1 Jan 2025, no
       threshold).
   General information, not tax advice. The hard cost-base and exemption facts
   belong on the property record; this engine does the maths on them.
   =========================================================================== */

export type CgtEntity = "individual" | "joint" | "company" | "trust" | "smsf";

export interface DisposalInputs {
  entityType: CgtEntity;
  salePrice: number;
  sellingCosts?: number;        // agent, marketing, legals (absolute)
  purchasePrice: number;
  acquisitionCosts?: number;    // duty, legals, buyer's agent
  capitalImprovements?: number;
  thirdElementHoldingCosts?: number; // non-deductible rates/interest added to cost base
  capitalWorksClaimed?: number; // Div 43 deductions claimed → reduce cost base
  heldMonths: number;
  marginalRatePct?: number;     // owner's marginal rate incl Medicare (individual/trust)
  companyRatePct?: number;      // default 30
  isMainResidence?: boolean;
  mainResidenceExemptFraction?: number; // 0..1 (1 = fully exempt; partial via 6-year rule)
  priorCapitalLosses?: number;
  foreignResident?: boolean;
  /* --- 2027-28 regime (opt-in; omitting these = the pre-2027 50%-discount
     behaviour, byte-for-byte) -------------------------------------------- */
  cgtRegime?: "discount" | "indexed-floor"; // default "discount"
  propertyKind?: "new" | "established";     // "new" may elect the 50% discount
  indexationFactor?: number;                // indexed cost base = cost base × factor (CPI_sale / CPI_acq)
  minEffectiveRatePct?: number;             // floor on the real gain (default 30)
  acquisitionDateISO?: string;              // for the pre/post 1-Jul-2027 straddle split
  saleDateISO?: string;                     // for the straddle split
  regimeStartISO?: string;                  // default "2027-07-01"
}

export interface DisposalResult {
  capitalProceeds: number;
  costBase: number;
  grossGain: number;            // proceeds − cost base (can be negative = loss)
  capitalLoss: number;          // positive when a loss is made this disposal
  mainResidenceExempt: number;
  lossesApplied: number;
  gainAfterLossesAndExempt: number;
  discountPct: number;
  discountAmount: number;
  taxableGain: number;
  cgtPayable: number;
  frcgwWithheld: number;        // credited against cgtPayable for foreign residents
  netProceedsAfterCgt: number;  // capitalProceeds − cgtPayable
  effectiveCgtRatePct: number;  // cgtPayable / grossGain
  regimeApplied: string;        // which CGT method produced the figure
  notes: string[];
}

const money = (v: number) => (v < 0 ? "-$" : "$") + Math.abs(Math.round(v)).toLocaleString("en-AU");
const r2 = (v: number) => Math.round(v * 100) / 100;

export function disposalCgt(inp: DisposalInputs): DisposalResult {
  const notes: string[] = [];
  const sellingCosts = inp.sellingCosts ?? 0;
  const capitalProceeds = inp.salePrice - sellingCosts;

  const costBase =
    inp.purchasePrice
    + (inp.acquisitionCosts ?? 0)
    + (inp.capitalImprovements ?? 0)
    + (inp.thirdElementHoldingCosts ?? 0)
    - (inp.capitalWorksClaimed ?? 0);

  const grossGain = capitalProceeds - costBase;
  if ((inp.capitalWorksClaimed ?? 0) > 0) notes.push(`Cost base reduced by ${money(inp.capitalWorksClaimed ?? 0)} of capital-works (Div 43) deductions claimed`);

  // Capital loss case — no discount; carries forward.
  if (grossGain <= 0) {
    const capitalLoss = -grossGain;
    notes.push(`Capital loss of ${money(capitalLoss)} — carries forward to offset future capital gains (no CGT payable)`);
    return {
      capitalProceeds, costBase, grossGain, capitalLoss, mainResidenceExempt: 0, lossesApplied: 0,
      gainAfterLossesAndExempt: 0, discountPct: 0, discountAmount: 0, taxableGain: 0, cgtPayable: 0,
      frcgwWithheld: inp.foreignResident ? r2(inp.salePrice * 0.15) : 0,
      netProceedsAfterCgt: capitalProceeds, effectiveCgtRatePct: 0, regimeApplied: "capital loss", notes,
    };
  }

  // Main residence exemption (removed for foreign residents from 2020).
  let mainResidenceExempt = 0;
  if (inp.isMainResidence && !inp.foreignResident) {
    const frac = Math.max(0, Math.min(1, inp.mainResidenceExemptFraction ?? 1));
    mainResidenceExempt = grossGain * frac;
    if (frac >= 1) notes.push("Main residence — fully exempt from CGT");
    else notes.push(`Main residence — ${Math.round(frac * 100)}% exempt (partial / 6-year rule); ${money(grossGain - mainResidenceExempt)} assessable`);
  } else if (inp.isMainResidence && inp.foreignResident) {
    notes.push("Main residence exemption not available to foreign residents (removed from 2020)");
  }
  const afterExempt = grossGain - mainResidenceExempt;

  // Prior capital losses applied BEFORE the discount.
  const lossesApplied = Math.min(inp.priorCapitalLosses ?? 0, Math.max(0, afterExempt));
  if (lossesApplied > 0) notes.push(`Applied ${money(lossesApplied)} of carried-forward capital losses before the discount`);
  const gainAfterLossesAndExempt = Math.max(0, afterExempt - lossesApplied);

  // CGT discount eligibility (common to both regimes).
  const heldOver12m = inp.heldMonths >= 12;
  const discountEligible = heldOver12m && !inp.foreignResident && inp.entityType !== "company";
  const companyRate = inp.companyRatePct ?? 30;
  const marginal = inp.marginalRatePct ?? 39;
  const floorPct = inp.minEffectiveRatePct ?? 30;
  const exemptFrac = grossGain > 0 ? mainResidenceExempt / grossGain : 0;

  const cgtOnTaxable = (taxable: number): number =>
    inp.entityType === "company" ? taxable * companyRate / 100
      : inp.entityType === "smsf" ? taxable * 15 / 100
        : taxable * marginal / 100;

  // The pre-2027 regime: 50% (1/3 SMSF) discount, nil company / foreign.
  const discountPath = (gainNet: number) => {
    const dp = discountEligible ? (inp.entityType === "smsf" ? 100 / 3 : 50) : 0;
    const taxable = gainNet - gainNet * dp / 100;
    return { discountPct: dp, taxableGain: taxable, cgtPayable: cgtOnTaxable(taxable) };
  };

  // The 2027-28 regime for ESTABLISHED property: cost-base indexation, no 50%
  // discount, and a 30% minimum effective rate on the real gain. SMSFs keep the
  // 1/3 discount (excluded from the change); companies are unchanged.
  const indexedPath = () => {
    const factor = inp.indexationFactor ?? 1;
    const indexedCostBase = costBase * factor;
    const realGross = Math.max(0, capitalProceeds - indexedCostBase);
    const realNet = Math.max(0, realGross * (1 - exemptFrac) - lossesApplied);
    if (inp.entityType === "smsf") { const taxable = realNet - realNet * (100 / 3) / 100; return { discountPct: 100 / 3, taxableGain: taxable, cgtPayable: taxable * 15 / 100, realNet }; }
    if (inp.entityType === "company") return { discountPct: 0, taxableGain: realNet, cgtPayable: realNet * companyRate / 100, realNet };
    const eff = Math.max(marginal, floorPct);
    return { discountPct: 0, taxableGain: realNet, cgtPayable: realNet * eff / 100, realNet };
  };

  const regime = inp.cgtRegime ?? "discount";
  let chosen: { discountPct: number; taxableGain: number; cgtPayable: number; realNet?: number };
  let regimeApplied: string;

  if (regime === "discount") {
    if (!heldOver12m) notes.push("Held under 12 months — no CGT discount");
    else if (inp.foreignResident) notes.push("Foreign resident — no CGT discount (removed for gains after 8 May 2012)");
    else if (inp.entityType === "company") notes.push("Company — no CGT discount");
    else notes.push(`${inp.entityType === "smsf" ? "SMSF — 1/3" : "50%"} CGT discount (held >12 months)`);
    chosen = discountPath(gainAfterLossesAndExempt);
    regimeApplied = "50% discount (pre-2027)";
  } else {
    const idx = indexedPath();
    const disc = discountPath(gainAfterLossesAndExempt);
    const start = inp.regimeStartISO ?? "2027-07-01";
    // Gain straddling 1 Jul 2027: time-apportion between the two methods.
    if (inp.acquisitionDateISO && inp.saleDateISO && inp.acquisitionDateISO < start && inp.saleDateISO > start) {
      const a = +new Date(inp.acquisitionDateISO), s = +new Date(inp.saleDateISO), st = +new Date(start);
      const preFrac = Math.max(0, Math.min(1, (st - a) / Math.max(1, s - a))), postFrac = 1 - preFrac;
      chosen = {
        discountPct: 0,
        taxableGain: disc.taxableGain * preFrac + idx.taxableGain * postFrac,
        cgtPayable: disc.cgtPayable * preFrac + idx.cgtPayable * postFrac,
        realNet: idx.realNet,
      };
      regimeApplied = `straddle: ${Math.round(preFrac * 100)}% discount / ${Math.round(postFrac * 100)}% indexed+${floorPct}% floor`;
      notes.push(`Gain straddles 1 Jul 2027 — time-apportioned: ${Math.round(preFrac * 100)}% under the 50% discount, ${Math.round(postFrac * 100)}% under indexation + ${floorPct}% floor (approximation; confirm the apportionment basis).`);
    } else {
      chosen = idx;
      regimeApplied = `indexation + ${floorPct}% floor`;
      notes.push(`Established dwelling — 50% discount replaced from 1 Jul 2027 by indexation + a ${floorPct}% minimum effective rate on the real gain.`);
    }
    // New property may elect the better of the discount or the above.
    if (inp.propertyKind === "new") {
      if (disc.cgtPayable <= chosen.cgtPayable) { chosen = disc; regimeApplied = "new-property election: 50% discount"; notes.push("New property — elected the 50% discount (lower CGT than indexation)."); }
      else notes.push("New property — indexation + floor gives a lower CGT than the 50% discount; indexed method applied.");
    }
  }

  const discountPct = chosen.discountPct;
  const taxableGain = chosen.taxableGain;
  const discountAmount = Math.max(0, gainAfterLossesAndExempt - taxableGain);
  let cgtPayable = chosen.cgtPayable;

  const frcgwWithheld = inp.foreignResident ? r2(inp.salePrice * 0.15) : 0;
  if (inp.foreignResident) notes.push(`Foreign Resident Capital Gains Withholding: 15% of the sale price (${money(frcgwWithheld)}) withheld at settlement, credited against the CGT above`);

  return {
    capitalProceeds, costBase, grossGain, capitalLoss: 0, mainResidenceExempt, lossesApplied,
    gainAfterLossesAndExempt, discountPct: r2(discountPct), discountAmount: r2(discountAmount),
    taxableGain: r2(taxableGain), cgtPayable: r2(cgtPayable), frcgwWithheld,
    netProceedsAfterCgt: r2(capitalProceeds - cgtPayable),
    effectiveCgtRatePct: grossGain > 0 ? r2((cgtPayable / grossGain) * 100) : 0,
    regimeApplied,
    notes,
  };
}

/** Map an entity record's kind to a CGT entity class. */
export function cgtEntityOf(kind?: string): CgtEntity {
  const k = (kind ?? "").toLowerCase();
  if (k.includes("smsf") || k.includes("super")) return "smsf";
  if (k.includes("company")) return "company";
  if (k.includes("trust")) return "trust";
  if (k.includes("joint")) return "joint";
  return "individual";
}
