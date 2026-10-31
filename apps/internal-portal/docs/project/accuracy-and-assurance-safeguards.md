# Terravado — accuracy & assurance safeguards

_Last updated: 26 Oct 2026_

## Why this exists

Terravado's modelling influences real financial decisions. Accuracy is the one part of the
chain Terravado *fully* owns — it can't be disclaimed to the data provider or the adviser. These
safeguards are how "own your part completely" becomes real rather than a sentence. They get built
in as the engine grows; several already exist in the current build and are marked ✓.

Think of it as two things you asked for: **checks upon checks** (layers 1–4, automated and
continuous) and **regular audits** (layer 5, scheduled and human).

## 1. Prove every calculation against the real-world source

Internal consistency is not correctness — a wrong formula can be perfectly self-consistent (the
trap HtAG falls into by marking its own homework). Every calculator needs known-answer tests
whose expected values come from the **authoritative external source**, not from Terravado:

- Stamp duty → the state Revenue Office calculator for that exact scenario.
- Land tax → the Revenue Office figure, per state, per entity.
- Income tax, CGT, Medicare → the ATO figure.
- Depreciation → a quantity surveyor's schedule logic.
- Serviceability → Quickli (which mirrors each lender's official calculator).

✓ Started: `verify-engine.ts` with known-answer assertions on the seed portfolio (40 today).
**To add:** tie each assertion to its authoritative source, and have Ash / an accountant sign off
a set of "golden" cases as correct.

## 2. Lock reference data to versions and effective dates

Rates, thresholds, duty scales and LVR tables are held as **versioned, effective-dated blocks**,
not scattered constants — so a historic report reproduces exactly against the data version it ran
on, and a rate change is a new block, not an edit.

✓ Have: `TAX_DATA` (version + effectiveFrom), `ENGINE_VERSION`. **To add:** a documented update
process — when a budget or policy changes, a new block is drafted, checked against the source,
**signed off by a domain expert before it goes live**, and dated.

## 3. Make every number traceable

Any figure must be explainable: which inputs, which assumptions, which data version, which
formula produced it. This is both an accuracy safeguard (errors become visible) and the
transparency the adviser needs to genuinely own their advice.

- Show-the-working on outputs (inputs + assumptions → result).
- Immutable **report snapshots** frozen at generation (inputs + data version + outputs).
- Append-only **audit log**.

✓ Have: audit log and snapshot design in the current build. **To add:** surface the assumption
and data-version stamp on every client-facing output, not just internally.

## 4. Re-check automatically and continuously

The verification suite runs on **every code change** (CI), so nothing ships if it breaks a known
answer. This is what stops a well-meaning edit silently breaking a calculation months from now.

- `verify-engine` wired into CI as a required gate on every commit/PR.
- Input validation at the boundary — reject or flag implausible values (LVR > 100%, yield 40%,
  negative income) so the model never computes confidently on nonsense.
- Calculation/tax/serviceability logic changes go through review, never a casual edit.

**To add:** this is mostly process to stand up when the build resumes.

## 5. Audit on a schedule, with fresh eyes

The automated layers catch regressions; audits catch drift and blind spots.

- **Periodic re-verification** (at least quarterly, and on every budget/policy change): re-run the
  golden cases against the *current* authoritative sources, since rates and lender policies move.
- **Domain-expert review:** Ash / an accountant reviews a sample of real outputs for
  reasonableness — the thing tests can't catch.
- **Independent sign-off on the high-stakes engines** (tax, land tax, SMSF/LRBA): ideally checked
  by someone who didn't build them, given the cost of being wrong there.
- **Data-source freshness checks:** confirm feeds are current and within their stated lag.

## The honest limit

These safeguards guarantee the *process* — that the modelling is sound, current and transparent.
They do not, and cannot, guarantee the *outcome*, which depends on factors no one controls. That
line is deliberate: own the modelling completely, be honest about the uncertainty, and the
responsibility stays fair.

## Note on sequencing

This is the spec to build in from day one, not a task for today. Several layers already exist; the
rest are implemented as the engine is built. The live next step remains validating the niche with
Ash and Dino — this framework is what you hold *to* once you're building in earnest.
