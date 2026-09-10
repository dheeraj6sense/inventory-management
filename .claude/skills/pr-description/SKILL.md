---
name: pr-description
description: Generate a PR description (summary + test plan) from the current branch's git diff and commit history against a base branch. Use when the user asks to draft, write, or regenerate a pull request description/summary.
---

# PR Description Generator

Produce a PR title and body (Summary + Test plan) from the *entire* set of
changes on the current branch relative to a base branch — not just the
latest commit. Optional argument: a base branch name (defaults to `main`).

## Steps

1. **Determine the base branch.** Use the argument passed to this skill if
   given, otherwise default to `main`. Confirm it exists:
   ```bash
   git fetch origin <base> 2>&1 | tail -5
   ```

2. **Gather the full context in parallel** (these are independent
   read-only commands):
   - All commits ahead of the base (not just the tip commit):
     ```bash
     git log --oneline origin/<base>..HEAD
     ```
   - Full diff of everything the PR would introduce:
     ```bash
     git diff origin/<base>...HEAD
     ```
   - Diffstat for a quick file-level overview:
     ```bash
     git diff --stat origin/<base>...HEAD
     ```
   - Uncommitted local changes, if any (flag these separately — they won't
     be in the PR unless committed):
     ```bash
     git status -sb
     ```

3. **Read the actual diff, not just commit messages.** Commit messages can
   be stale, vague, or missing; the diff is ground truth for what changed.
   Skim every changed file in the diff before writing the summary.

4. **Draft the title:**
   - Under 70 characters.
   - Describes the overall change, not the last commit only.
   - Use imperative mood ("Add X", "Fix Y"), matching this repo's commit
     style (see `git log` on the base branch for examples).

5. **Draft the body** using this structure (matches the repo's existing PR
   convention):
   ```markdown
   ## Summary
   - <bullet per logical change, grouped by feature/file area, not one
     bullet per commit>

   ## Test plan
   - [ ] <manual/automated verification step>
   - [ ] <edge case or regression check>
   ```
   - Summarize the **why**, not just the **what**, when it's evident from
     commit messages or code comments.
   - For the test plan, look at what actually changed to propose concrete
     checks (e.g. "click the Quantity header and confirm sort toggles" for
     a UI sort feature, "run `pytest tests/backend/`" for a backend
     endpoint change) rather than generic boilerplate.
   - Mark steps `[x]` only if you actually ran them in this session and
     confirmed the result; otherwise leave `[ ]` for the user to verify.

6. **Present the draft to the user** as the final output of this skill.
   Do not run `gh pr create` unless the user explicitly asks to open the
   PR — this skill's job is to produce the description, not to publish it.
   If they do ask to create the PR, follow the repo's existing PR-creation
   convention (heredoc body, `Co-Authored-By`/Claude Code attribution
   footer per the session's attribution instructions).

## Notes

- If there are no commits ahead of the base branch, say so plainly instead
  of fabricating a description.
- If uncommitted changes exist, mention them separately and ask whether
  they should be committed first — don't silently fold them into the PR
  summary as if they were already part of history.
