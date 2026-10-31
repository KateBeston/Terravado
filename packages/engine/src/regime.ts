/* ===========================================================================
   2026-BUDGET REGIME RULES — pure, date- and flag-driven decisions (FEDERAL)
   ---------------------------------------------------------------------------
   The three *structural* changes the engine has to decide on a per-deal basis:

     1. Negative gearing — from FY2027-28, rental losses on ESTABLISHED
        dwellings acquired AFTER budget night (12 May 2026) can no longer offset
        other (wage/salary) income; they are quarantined and carried forward.
        NEW residential retains the offset. Anything acquired on/before budget
        night is grandfathered.

     2. SMSF residential borrowing — new LRBAs to acquire RESIDENTIAL property
        are banned from 10 Aug 2026. Business real property (commercial) LRBAs
        are unaffected; existing LRBAs are grandfathered.

     3. APRA DTI cap — lenders may write no more than ~20% of new loans at a
        debt-to-income ratio ≥ 6, so a DTI ≥ 6 deal faces fewer lenders and
        pricing/overlay scrutiny (a flag, not an absolute block).

   These are decisions, not dollar figures: they return "does the rule bite?"
   with a plain-English reason, so the projection, serviceability and verdict
   layers can apply them and explain them. Dates and the FY trigger live in the
   versioned tax-data block (see `negativeGearing` / `cgtRegime`).
   General information, not advice.
   =========================================================================== */

export type PropertyKind = "new" | "established";
export type RegimeEntity = "individual" | "joint" | "company" | "trust" | "smsf";

const BUDGET_NIGHT_ISO = "2026-05-12";     // negative-gearing grandfathering line
const SMSF_LRBA_BAN_ISO = "2026-08-10";    // residential LRBA commencement
const NG_FY_START = 2027;                  // first FY-start year the NG restriction applies
export const APRA_DTI_HIGH = 6;            // APRA 20%-of-new-lending cap threshold

/* --- 1. Negative gearing ------------------------------------------------- */
export interface NegativeGearingInput {
  propertyKind?: PropertyKind;        // defaults to "established"
  acquisitionDateISO?: string;        // undefined → treated as grandfathered (no change)
  fyStartYear: number;                // the FY-start year being assessed
  budgetNightISO?: string;            // override (from the tax-data block)
  ngFyStart?: number;                 // override (from the tax-data block)
}
export interface NegativeGearingResult {
  restricted: boolean;                // true → loss cannot offset other income this FY
  reason: string;
}

/** Decide whether a rental loss is quarantined (can't offset other income) for
    the given property and financial year under the 2027-28 restriction. */
export function negativeGearingRestricted(inp: NegativeGearingInput): NegativeGearingResult {
  const kind = inp.propertyKind ?? "established";
  const budgetNight = inp.budgetNightISO ?? BUDGET_NIGHT_ISO;
  const fyTrigger = inp.ngFyStart ?? NG_FY_START;

  if (kind === "new") {
    return { restricted: false, reason: "New residential — negative-gearing offset against other income retained." };
  }
  if (!inp.acquisitionDateISO) {
    return { restricted: false, reason: "No acquisition date on record — treated as pre-budget (grandfathered); offset retained." };
  }
  if (inp.acquisitionDateISO <= budgetNight) {
    return { restricted: false, reason: `Acquired on/before budget night (${budgetNight}) — grandfathered; offset retained.` };
  }
  if (inp.fyStartYear < fyTrigger) {
    return { restricted: false, reason: `Restriction starts FY${fyTrigger}-${(fyTrigger + 1) % 100} — offset still available this year.` };
  }
  return {
    restricted: true,
    reason: `Established dwelling acquired after budget night (${budgetNight}): from FY${fyTrigger}-${(fyTrigger + 1) % 100} rental losses are quarantined — carried forward against future rental income or capital gains, not offset against other income.`,
  };
}

/* --- 2. SMSF residential borrowing (LRBA) -------------------------------- */
export interface SmsfLeverageInput {
  assetClass?: string;                // "Residential" | "Commercial" (business real property)
  isNewLRBA?: boolean;                // defaults true (modelling a new borrowing)
  contractDateISO?: string;           // defaults to undefined → treated as new/at-ban
  banDateISO?: string;
}
export interface SmsfLeverageResult {
  allowed: boolean;
  reason: string;
}

/** Can an SMSF borrow (LRBA) to acquire this asset? Residential new LRBAs are
    banned from 10 Aug 2026; commercial/business real property and existing
    LRBAs are unaffected. */
export function smsfResidentialLeverageAllowed(inp: SmsfLeverageInput): SmsfLeverageResult {
  const ban = inp.banDateISO ?? SMSF_LRBA_BAN_ISO;
  const isNew = inp.isNewLRBA ?? true;
  const residential = (inp.assetClass ?? "Residential").toLowerCase().startsWith("resid");

  if (!residential) {
    return { allowed: true, reason: "Business real property (commercial) — SMSF borrowing (LRBA) still permitted." };
  }
  if (!isNew) {
    return { allowed: true, reason: "Existing LRBA — grandfathered; may continue and be refinanced." };
  }
  if (inp.contractDateISO && inp.contractDateISO < ban) {
    return { allowed: true, reason: `Contract dated before the ban (${ban}) — permitted under transition.` };
  }
  return {
    allowed: false,
    reason: `New LRBAs to acquire residential property are banned from ${ban}. Fund the purchase with SMSF cash, or use business real property.`,
  };
}

/* --- 3. APRA DTI cap ----------------------------------------------------- */
export interface DtiAssessment {
  dti: number;
  high: boolean;                      // DTI ≥ 6 → inside the capped band
  note: string;
}

/** Flag a debt-to-income ratio against the APRA cap (≤20% of a lender's new
    lending may sit at DTI ≥ 6). A flag, not a hard decline. */
export function dtiAssessment(dti: number): DtiAssessment {
  const high = dti >= APRA_DTI_HIGH;
  return {
    dti,
    high,
    note: high
      ? `DTI ${dti.toFixed(1)}× is at or above ${APRA_DTI_HIGH}× — inside APRA's capped band (≤20% of a lender's new lending); expect fewer lenders and pricing/overlay scrutiny.`
      : `DTI ${dti.toFixed(1)}× is below the ${APRA_DTI_HIGH}× APRA cap band.`,
  };
}
