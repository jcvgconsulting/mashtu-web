# Shell discipline — analyze before you act (PowerShell / pwsh on Windows)

Host-wide rules for running shell commands on this Windows / PowerShell dev host. These
are **not** project-specific — they govern how the agent issues ANY `execute_pwsh`
command in ANY repo, and the identical copy of this file lives in every repo. The failures
below are real and repeated; the rules are hard, not advisory.

## 000. ONE command, ONE action — NEVER chain statements

The empty-output / lone `C` / `exit -1` returns on this host come from CHAINING multiple
statements into one `execute_pwsh` call. It is CARELESS COMMAND WRITING, not a terminal
fault. The chains are banned outright.

HARD RULES — a pre-flight gate, not a recovery step:

1. **Each `execute_pwsh` call runs exactly ONE logical action.** A `git add`, a
   `git commit`, a `git push`, a `git status`, a `tofu validate`, a `gh pr merge` — each
   is its OWN separate call. Do NOT append `; git commit …` after a `git add`, do NOT
   chain `git worktree remove … ; git branch -D …`. Chaining is the single most common
   cause of the empty/`-1` return.
2. **Reading a result is its own call.** If a command writes to a `.scratch/` file, the
   `Get-Content`/read that reads it back is a SEPARATE call. (A single `cmd > file 2>&1`
   redirect inside one command is fine; chaining the writer and the reader with `;` is
   not.)
3. **The ~2-statement ceiling is absolute.** If a flow needs step → step → step, that is
   N separate calls run in sequence, each verified before the next — NOT one line. "It's
   just a quick chain" is the exact thought that causes this; reject it.
4. **A lone `C` or empty output + `exit -1`:** if the call was CHAINED (the usual case),
   that is the bug — STOP and re-issue as separate single-action calls. If it was a
   single network command (`git push`/`ssh`/`scp`), the return channel may have dropped
   on a command that SUCCEEDED. Either way: NEVER narrate it as a flake and NEVER assume
   it ran — VERIFY THE REAL STATE with its own separate read (`git status -sb`,
   `git log -1`, `git worktree list`, `gh pr view`), and redo only what the state shows
   did not take.

### The MECHANISM behind the lone `C` / `exit -1` (understood, not hand-waved)

This is NOT a mystery and must never be dismissed as a "glitch." It is a **documented
VS Code shell-integration race** on Windows PowerShell, and it is a consequence of command
complexity — the two facts are compatible, not contradictory:

- VS Code wraps every command with **OSC 633 shell-integration markers**: `633;C` marks
  command-START, `633;D` marks command-FINISHED (see microsoft/vscode issue #316222,
  "Run in terminal sync mode returns stale `^C` in Remote-SSH Windows/PowerShell"). The
  lone `C` is the **`633;C` marker fragment** leaking into captured stdout (a `633;C`
  fragment was literally observed in a capture — that is the proof, not a theory).
- Per that issue, Windows PowerShell can report an **interrupted / empty command as its
  own finished event** (`633;E;; … 633;C … 633;D`), and that empty finished-event **wins
  the sync completion race before the real command's output is captured** — so the
  harness returns the stray `C` and `exit -1` even though the underlying command
  frequently RAN.
- Why it tracks complexity: a long, chained, multi-statement one-liner (pattern array +
  pipe + redirect + `;` + a second statement) takes longer to parse/execute, widening the
  window for that race, and any mid-line interrupt surfaces as the empty event. A single
  simple command rarely hits it. **The fix is on the author's side: remove the complexity
  that opens the window.** Naming the mechanism is an explanation, NEVER a licence to
  re-run the same one-liner.

### The REMEDY that works (proven in practice)

When logic is more than one trivial command, do NOT escalate to a bigger/cleverer
one-liner — that is the mistake repeating. Instead:

1. **Write a `.ps1` to `.scratch/`** with the fs_write tool, with the DATA BAKED INTO THE
   SCRIPT (e.g. a `$terms = @('a','b','Multi Word', …)` array declared *inside* the file).
   Do NOT pass arrays or multi-word tokens on the `-Command`/`-File` line — inline array
   quoting is its own failure (a bare `"Sea Haven"` in a comma-separated arg list splits
   on the space and errors). Pass only simple scalars (a path, a flag). A file has no
   `-Command` quoting/length/escaping fragility and is re-readable and debuggable.
2. **Run it as ONE atomic invocation:** `pwsh -File .scratch\do-thing.ps1 [-Scalar val]`.
   The script writes its real result to a `.scratch/` file.
3. **Read that result file with the read tool in a SEPARATE call** — never `; Get-Content`
   appended to the runner.

## 00. NEVER blame the tooling — own the mistake, then write it carefully

