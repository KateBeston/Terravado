# Bank data (Open Banking) — consumer-data strategy & accreditation path

_Recorded 28 Oct 2026. Decision: build the integration surface now, switch a live provider on later. Not legal advice._

## Decision
Build the bank-data (Open Banking **consumer** data) integration to the same "ready-for-integration" standard as the other provider seams, and leave it gated off until a broker actually needs it. Live connection goes through an accredited intermediary under the **representative model** — Terravado does not seek its own accreditation.

## The key distinction
The extra regulatory regime is triggered by the **connection method**, not by the sensitivity of the data.
- **Client-supplied statements** (client or broker uploads PDFs/CSVs): the same position a broker is already in when a client emails statements over. No CDR, no accreditation — ordinary document handling under the Privacy Act. Can be parsed into the Financials record today.
- **Live "connect your bank" feed** (CDR consumer data): banks release this only to an Accredited Data Recipient (ADR) or its representative. This is the gated part — enforced by the banks, not optional diligence. Screen-scraping the client's login is the old workaround; it is being phased out and breaches most banks' terms, so not a path to build on.

## Why not accredit / go live now
"Connecting" is not a key-and-go API. Going live means either full ACCC ADR accreditation (audits, assurance, insurance — not for a solo founder yet) or the **representative** model under a principal ADR (Frollo / Basiq / illion): a contract, appearing on the CDR register under their accreditation, compliant consent + data-dashboard flows, and carrying the obligations (consent management, breach reporting, deletion/de-identification, record-keeping) from the moment you are live — plus provider subscription/per-use cost — whether or not anyone uses it. Switching it on starts the compliance-and-cost clock for something idle.

## The sandbox reconciliation
You CAN build the whole flow now against the provider's **sandbox / test environment** — consent screens, data mapping into the Financials record — with no accreditation and no real customer data. The only thing left at go-live is the representative arrangement to point it at real data. So: **build now (sandbox), switch live later (representative).**

## What is built (increment 25)
A `bank-data` provider seam in the same bucket as the other integrations: config-gated, stub fallback, registered on the Integrations page. `BankDataProvider` with `startConnection` (hosted consent) and `getSnapshot` (assessment-ready income / liabilities / verified living expenses, shaped to drop into a person's Financials record). Gated on `BANK_DATA_PROVIDER` (frollo|basiq|illion) + `BANK_DATA_MODE` (sandbox|live). Fallback keeps the record on client-supplied statements + manual entry.

## Provider options (for the go-live assessment, later)
Frollo, Basiq, illion — all offer accredited-intermediary / CDR-as-a-service under the representative model. Assess accreditation model, representative obligations, data retrieved, and cost when a pilot broker wants it. (illion also does statement retrieval/analysis on uploads.)

## Near-term functional option
The statement-upload tier (client/broker uploads statements, parsed into the Financials record) needs no accreditation and delivers most of the serviceability benefit — a candidate for the next functional step, independent of the live CDR connection.

## Related
Parked alongside this: a **compliance & regulatory watch** feature (internal portal notifications that monitor regulatory / lender / CDR updates for human review) — valuable, but not a substitute for the accreditation gate on live feeds.
