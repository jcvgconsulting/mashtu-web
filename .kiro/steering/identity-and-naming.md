# Identity & naming — three attributes, client-scoped IDs (CANONICAL)

Two stable modeling rules that hold regardless of the (forthcoming) inventory schema. They
are derived from the real estate and from the workspace's synthetic-identity principle.

## 1. Owner / managed_by / location are THREE INDEPENDENT attributes

Every managed device/site carries three attributes that must **never** be conflated:

- **owner** — who owns the asset. Often the client; sometimes JCvG.
- **managed_by** — who operates/configures it. For managed devices, JCvG.
- **location** — where it physically sits. May be a **different party's premises** than the
  owner.

**The recurring pattern that proves why:** a **client-owned** management node, part of the
**client's own** overlay, is physically **housed at the JCvG office** under a hosting
arrangement. Owner = client, managed_by = JCvG, location = JCvG office. **Location is not
ownership.** Never infer ownership from where a thing sits.

## 2. Identifiers are CLIENT-SCOPED — clashes between clients are EXPECTED

Each client's estate is independent, so **the same device code or the same RFC1918 address
can legitimately exist in two different clients** (e.g. two clients each using overlapping
loopback summaries, or similar site codes).

- **Identifiers are unique only WITHIN a client, never globally.**
- A **stable synthetic ID** keys an entity (never a mutable/observable attribute like
  serial / IP / hostname — those are time-bounded *evidence*). The synthetic ID is
  **client-scoped** (`client_id` + local code).
- Any **cross-client** reference (only ever in `jcvgconsulting-kb`) MUST qualify by client —
  e.g. `clientA/CODE`, `clientB/CODE`. A bare code or bare address is ambiguous across
  clients and must not be used unqualified there.
- Do **not** assume address-space uniqueness across clients; per-client address spaces may
  overlap by design.

## Relationship to the synthetic-identity principle

This is the MSP application of "identity is synthetic and permanent; every observable is
time-bounded evidence" — extended with the client scope: the synthetic identity is unique
*within its client*, and owner/managed_by/location are independent facets a thing carries.

> The schema's exact fields are forthcoming (see `docs/design/msp-inventory-datamodel/`);
> these two rules are stable and locked in now.
