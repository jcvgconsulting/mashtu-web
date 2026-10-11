# Client isolation — a NON-NEGOTIABLE confidentiality gate (CANONICAL)

This is a **hard rule**, same severity as a security review gate. A violation is a
**blocking finding**. It exists because a client repo **may be shared with, or turned over
to, that client** — so it must never leak the existence or details of any other client.

## The rule

- A **`<client>-*` repo** (any per-client repo: `-kb`, `-infra`, `-fortigate`, `-web`)
  refers **only** to:
  - **itself** (that one client), and
  - where unavoidable, the **managing provider** (JCvG Consulting / `jcvgconsulting-*`).
- It must **never** name, describe, compare-to, or link to **another client** or another
  client's repository, data, devices, addresses, or people.
- No cross-client comparisons ("deeper scope than X"), no other-client names, no paths into
  another client's repo, no "sibling client" phrasing.

## The one exception

**`jcvgconsulting-kb`** is JCvG-internal and is the ONLY repo allowed to reference every
client at once. All cross-client material — the client roster, comparisons, "which client
drives which shared feature" — lives there, never in a client repo.

## Applies to steering too

A client repo's **own steering files** must also obey this: generic/principle wording only,
never another client's name. Cross-cutting rules are phrased generically (e.g. "a client
repo refers only to itself and the vendor") so they are safe to mirror into any client repo.

## Practical checks

- Before committing to a `<client>-*` repo, grep for other client names / identifiers; a hit
  is a blocking finding.
- When writing a client KB, if you catch yourself making a comparison to another client,
  STOP — that sentence belongs in `jcvgconsulting-kb`, not here.
- Shared/canonical steering mirrored into a client repo must be the generic version, not one
  that names other clients.

> Precedent: cross-client comparisons were (correctly) kept OUT of the client `-kb` repos and
> placed in `jcvgconsulting-kb/docs/cross-client-overview.md`.
