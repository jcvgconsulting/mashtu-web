# Steering consistency — one universal set, exceptions named (CANONICAL)

The policy for how steering files are kept **consistent across the whole repo fleet**.
Maintained canonically in `jcvgconsulting-platform`; when a copy disagrees, this one wins.

## Why this exists (the conviction)

Every per-client repo of the same kind should carry the **same steering files** — even
files for tech it has not adopted yet — because the moment that tech IS adopted it must be
governed by the SAME rules as everywhere else. The chain is deliberate:

> inconsistency → per-repo exceptions → exceptions are complexity → **complexity is the
> enemy of security** (and of reviewability, onboarding, and automation).

A reviewer, an agent, or a new operator must never have to ask "does THIS repo have the
rule?" The answer is always **yes** — the rule is present in every repo of that kind, so
the only question is whether the change obeys it. Uniformity is a security property, not a
tidiness preference.

## The two-layer model (model "b": separate files, not in-file markers)

Steering splits into exactly two kinds of file. The split is by FILE, so drift is trivial
to detect (a universal file is either byte-identical everywhere or it is drift):

### 1. UNIVERSAL files — byte-for-byte identical in every repo of that kind
Principles and host/tooling facts that do not depend on which client/repo they sit in.
Because they are identical, they are **mirrored**, never re-authored per repo, and a
consistency check is a plain file-equality check against the canonical copy here.

- They must be written at the **PRINCIPLE level, never the INSTANCE level.** "A repo's
  credential carries exactly the permissions its own resources need" is universal; "add
  Pages:Edit to the token" is instance-specific and must NOT appear in a universal file.
  This is the rule that lets the SAME file be correct in a DNS-only repo and a Pages repo
  at once. **Inaccurate shared text is worse than duplication** — never make a file
  "universal" by stating a fact that is false for some repos that carry it.
- A universal file names no client. (It therefore automatically satisfies `isolation.md`.)

### 2. REPO-SPECIFIC files — a small, DECLARED set that legitimately varies
All variation is confined to a few clearly-named files, so the universal files stay
diff-identical. The declared repo-specific files are:

- **`product.md`** — what THIS repo/client is (the one every repo tailors). This is where
  "this client is a villa / a pharmacy / defunct / break-fix", the engagement type, and the
  repo's role live.
- For an **actionable IaC repo** only, the files that encode that repo's real resources:
  `zone-ownership.md`, `tooling.md`, `environments.md`, `security.md`,
  `opentofu-conventions.md` (DNS/`-infra`), and the FortiGate equivalents (`-fortigate`).
  These carry instance facts (which zones, which token scopes, which providers) and so
  are legitimately per-repo — but their PRINCIPLES still come from the universal
  `security.md`/`msp-repo-model.md` posture.

**Everything not on the repo-specific list is universal.** When in doubt, a rule is
universal and phrased at the principle level.

## The universal set, by repo kind

> This is the manifest. "Universal" means: present and identical in every repo of that
> kind. Tech-specific universals are carried as the SAME file even where the tech is not
> yet used — a stub that says "when this repo adopts X, X is governed by …" is better than
> an absent file, because adoption then inherits the rule automatically.

**Every repo (all kinds) carries:**
- `shell-discipline.md` — host shell rules (already fleet-wide).
- `isolation.md` — the client-confidentiality gate.
- `identity-and-naming.md` — owner/managed_by/location + client-scoped IDs.
- `repo-architecture.md` — the MSP repo model.
- `msp-repo-model.md` — the cross-cutting mirror of the repo model + isolation + agents-never-apply.
- `search-discipline.md` — include-pattern / "no matches" discipline.
- `security.md` — the paramount security posture (principle level: least-privilege, secrets
  never in git, agents never apply/import, no-plaintext-secret gate).
- `workflow-orchestration.md` — launching/authoring workflow recipes (host facts).
- `workflow-worktree-cleanup.md` — terminal-before-remove worktree gate.
- `steering-consistency.md` — this file.
- `product.md` — **repo-specific** (the one tailored file).

**`<client>-kb` repos additionally carry:**
- `kb-structure.md` — the per-location-pages convention + equipment-photo/secrets policy.

**Actionable IaC repos (`-infra`, `-fortigate`, `-web`) additionally carry** the
instance-encoding files for their stack (repo-specific content, universal principles):
`-infra` → `tooling.md`, `environments.md`, `opentofu-conventions.md`, `zone-ownership.md`
(+ universal `security.md`); `-fortigate`/`-web` → their equivalents.

