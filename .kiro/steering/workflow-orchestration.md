# Workflow orchestration — launching recipes across the fleet (CANONICAL)

Host/tooling facts for launching and authoring workflows against these repos. This is a
**universal** steering file (identical in every repo — see `steering-consistency.md`); the
facts here are about the workflow tooling and the Windows host, not any one client, so they
are the same everywhere. Maintained canonically in `jcvgconsulting-platform`; when a copy
disagrees, this one wins.

These rules exist because a batch of real launch attempts failed on the SAME avoidable
mechanics, repeatedly. Learn them once; stop relearning them.

## 0. The casing + location gotchas that waste launches (MEMORIZE)

Workflow validation uses TWO different allowed-roots checks with DIFFERENT drive-letter
casing. Getting either wrong fails the launch with an "outside the allowed workspace roots"
or "stop condition would never match" error. The mechanical rules:

1. **The workflow DEFINITION file must live in a recipe root — the USER-level one,
   `C:\Users\<user>\.kiro\workflows\`** (uppercase `C:`). A per-repo `<repo>\.kiro\workflows\`
   is NOT an admitted launch root on this host — do not put a hand-authored definition
   there and launch it. Write it to `~/.kiro/workflows/<name>.workflow.json` and launch by
   that absolute path.
2. **The `workflowPath` you pass to launch must use an UPPERCASE drive letter** (`C:\Users\…`)
   — that is how the launcher's recipe-root list is spelled.
3. **Any `fileCheck` / stop-condition `path` inside the definition must use a LOWERCASE
   drive letter** (`c:\Users\…`) — that is how the VALIDATOR's workspace-root list is
   normalized. An uppercase `C:` fileCheck path fails as "outside roots" even though the
   same location is admitted.
4. **A `fileCheck` path must NOT live under `.worktrees/`.** The validator treats a worktree
   subpath as outside the workspace roots, so the stop condition "would never match." Put
   the stop-condition JSON at the **plain repo-root `.scratch/`** of an admitted repo
   (e.g. `c:\Users\…\rainforest-kb\.scratch\<name>-review.json`) — NOT in the worktree the
   workflow edits. The reviewer step writes the verdict file there; the doc edits still
   happen in the worktree.

Net: launch path = **UPPER** `C:` under `~/.kiro/workflows/`; every in-definition fileCheck
path = **lower** `c:` under a repo-root `.scratch/`, never `.worktrees/`.

## 1. Hand-authored definition shape

When writing a `.workflow.json` by hand (rather than letting the creator design one):

- Top-level keys are `version`, `name`, `description`, and **`steps`** (an ARRAY). There is
  **no `root` wrapper** — a `{ "root": { ... } }` shape fails schema validation with
  `steps: Required`.
- Node types inside `steps`: `step` (`id`, `agent`, `prompt`), `sequence` (`steps`),
  `parallel` (`branches`, `joinPolicy`), `repeat` (`steps`, `maxIterations`,
  `onMaxIterations`, and exactly one of `stopCondition`/`stopWhen`), `watch`.
- A `repeat` loop's `stopCondition.fileCheck` is the usual gate for an implement→review
  loop: `{ "path": <lowercase-c, repo-root .scratch>, "jsonPath": "verdict", "value":
  "APPROVED" }`. The reviewer step writes that JSON **last**; the loop gates on the FILE,
  not on the reviewer's `send_message` signal.
- `onMaxIterations: "pause"` pauses the run if the loop exhausts its budget — recover with
  `update_workflow` (`extend_repeat`, or `update_status` on the loop node = `completed`).

## 2. Prefer the creator; relaunch a generated definition rather than regenerate

- Default to launching with a `workflowPrompt` brief and let the workflow-creator design the
  JSON — it knows the schema and runs a validation loop. Hand-author (§1) only when the
  creator keeps tripping on a mechanical constraint you must control (e.g. the fileCheck
  path casing above).
- When a `workflowPrompt` launch FAILS validation, the result carries a
  `generated://<id>` ref and its inputs. **Relaunch that ref** (fixing the offending input)
  instead of paying for another creator dispatch — it is single-use but survives a failed
  launch. If the fault was a fileCheck path the creator chose under `.worktrees/`, that is
  the §0.4 trap; hand-author instead.

## 3. Worktree workflows: cleanup is gated on TERMINAL + pushed (see worktree-cleanup rule)

A worktree-based workflow owns its worktree for the whole run. Do NOT remove the worktree
until the run is **terminal** (`inspect_workflow` shows completed/failed/aborted — not "the
last notification looked done"), no step session is still reading from it, and the branch is
on origin. Removing it early (while a watch/review loop still reads `.scratch/` inside it)
kills the run with ENOENT and reports a false failure. The orchestrator — not an in-worktree
step — removes the worktree after the run is terminal, each `git worktree remove` as its own
verified command. (The infra repos carry this as `workflow-worktree-cleanup.md`; it is part
of the universal set.)

## 4. Delegate substantive work; keep the gates yourself

For large multi-file authoring/mining across these KBs, delegate to a workflow (investigate
→ author → review loop). But the **blocking gates for this fleet — client ISOLATION and
no-plaintext-SECRETS — are the orchestrator's to verify independently** after the run, not
only the in-workflow reviewer's: re-run the repo's isolation gate and a credential-leak grep
before trusting a PR. Consistency of that verification is itself a security property (see
`isolation.md`, `kb-structure.md`).

## See also

- `steering-consistency.md` — the universal-vs-repo-specific steering model (this file is
  universal).
- `shell-discipline.md` — one-command-one-action, verify real state, the OSC-633 trap.
- `workflow-worktree-cleanup.md` (universal) — the terminal-before-remove worktree gate.
- `repo-architecture.md` — the MSP repo model these workflows operate across.