The deepest recurring failure is the REFLEX of narrating a tooling excuse ("the terminal
swallowed the output", "the channel dropped", "a known trap") instead of accepting that
the command was written carelessly. Banned.

- Do NOT attribute a failure to "a known trap", "the terminal", "the channel", or any
  external cause — especially not pre-emptively, before there is evidence. If a command
  failed, the default assumption is: it was WRITTEN WRONG. Fix the command; do not
  editorialize about the tool.
- Do NOT describe what *usually* goes wrong as if it explains THIS case. Either it
  demonstrably happened (show the evidence — e.g. an actual `633;C` fragment) or do not
  mention it.
- The correct response to a failed/empty command is SILENT CORRECTION: re-author it
  carefully (as a script file when non-trivial), run it, verify the real result. No
  narration of fault.
- Be careful the FIRST time: read the command back and confirm its quoting, escaping, and
  structure before running. Carelessness is the cause; care is the fix.

## 0a. The script choice is a PRE-FLIGHT gate, not a recovery step

Knowing the rule and still writing the one-liner is the failure. "I'll move it into a
script" AFTER it returns empty/`-1` means the rule was applied one attempt too late.
MECHANICAL PRE-FLIGHT COUNT — before running ANY shell command, count: separate
executable invocations (each `& $exe …`, each `cmd1; cmd2`, each piped stage that is
itself a command); `if`/`foreach`/`try`/`&&`/`||` control words; subexpressions
(`$(...)`, `@(...)`) and string interpolations that build arguments. If that count is
MORE than ~2, or there is ANY control word, it goes in a `.ps1` FIRST. A single `git
status` or one `tofu fmt` is fine inline; two or more invocations, or any control flow,
is a script — decided up front.

## 1. Metacharacters, env vars, separators

- Use `$env:TEMP`, `$env:LOCALAPPDATA`, `$env:USERPROFILE` — NEVER cmd-style `%TEMP%`
  (pwsh treats `%TEMP%` as a literal filename).
- The command separator is `;`, never `&&`.
- `$(...)`, `$env:X`, and backticks are expanded by the LOCAL pwsh before anything runs.
  Quote and escape deliberately; read the command back before running it.
- For a remote command that needs shell substitution, run the substitution REMOTELY —
  single-quote the `ssh` payload so pwsh does not expand it, or put the remote script in a
  file and run `bash <file>` remotely. Never embed `$(...)` meant for the remote shell
  inside a pwsh double-quoted string.

## 2. Remote work: write a script, copy it, run it — never pipe here-strings

- Piping a pwsh here-string into `ssh … "bash -s"` is UNRELIABLE here (empty output,
  silent failures, CRLF leaking into bash as `$'\r'`). Instead: write the script to a
  local file, LF-normalize it (replace `\r\n` and `\r` with `\n`, write UTF-8 without
  BOM), copy it over, then run it as a file.
- A multi-STATEMENT inline `ssh "…;…;…"` is the same complexity failure wearing a remote
  hat — pwsh parses the double-quoted string first and the embedded `;` + nested quoting
  can leave an unterminated construct that HANGS at a `r>` continuation prompt. One remote
  statement inline is fine; two or more go in a file.
- **On OpenSSH 9.0+ (Windows), always `scp -O`.** Plain `scp` uses SFTP by default and can
  hang on channel-close; `-O` forces the legacy SCP protocol and exits cleanly. `ssh -n`
  (stdin from null) avoids the client-side teardown hang after a remote command finishes.

## 3. Verify real resulting state — never trust exit codes blindly

State is truth; exit codes are advisory. After a `git`/`tofu`/`ssh`/network operation,
verify the actual result with a SEPARATE read (`git log -1`, `git status -sb`,
`git ls-files`, `tofu state list`, an `ls`/`Test-Path`) rather than assuming the exit code
told the whole story. Beware self-matching checks (`pgrep -f <name>` matches its own
command line).

## 4. Capture output to a FILE in `.scratch/`, then read it

When a command's output must be read, redirect it to a file in the workspace-local
`.scratch/` and read that file — not the OS temp dir. A path inside the trusted workspace
(e.g. `<workspace>/.scratch/`, gitignored) does not trip tool-approval prompts on every
read; `$env:TEMP` / `/tmp` sits outside the workspace root and does. A simple
`cmd > .scratch\out.txt 2>&1` capture is fine for a single long-output command; non-trivial
logic goes in a script (§0). If a capture came back empty/`-1`, that is the complexity
signal — move the logic into a `.ps1`, do not re-run a tweaked one-liner.

## 5. Secrets: read NAMES, never VALUES, into context

- To learn a secrets/env file's shape, print only the LEFT-HAND SIDE of each assignment
  (the key names), never the values.
- To make an authenticated call, use a SCRIPT that sources the keys into the subprocess
  and writes back ONLY the non-secret result to a `.scratch/` file. Secret values stay in
  the subprocess and never surface in the command, the output, or context.
- Get the operator's explicit go-ahead before running any outbound authenticated call on
  their behalf.

## 6. Never run interactive or hanging commands

Avoid interactive flags (`git -i`/`--interactive`), pagers, REPLs, and watch-style loops —
they hang the agent. Some commands prompt on failure (e.g. `git worktree remove --force`
on a locked directory) and will hang waiting for input; prefer `git worktree prune` over
fighting a prompt. NEVER run `sudo` over a non-interactive `ssh` session (it prompts for a
password on a TTY that is not there and hangs) — query without privilege, or rely on a
pre-provisioned NOPASSWD entry.

## 7. The standing rule

Before running ANY shell command, read it back and ask: is this more than ~2 statements or
does it have a loop / try-catch / HTTP call / JSON build (→ script file per §0)? Is there a
`%VAR%` / `&&` / `$()`-for-remote / here-string-pipe / interactive-prompt trap? How will I
VERIFY the real result rather than trust the exit code (§3)? Fix it BEFORE running, not
after it fails.
