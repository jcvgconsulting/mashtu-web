# Repo architecture — the JCvG MSP model (CANONICAL)

This is the **source-of-truth** statement of how JCvG Consulting's repositories are
organized. It is maintained here in `jcvgconsulting-platform` and mirrored (tailored) into
the other repos' steering. When this file and another repo's copy disagree, this one wins —
fix the copy.

JCvG is an MSP managing infrastructure for multiple clients across many providers. The repo
layout separates **shared logic**, **per-client knowledge**, and **per-client actionable
infrastructure-as-code**, so each is owned, scoped, and blast-radius-isolated correctly.

## The three repo roles

```
jcvgconsulting-platform   SHARED LOGIC — reusable OpenTofu modules, the inventory schema
                          CONTRACT + CI validator, Ansible, scripts, and design docs.
                          Written ONCE (DRY); consumed by all client repos as a versioned
                          git:: source.

jcvgconsulting-kb         JCvG's OWN estate + CROSS-CLIENT knowledge. The ONLY repo allowed
                          to know about all clients at once. JCvG-internal; never shared
                          with a client.

<client>-kb               Per-client KNOWLEDGE: structured inventory/ (schema-conforming) +
                          narrative docs/. The client's descriptive source of truth.
                          Self-contained and HANDOVER-SAFE.

<client>-infra            Per-client DNS-as-code (Cloudflare zone + registrar NS delegation).
<client>-fortigate        Per-client FortiGate config-as-code (consumes the client -kb).
<client>-web              Per-client website (if any).
                          — all per-client ACTIONABLE IaC: own state, own credentials.
```

## Onboarding a new client

Create `<client>-kb` first (accumulate knowledge from day one), then add actionable repos
(`-infra`, `-fortigate`, …) as needed — each consuming the client's `-kb` and the shared
schema from `jcvgconsulting-platform`. A client starts with one `-kb` and zero or more
actionable repos.

## What goes where (quick rules)

- **Reusable logic / modules / the schema contract / design docs** → `jcvgconsulting-platform`.
- **Client knowledge** (topology, inventory, workloads, demarcation, migrations) →
  `<client>-kb`.
- **JCvG's own estate + anything cross-client** → `jcvgconsulting-kb`.
- **Actionable per-client IaC** (DNS, FortiGate config, web) → `<client>-infra`/`-fortigate`/`-web`.
- **Secrets** → per-repo SOPS; never in a `-kb` (knowledge is non-secret; reference secrets
  by key name only).

## Status note (do not over-specify the schema yet)

The **inventory schema contract** (owned here) is **not yet authored** (schema v1 is the
keystone, pending). Until it lands, steering should reference the schema and the data model
as *forthcoming* (see `docs/design/msp-inventory-datamodel/`) rather than pin exact field
names / file layouts — avoid writing steering we must rewrite when schema v1 lands. The
**principles** below (isolation, three-attribute identity, client-scoped names) are stable
and ARE locked in now; the schema's *shape* is not.

## See also

- `steering-consistency.md` — the universal-vs-repo-specific steering model: which files
  are identical in every repo of a kind, and which few are tailored per repo.
- `isolation.md` — the client-confidentiality isolation rule (hard gate).
- `identity-and-naming.md` — owner/managed_by/location + client-scoped identifiers.
- `kb-structure.md` — the content layout inside a `<client>-kb`: the per-location pages
  convention (one page per location for every client) + equipment-photo policy.
- `workflow-orchestration.md` — launching/authoring workflow recipes across the fleet.
- `docs/design/` — the FortiGate management and MSP inventory design docs.
