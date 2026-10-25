"use client";

import { useMemo } from "react";
import { BRAND } from "@/config/brand";
import { seedContext } from "@/lib/engine/seeds";
import { project, requiredGrowth, valuation } from "@/lib/engine/engine";

const fmt = (n: number) => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
const money = (n: number) => "$" + fmt(Math.round(n));

export default function Home() {
  const { P, rg, val, p } = useMemo(() => {
    const ctx = seedContext();
    const p = ctx.properties[0];
    return { P: project(p, {}, ctx), rg: requiredGrowth(p, ctx), val: valuation(p), p };
  }, []);

  const m = P.metrics;
  const tiles = [
    { label: "Projected IRR", value: `${m.irr}%`, hint: `vs ${p.hurdle}% hurdle` },
    { label: "Year-1 cash", value: `${money(m.weekly1)}/wk`, hint: "after tax" },
    { label: "Gross yield", value: `${m.grossYield}%`, hint: "year 1" },
    { label: "Growth to clear hurdle", value: `${rg.toFixed(1)}%`, hint: "required p.a." },
    { label: "End value", value: money(m.valueEnd), hint: `year ${p.horizon}` },
    { label: "End equity", value: money(m.equityEnd), hint: `at ${m.lvrEnd}% LVR` },
  ];

  return (
    <main style={{ maxWidth: 1040, margin: "0 auto", padding: "2.4rem max(16px, env(safe-area-inset-left)) 4rem" }}>
      <header style={{ borderBottom: "1px solid var(--line)", paddingBottom: "1.4rem", marginBottom: "1.8rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: ".72rem", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--accent)" }}>
          {BRAND.tagline}
        </div>
        <h1 style={{ margin: ".5rem 0 .2rem", fontSize: "clamp(1.9rem,5vw,2.8rem)", letterSpacing: "-.02em" }}>{BRAND.name}</h1>
        <p style={{ color: "var(--muted)", margin: 0, maxWidth: "48rem" }}>
          Engine foundation running live in the new Next.js / TypeScript stack. Below is the sample property
          ({p.label}) run through the ported modelling engine — proof the migration works end to end.
        </p>
      </header>

      <section aria-label="Headline metrics"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(9.5rem,1fr))", gap: ".7rem", marginBottom: "2rem" }}>
        {tiles.map((t) => (
          <div key={t.label} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: ".7rem", padding: "1rem" }}>
            <div style={{ color: "var(--muted)", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".06em" }}>{t.label}</div>
            <div className="tnum" style={{ fontSize: "1.5rem", fontWeight: 600, margin: ".3rem 0 .1rem" }}>{t.value}</div>
            <div style={{ color: "var(--muted)", fontSize: ".78rem" }}>{t.hint}</div>
          </div>
        ))}
      </section>

      <h2 style={{ fontSize: "1rem", margin: "0 0 .6rem" }}>10-year projection</h2>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: ".7rem" }}>
        <table className="tnum" style={{ width: "100%", borderCollapse: "collapse", fontSize: ".82rem", minWidth: 640 }}>
          <thead>
            <tr style={{ textAlign: "right", color: "var(--muted)", background: "var(--surface-2)" }}>
              {["Year", "Value", "Loan", "Equity", "Rent", "Post-tax CF", "Weekly", "Yield %"].map((h, i) => (
                <th key={h} style={{ padding: ".55rem .7rem", textAlign: i === 0 ? "left" : "right", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {P.rows.map((r: any) => (
              <tr key={r.year} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: ".5rem .7rem" }}>{r.year}</td>
                <td style={{ padding: ".5rem .7rem", textAlign: "right" }}>{money(r.value)}</td>
                <td style={{ padding: ".5rem .7rem", textAlign: "right" }}>{money(r.balance)}</td>
                <td style={{ padding: ".5rem .7rem", textAlign: "right" }}>{money(r.equity)}</td>
                <td style={{ padding: ".5rem .7rem", textAlign: "right" }}>{money(r.grossRent)}</td>
                <td style={{ padding: ".5rem .7rem", textAlign: "right", color: r.postTaxCF < 0 ? "var(--bad)" : "var(--good)" }}>
                  {r.postTaxCF < 0 ? `(${money(-r.postTaxCF)})` : money(r.postTaxCF)}
                </td>
                <td style={{ padding: ".5rem .7rem", textAlign: "right", color: r.weekly < 0 ? "var(--bad)" : "var(--good)" }}>
                  {r.weekly < 0 ? `(${money(-r.weekly)})` : money(r.weekly)}
                </td>
                <td style={{ padding: ".5rem .7rem", textAlign: "right" }}>{r.grossYield}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: "1.2rem" }}>
        Independent valuation (triangulated): <strong style={{ color: "var(--fg)" }}>{money(val.blended)}</strong>{" "}
        ({val.variance >= 0 ? "+" : ""}{val.variance.toFixed(1)}% vs price paid). Figures are indicative and must be
        verified before use with a client. Next build stage wires these views to Supabase and adds the input panels.
      </p>
    </main>
  );
}
