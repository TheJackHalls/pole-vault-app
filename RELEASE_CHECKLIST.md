# Taykof PWA — Release Checklist

Use this checklist for every release (feature or bugfix). The goal is: ship small, test on iPhone, and never “silently break” practice-time use.

---

## 0) Decide Release Type + Scope (2 minutes)

- [ ] Release type:
  - [ ] Patch (v0.x.Y): bugfix / stability only
  - [ ] Minor (v0.X.0): planned improvements / small features
- [ ] Write the release goal in ONE sentence.
- [ ] List 1–3 changes ONLY.
- [ ] List explicit non-goals (what must NOT change).

Pause point:
- [ ] If scope feels bigger than 1–3 changes → split into two releases.

---

## 1) Update the Planning Docs (5 minutes)

- [ ] Update `MASTER_PLAN.md`:
  - [ ] Add/adjust the release goal + scope
  - [ ] Move any “new ideas” into Backlog (not in scope)
- [ ] (Optional) Create/append `RELEASE_NOTES.md` entry:
  - [ ] Version + date
  - [ ] What changed (bullets)
  - [ ] What to test (bullets)

---

## 2) Create a Tight Codex Prompt (5 minutes)

Your prompt MUST include:
- [ ] Repo + branch target
- [ ] “Follow `MASTER_PLAN.md`”
- [ ] Exact scope (1–3 changes)
- [ ] Explicit non-goals (no redesign / no new features unless listed)
- [ ] “Keep changes minimal and readable”
- [ ] A short test checklist for Codex to run after edits
- [ ] Permission to commit + commit message format

Pause point:
- [ ] If the prompt is longer than ~40 lines, it’s probably doing too much. Tighten scope.

---

## 3) PR / Change Review (10 minutes)

Before merging:
- [ ] Check “Files changed” count is reasonable for the scope.
- [ ] Sanity-scan for scope creep:
  - [ ] No surprise new pages/screens
  - [ ] No unrelated refactors
  - [ ] No CSS overhaul unless explicitly required
- [ ] Confirm no obvious regressions to:
  - [ ] Bottom nav tap targets
  - [ ] Offline behavior
  - [ ] Local data persistence
- [ ] Confirm commit message matches release (e.g., `v0.3.0: ...`)

---

## 4) Merge + Verify Deployment (GitHub Pages/PWA reality)

- [ ] Merge PR to `main`.
- [ ] Confirm the commit appears on `main`.

### Refresh / update steps (important for PWAs)
Desktop:
- [ ] Hard refresh the live site (Ctrl+Shift+R / Cmd+Shift+R).
- [ ] Open DevTools Console → confirm no errors on load.

iPhone Safari (browser):
- [ ] Open the live site in Safari and refresh.

iPhone PWA (Home Screen installed):
- [ ] Fully close the app (swipe it away), reopen.
- [ ] If it still looks like the old version:
  - [ ] Open the site in Safari and refresh again.
  - [ ] As a last resort: iOS Settings → Safari → Advanced → Website Data → delete site data, then reopen.

Pause point:
- [ ] If the live app doesn’t reflect changes, assume caching first (not “Codex failed”).

---

## 5) Smoke Test on iPhone (Required)

Run this every release. Keep it fast.

Global:
- [ ] Bottom nav: tap Athletes / Log / Poles / Settings repeatedly (no dead taps)
- [ ] Header/title looks correct and consistent
- [ ] App remains usable after several tab switches

Athletes:
- [ ] Add athlete
- [ ] Open athlete detail
- [ ] Edit athlete (if present)
- [ ] Delete athlete (confirm it behaves safely)

Log:
- [ ] Select athlete
- [ ] Practice flow:
  - [ ] Bar up = No → bar/result hidden
  - [ ] Bar up = Yes → bar/result visible
  - [ ] Add jump saves successfully
- [ ] Competition flow:
  - [ ] Make/Miss works
  - [ ] Add jump saves successfully
- [ ] Recent jumps show expected content (and only for selected athlete, if implemented)

Poles (when implemented):
- [ ] Add pole (required fields enforced)
- [ ] Pole list sorts as expected
- [ ] Log → pole dropdown reflects poles list (if enabled)

Settings:
- [ ] Units toggle works (and reflects in Log inputs)
- [ ] Feature toggles show/hide expected Log fields (if implemented)
- [ ] Any new settings don’t break navigation or loading

Offline check (quick):
- [ ] Put phone in Airplane Mode
- [ ] Open app → confirm it loads and you can view existing data

---

## 6) Post-Release Stability Check (Required)

- [ ] Desktop: open Console → confirm no uncaught errors on load.
- [ ] If anything felt “weird” on iPhone:
  - [ ] Run a Codex **diagnostic-only** pass (no edits) focused on the affected area.

---

## 7) Tag the Release (Recommended)

- [ ] Update `MASTER_PLAN.md` “Current stable version” to the new version.
- [ ] Create a GitHub Release / tag:
  - [ ] Tag name: `vX.Y.Z`
  - [ ] Title: same as tag
  - [ ] Notes: short bullet list of changes + what to test

---

## 8) Rollback Plan (If Something Breaks)

If the release introduced a practice-stopper bug:
- [ ] Revert the merge commit on `main`, or revert the PR via GitHub.
- [ ] Confirm live site works again (repeat refresh steps).
- [ ] Create a patch release (vX.Y.(Z+1)) with the fix.

---

## Definition of “Done” for a Release

A release is done when:
- [ ] iPhone PWA works reliably (no dead taps, no silent crashes)
- [ ] Core logging flow still feels fast
- [ ] Offline behavior still works
- [ ] Version is tagged and documented
