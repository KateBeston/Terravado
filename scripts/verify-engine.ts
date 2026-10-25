/* Engine verification — runs the ported engine against the sample portfolio
   and prints the headline metrics. Sanity-checks that the TypeScript port
   produces sensible, finite numbers across every major engine path.
   Run: npx tsx scripts/verify-engine.ts                                     */
import { seedContext } from "../src/lib/engine/seeds";
import {
  project, requiredGrowth, tornado, monteCarlo, valuation,
  serviceability, equityChain, feasibility,
} from "../src/lib/engine/engine";

const ctx = seedContext();
const p = ctx.properties[0];
const client = ctx.clients[0];
const lender = ctx.lenders[0];

let failures = 0;
const ok = (label: string, v: number | null, cond: boolean) => {
  const mark = cond ? "✓" : "✗";
  if (!cond) failures++;
  console.log(`  ${mark} ${label.padEnd(34)} ${v}`);
};

console.log("\nTERRAVADO engine verification — sample portfolio\n");

const P = project(p, {}, ctx);
console.log("project() — 10-year model:");
ok("IRR %", P.metrics.irr, P.metrics.irr !== null && isFinite(P.metrics.irr));
ok("Year-1 weekly (post-tax)", P.metrics.weekly1, isFinite(P.metrics.weekly1));
ok("Gross yield %", P.metrics.grossYield, P.metrics.grossYield > 0 && P.metrics.grossYield < 20);
ok("End value", P.metrics.valueEnd, P.metrics.valueEnd > p.market.price);
ok("End equity", P.metrics.equityEnd, P.metrics.equityEnd > 0);
ok("Rows produced", P.rows.length, P.rows.length === 10);
ok("Acquisition cash in", Math.round(P.acq.cashIn), P.acq.cashIn > 0);
ok("Transfer duty (NSW)", Math.round(P.acq.duty), P.acq.duty > 30000 && P.acq.duty < 60000);

const rg = requiredGrowth(p, ctx);
console.log("\nrequiredGrowth():");
ok("Growth to clear 8% hurdle", +rg.toFixed(2), isFinite(rg));

const tor = tornado(p, ctx);
console.log("\ntornado():");
ok("Sensitivity rows", tor.rows.length, tor.rows.length === 5);
ok("Top driver swing", +tor.rows[0].swing.toFixed(2), tor.rows[0].swing >= 0);

const mc = monteCarlo(p, { runs: 200 }, ctx);
console.log("\nmonteCarlo() (200 runs):");
ok("p10 IRR", mc.p10, isFinite(mc.p10));
ok("p50 IRR", mc.p50, isFinite(mc.p50));
ok("p90 IRR", mc.p90, isFinite(mc.p90) && mc.p90 >= mc.p10);
ok("Prob cash shortfall %", mc.probCashShortfall, mc.probCashShortfall >= 0 && mc.probCashShortfall <= 100);

const val = valuation(p);
console.log("\nvaluation():");
ok("Blended value", Math.round(val.blended), val.blended > 0);
ok("Variance vs price %", +val.variance.toFixed(1), isFinite(val.variance));

const sv = serviceability(client, lender, { proposedLoan: 760000, newAnnualRent: 33000 }, ctx);
console.log("\nserviceability():");
ok("Borrowing capacity", Math.round(sv.capacity), sv.capacity >= 0);
ok("DTI", +sv.dti.toFixed(2), sv.dti >= 0);

const ec = equityChain({ targetPrice: 850000 }, ctx);
console.log("\nequityChain():");
ok("Horizon rows", ec.rows.length, ec.rows.length === 15);
ok("Cash needed for next buy", Math.round(ec.cashNeeded), ec.cashNeeded > 0);

const fsb = feasibility({
  country: "AU", region: "NSW", landCost: 950000, landAcqCostsPct: 5.5, demolition: 35000,
  units: [{ count: 3, gfa: 150, buildRate: 2900, salePrice: 1150000 }],
  profFeesPct: 8, authorityFees: 45000, contributions: 70000, headworks: 35000,
  contingencyPct: 7, marketingPct: 1.2, sellingPct: 2.2, buildMonths: 14, sellMonths: 8,
  debtLVRpct: 65, debtLTCpct: 70, debtRate: 8.5, lineFeePct: 1.5,
  gstApplies: true, marginScheme: true, targetMarginPct: 20, holdingRatesPa: 9000,
});
console.log("\nfeasibility() — 3-townhouse development:");
ok("Gross realisation", Math.round(fsb.gr), fsb.gr === 3450000);
ok("Total development cost", Math.round(fsb.tdc), fsb.tdc > 0);
ok("Profit", Math.round(fsb.profit), isFinite(fsb.profit));
ok("Margin on cost %", +fsb.marginOnCost.toFixed(1), isFinite(fsb.marginOnCost));
ok("Residual land value", Math.round(fsb.rlv), isFinite(fsb.rlv));

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}\n`);
process.exit(failures === 0 ? 0 : 1);
