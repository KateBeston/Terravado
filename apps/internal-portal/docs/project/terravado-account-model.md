# Account model — types, roles, capabilities & deal sharing

_Recorded 28 Oct 2026. Design blueprint for who uses Terravado and what they can see. Build in layers, lowest-risk first._

## Four layers (kept distinct on purpose)
1. **Account type (persona) → capabilities.** The account (tenant) has a type — Broker, Investment consultant, Buyers agent, Public/end-investor — which grants a set of capabilities (feature flags). Core functionality (clients, properties, the Modeller) is shared; type adds or removes modules (broker → bank-data + lodgement; consultant → advice/modelling, no lodgement; buyers agent → sourcing + modelling; public → modelling/portfolio only). **Gate features on capabilities, and let the type grant them** — so a consultant with a broker on the team can be granted broker capabilities without rewriting checks.
2. **Internal roles (within an account).** owner / admin / adviser / viewer — already in place. Governs what a teammate can do inside their own account.
3. **Internal holders vs external guests.**
   - Internal party = holds their own Terravado account (tenant); sees their book per role + capabilities.
   - External party = invited onto specific deal(s) in someone else's account; sees ONLY those deal(s), scoped to what they need — never the host's book.
4. **Deal-scoped sharing + optional upgrade.** An account invites a party onto a deal (or deals). The invited party:
   - with no account → pure guest on those deals via invite;
   - with their own account → the shared deal surfaces inside their own workspace alongside their own clients, but still only the shared deal(s) from that host.
   Capabilities travel with the invited party: an invited broker brings broker capabilities to the shared deal (serviceability, statement upload, lodgement) even when the host is a consultant.

## Broker, two ways
- **Broker on the team** — a member of the consultant's account with a broker role; unlocks broker features inside that account.
- **External broker via invite** — a broker with their own account (a direct Terravado client) invited onto a specific deal; works it in their own workspace, sees only that deal.

## Security note
The external-guest, deal-scoped visibility is **cross-tenant access control** — the most security-sensitive part of the platform. It needs its own sharing record (deal + invited party + scope + permission + status), an invite/accept flow, and RLS that lets a guest see only shared deals. Build it last and carefully.

## Build order
1. **Account type + capability gating** (cheap, high value; gates bank-data, lodgement, etc. per persona). ← first
2. **Internal role refinements** (broker-on-team role + capability grant).
3. **External guest deal-sharing** (cross-tenant, scoped; invite/accept; RLS). ← last, deliberate.

## Entitlements / "account limits"
Account type also maps to plan/entitlement tiers later (seats, client count, which modules) — the capability map is the hook for that.
