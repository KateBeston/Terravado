# Developer stock & advisor business module — spec

_Recorded 28 Oct 2026. The advisor/buy-side of stock — distinct from the parked developer-facing Project Marketing platform (which stays a separate product). This builds Terravado's matching wedge._

## Why this is a Terravado feature (not the parked platform)
The parked "Project Marketing / Stock Visibility Platform" is developer/supply-side — a separate product with a different buyer. THIS is the advisor/buy-side: an adviser loads stock they already receive from developers to create records, model them, match them to clients, and run their advisory business. The parked note itself calls this "the supply side of Terravado's property-matching wedge", with the matching engine as the connective tissue. So it belongs in the Terravado portal; the standalone developer platform stays parked.

## Two halves
### A. Developer stock module (advisor-side)
- Development/project record: developer, location, stage releases, commission arrangement.
- Lots (stock) under a development: lot number, address, stage, price, availability, plus marketed figures (advertised rent / yield / ROI).
- Stock-list PDF stored against the development. Structured lot entry first; AI-assisted extraction that proposes rows to confirm as a follow-on — raw auto-parse is unreliable across developer PDF formats.
- Modeller applied to a lot generally; matching engine scores the stock list against a client's borrowing capacity + criteria to surface best-fit lots.

### B. Advisor business tooling
- Document storage for agreements / commission arrangements (per development).
- Commission calculator: sale price x rate per lot.
- Commission & revenue tracker for lots in play.
- Deal tracker by advisor stages (awaiting pre-approval -> finance -> title registration -> settled). Distinct from the lender lodgement tracker — a configurable advisor pipeline.

## Build order
1. **Stock foundation** — Developments + Lots records, manual entry (stage, price, advertised ROI), commission arrangement captured, PDF stored. (first)
2. **Matching engine** — score stock vs a client's capacity + criteria.
3. **Advisor business tooling** — commission calculator, commission/revenue tracker, deal pipeline by stage.

## Honest flags
- PDF auto-parse is unreliable (every developer's format differs): store the PDF + structured entry now; AI-assisted extraction (confirm proposed rows) later.
- Gated by account type via a new "stock" capability: consultant / buyers agent / broker, not public.
