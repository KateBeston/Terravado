import { requireUser } from "@/lib/auth/guard";
import { getCurrentTenant } from "@/lib/auth/tenant";
import { getProperty, listEntities } from "@/lib/domain/service";
import { foreignInvestorOverlay, type DwellingType } from "@terravado/engine/firb";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
const money = (v?: number | null) => (v === undefined || v === null ? "—" : (v < 0 ? "-$" : "$") + Math.abs(Math.round(v)).toLocaleString("en-AU"));
const asStr = (x?: string | string[]) => (Array.isArray(x) ? x[0] : x) ?? "";
const asNum = (x?: string | string[], d?: number) => { const v = Number(asStr(x).replace(/[,$\s]/g, "")); return isFinite(v) && asStr(x) !== "" ? v : d; };
const DWELLINGS: { v: DwellingType; label: string }[] = [
  { v: "new", label: "New dwelling / off-the-plan" },
  { v: "established", label: "Established dwelling" },
  { v: "vacant-land", label: "Vacant land" },
];

export default async function PropertyForeignTab({ params, searchParams }: { params: { id: string }; searchParams: Record<string, string | string[] | undefined> }) {
  await requireUser();
  const { tenantId } = await getCurrentTenant();
  const p = await getProperty(tenantId, params.id);
  if (!p) notFound();

  const entities = await listEntities(tenantId);
  const owner = p.entityId ? entities.find((e) => e.id === p.entityId) : undefined;
  const state = p.state || p.details?.locality?.region || "NSW";
  const landValueDefault = p.details?.tax?.landValueManual ?? Math.round((p.price ?? 0) * 0.6);

  // Inputs (GET what-if). Foreign flag defaults from the owning entity.
  const value = asNum(searchParams.value, p.price ?? 0)!;
  const landValue = asNum(searchParams.land, landValueDefault)!;
  const dwelling = (asStr(searchParams.dwelling) as DwellingType) || "new";
  const foreign = searchParams.foreign === undefined ? (owner?.foreign ?? false) : asStr(searchParams.foreign) === "on";
  const vacant = asStr(searchParams.vacant) === "on";

  const o = foreignInvestorOverlay({ value, state, dwelling, foreign, landValue, vacant });

  return (
    <>
      <p className="muted" style={{ marginTop: -6 }}>
        The extra cost a foreign buyer carries across the life of this deal — FIRB approval, the duty and land-tax surcharges,
        the annual vacancy fee and the exit treatment. Defaults come from the record and the owning entity. General information, not advice.
      </p>

      <div className="panel">
        <h2>Assumptions</h2>
        <form method="GET">
          <div className="row">
            <label className="f"><span>Property value</span><input name="value" inputMode="numeric" defaultValue={value} /></label>
            <label className="f"><span>Land value (for surcharge)</span><input name="land" inputMode="numeric" defaultValue={landValue} /></label>
            <label className="f"><span>Dwelling type</span>
              <select name="dwelling" defaultValue={dwelling}>{DWELLINGS.map((d) => <option key={d.v} value={d.v}>{d.label}</option>)}</select>
            </label>
          </div>
          <div className="row">
            <label className="f" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><input type="checkbox" name="foreign" defaultChecked={foreign} style={{ width: "auto" }} /><span style={{ margin: 0 }}>Foreign person / entity</span></label>
            <label className="f" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><input type="checkbox" name="vacant" defaultChecked={vacant} style={{ width: "auto" }} /><span style={{ margin: 0 }}>Left vacant (&lt;183 days occupied) — annual vacancy fee</span></label>
          </div>
          <input type="hidden" name="_submitted" value="1" />
          <button className="btn" type="submit">Calculate foreign-investor cost</button>
        </form>
        <p className="muted" style={{ fontSize: 12 }}>State: {state}. {owner ? `Owner: ${owner.name}${owner.foreign ? " (flagged foreign)" : ""}.` : "No owning entity set."}</p>
      </div>

      {!foreign ? (
        <div className="panel"><p>This owner isn't flagged as a foreign person, so no FIRB approval, surcharges or vacancy fee apply. {o.cgtNote}</p></div>
      ) : (
        <>
          <div className="panel" style={{ borderLeft: o.eligibility.permitted ? "3px solid var(--green)" : "3px solid #b03a2e" }}>
            <h2 style={{ marginTop: 0 }}>{o.eligibility.permitted ? "FIRB approval required" : "Not permitted"}</h2>
            <p style={{ margin: 0 }}>{o.eligibility.note}</p>
          </div>

          <div className="cards">
            <div className="card"><div className="k">Upfront extra</div><div className="v" style={{ color: "#b03a2e" }}>{money(o.upfrontExtra)}</div><div className="k">FIRB fee + duty surcharge</div></div>
            <div className="card"><div className="k">Annual extra</div><div className="v" style={{ color: "#b03a2e" }}>{money(o.annualExtra)}</div><div className="k">land-tax surcharge{vacant ? " + vacancy fee" : ""}</div></div>
            <div className="card"><div className="k">FIRB application fee</div><div className="v">{money(o.firbFee)}</div></div>
            <div className="card"><div className="k">Duty surcharge</div><div className="v">{money(o.dutySurcharge)}</div></div>
          </div>

          <div className="panel">
            <h2>Lifecycle breakdown</h2>
            <table>
              <tbody>
                <tr style={{ fontWeight: 600 }}><td>Acquisition</td><td></td></tr>
                <tr><td className="lbl">FIRB application fee</td><td>{money(o.firbFee)}</td></tr>
                <tr><td className="lbl">Foreign purchaser duty surcharge</td><td>{money(o.dutySurcharge)}</td></tr>
                <tr style={{ fontWeight: 600 }}><td>Upfront total</td><td>{money(o.upfrontExtra)}</td></tr>
                <tr style={{ fontWeight: 600 }}><td>Holding (per year)</td><td></td></tr>
                <tr><td className="lbl">Foreign owner land-tax surcharge</td><td>{money(o.landTaxSurcharge)}</td></tr>
                <tr><td className="lbl">Annual vacancy fee {vacant ? "" : "(not vacant)"}</td><td>{money(o.vacancyFee)}</td></tr>
                <tr style={{ fontWeight: 600 }}><td>Annual total</td><td>{money(o.annualExtra)}</td></tr>
                <tr style={{ fontWeight: 600 }}><td>Disposal</td><td></td></tr>
                <tr><td className="lbl" colSpan={2} style={{ fontWeight: 400 }}>{o.cgtNote}</td></tr>
              </tbody>
            </table>
            <p className="muted" style={{ fontSize: 12 }}>
              FIRB residential fees are 2026–27 (from 1 Jul 2026), indexed each 1 July. The established-dwelling ban runs 1 Apr 2025 – 31 Mar 2027.
              The vacancy fee is twice the application fee for applications made after 9 Apr 2024. Duty and land-tax surcharge rates are the state's.
              See the Sale / CGT tab for the full exit calculation. General information, not advice.
            </p>
          </div>
        </>
      )}
    </>
  );
}