> The two product/engine repos `vpnalyzer-v2` and `mtuscanner` are NOT client repos — they
> are software products and carry their own app-code steering (`rust-*`, architecture, etc.).
> They still carry the universal host files (`shell-discipline`, `local-toolchain`, etc.)
> but are OUT OF SCOPE for the client-repo universal set.

## Keeping it consistent (the discipline)

- **Author/change a universal file HERE first** (`jcvgconsulting-platform`), then propagate
  it verbatim to every repo of the applicable kind — same bytes, same path
  (`.kiro/steering/<file>.md`). A universal change is not "done" until every applicable repo
  carries the new bytes. **`jcvgconsulting-platform` is the UNAMBIGUOUS source of truth:** a
  local edit to a universal file in any OTHER repo is pointless — the next sync clobbers it.
  The rule "only ever edit a universal file in platform" is enforced by that fact, not by
  good intentions.
- **The mechanism is a detector + a corrector, both in `scripts/`:**
  - `scripts/steering-audit.ps1` — the **detector / dry-run**. Hashes each target against
    canonical and reports per (repo, file): OK / DRIFT / MISSING. Read-only; writes a report
    to a gitignored `.scratch/` and a one-line summary. "Verify by equality, not by eye":
    drift = a universal file whose hash differs from canonical, or a repo of a kind MISSING
    a universal file — a repo failing the audit is a finding, same severity as a failing
    isolation gate.
  - `scripts/steering-sync.ps1` — the **corrector / apply**. Copies every canonical universal
    into every applicable repo, overwriting drift and creating missing files; it re-hashes
    each copy to confirm it landed byte-identical. Run it with `-WhatIf` first (shows
    WOULD-COPY / SKIP, changes nothing). It does NOT commit — review each repo's
    `git status`/diff (a universal-steering change touches ONLY `.kiro/steering/`) and commit
    deliberately.
  - **The two share the SAME canonical set and the SAME repo-by-kind target lists** so
    detector and corrector stay in lockstep. Changing one list means changing both.
  - **The loop:** change canonical in platform → `steering-sync.ps1` (optionally `-WhatIf`
    first) → commit the touched repos → `steering-audit.ps1` verifies green (OK=all,
    DRIFT=0, MISSING=0).
- **A new universal rule is added to the manifest above in the SAME change** that creates
  the file, so the audit knows to expect it everywhere.
- **Tailoring happens ONLY in the declared repo-specific files.** If you find yourself
  wanting to tweak a universal file "just for this repo", stop: either the tweak is a
  principle (belongs in the universal file for everyone) or an instance fact (belongs in
  that repo's `product.md` / IaC file). It never belongs as a per-repo edit of a universal
  file.

## Status

**The clean, principle-level universal set is now mirrored fleet-wide and audited green.**
The six-everywhere files (`isolation`, `identity-and-naming`, `repo-architecture`,
`steering-consistency`, `workflow-orchestration`, `shell-discipline`) plus `kb-structure`
in every `-kb` repo are byte-identical across all target repos — `scripts/steering-audit.ps1`
reports OK on every (repo, file) pair, DRIFT=0, MISSING=0. The product repos
(`mtuscanner`, `vpnalyzer-v2`, and the `mashtu` app repo) are correctly excluded.

Still OUTSIDE this clean canonical set, by design: `security.md` / `msp-repo-model.md` /
`search-discipline.md` / `workflow-worktree-cleanup.md` currently live tailored in the
`-infra` repos and have NOT yet been extracted to clean, principle-level canonical copies
here. Extracting each (so it too can be synced everywhere) is a follow-up, one file at a
time: lift it to a client-naming-free canonical copy here, add it to BOTH script lists in
the SAME change, then `steering-sync.ps1` → commit → `steering-audit.ps1`.

A deeper enforcement follow-up (not yet built): a per-repo pre-commit hook that runs the
audit and refuses to commit a drifted universal file — turning "remember to run sync" into
"can't forget."

## See also

- `repo-architecture.md` — the repo kinds this manifest is organized by.
- `isolation.md` — why universal files name no client (and the client-repo gate).
- `workflow-orchestration.md` — a universal file; also governs the reconciliation workflow.
