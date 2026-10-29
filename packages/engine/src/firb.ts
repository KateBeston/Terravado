/* ===========================================================================
   FOREIGN INVESTMENT — FIRB fees, eligibility & the foreign-investor overlay.
   ---------------------------------------------------------------------------
   A foreign buyer's deal is different at every stage, so this layers the extra
   cost across the lifecycle:
     • Acquisition — FIRB application fee (value-tiered) + eligibility (the ban on
       established dwellings, 1 Apr 2025 – 31 Mar 2027) + the foreign purchaser
       duty surcharge.
     • Holding — foreign land-tax surcharge + the annual vacancy fee (if the
       dwelling isn't occupied/available ≥183 days).
     • Disposal — no CGT discount, no main-residence exemption, 15% FRCGW
       (handled in the CGT engine).
   Fees are indexed annually (1 July) — maintain alongside the tax scale.
   General information, not advice.
   =========================================================================== */
import { COUNTRIES } from "./tax-data";

export type DwellingType = "new" | "established" | "vacant-land";

/** FIRB residential application fee by acquisition value (2026-27, from 1 Jul 2026). */
export function firbApplicationFee(value: number): number {
  if (value < 75000) return 4600;
  if (value <= 1_000_000) return 15600;
  if (value <= 2_000_000) return 31300;
  if (value <= 3_000_000) return 62600;
  if (value <= 4_000_000) return 93900;
  if (value <= 5_000_000) return 125200;
  const extraMillions = Math.ceil((value - 5_000_000) / 1_000_000);
  return 125200 + extraMillions * 31300; // +$31,300 per $1m above $5m
}

/** Annual vacancy fee — doubled for applications made after 9 Apr 2024, so 2×
    the application fee that applied. */
export function firbVacancyFeeAnnual(value: number): number {
  return 2 * firbApplicationFee(value);
}

export function firbEligibility(foreign: boolean, dwelling: DwellingType): { permitted: boolean; note: string } {
  if (!foreign) return { permitted: true, note: "Not a foreign person — FIRB approval not required." };
  if (dwelling === "established") return { permitted: false, note: "Foreign persons are banned from purchasing established dwellings (1 Apr 2025 – 31 Mar 2027), with limited exceptions." };
  if (dwelling === "vacant-land") return { permitted: true, note: "Vacant land — FIRB approval required; must build within 4 years." };
  return { permitted: true, note: "New dwelling — FIRB approval required." };
}

export interface ForeignOverlayInput {
  value: number;
  state: string;
  dwelling: DwellingType;
  foreign: boolean;
  landValue?: number;
  vacant?: boolean;
}
export interface ForeignOverlay {
  foreign: boolean;
  eligibility: { permitted: boolean; note: string };
  firbFee: number;              // upfront
  dutySurcharge: number;        // upfront
  upfrontExtra: number;         // FIRB fee + duty surcharge
  landTaxSurcharge: number;     // annual
  vacancyFee: number;           // annual (if vacant)
  annualExtra: number;          // land-tax surcharge + vacancy fee
  cgtNote: string;
}

/** The full foreign-investor cost overlay for a deal. Returns zeros for a
    non-foreign buyer so it can be shown unconditionally. */
export function foreignInvestorOverlay(inp: ForeignOverlayInput): ForeignOverlay {
  const C = COUNTRIES.AU;
  if (!inp.foreign) {
    return {
      foreign: false, eligibility: firbEligibility(false, inp.dwelling),
      firbFee: 0, dutySurcharge: 0, upfrontExtra: 0, landTaxSurcharge: 0, vacancyFee: 0, annualExtra: 0,
      cgtNote: "Resident owner — standard CGT treatment (50% discount if held >12 months).",
    };
  }
  const eligibility = firbEligibility(true, inp.dwelling);
  const firbFee = firbApplicationFee(inp.value);
  const dutySurcharge = C.foreignDuty(inp.state) * inp.value;
  const landTaxSurcharge = C.foreignLandTax(inp.state) * (inp.landValue ?? 0);
  const vacancyFee = inp.vacant ? firbVacancyFeeAnnual(inp.value) : 0;
  return {
    foreign: true, eligibility,
    firbFee, dutySurcharge, upfrontExtra: firbFee + dutySurcharge,
    landTaxSurcharge, vacancyFee, annualExtra: landTaxSurcharge + vacancyFee,
    cgtNote: "Foreign resident on exit: no 50% CGT discount, no main-residence exemption, and 15% withheld at settlement (FRCGW).",
  };
}
