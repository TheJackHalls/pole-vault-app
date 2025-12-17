# Taykof PWA — Roadmap (Version Plan)

This roadmap is a **living release map** for Taykof.  
It is designed for a **solo builder + AI (Codex)** workflow: small releases, clear scope, and frequent iPhone smoke tests.

Rules:
- Each release should have **one goal** and **1–3 scope items**.
- After every minor release, run `RELEASE_CHECKLIST.md` on iPhone PWA before tagging.
- Patch releases are reserved for fixes only.

---

## Current Stable

- **v0.2.1** — Stability cleanup (iOS taps, init/storage hardening, log rule fixes)

---

## v0.3.0 — UI Consistency + Athletes UX Safety

**Goal:** Make the app feel cleaner and less confusing without adding new data features.

**In scope:**
- Standardize top titles across all tabs (one title only; consistent styling).
- Remove redundant instructional text on Athletes/Log/Settings where unnecessary.
- Athletes screen layout: athlete list at top; add-athlete form below.

**Not in scope:**
- New log fields, exports, attempts, PR automation.

**Test focus:**
- Bottom nav taps
- Add/delete athlete
- Athlete detail navigation

**Tag when:** passes iPhone smoke test.

---

## v0.3.1 — Fixes Only (if needed)

**Goal:** Patch any regressions found after v0.3.0.

**In scope:** bugfixes only.

**Tag when:** fixes verified on iPhone.

---

## v0.4.0 — Log Fundamentals (Speed + Defaults)

**Goal:** Make logging faster and more “track-ready” without adding many new fields.

**In scope:**
- Remove manual date input; automatically timestamp on “Add Jump”.
- Reorder Log form: Athlete → Practice/Competition → rest.
- Athlete dropdown alphabetized.

**Not in scope:**
- Attempts cycling, PR automation, poles inventory, exports.

**Test focus:**
- Log 20 jumps in a row without friction
- Practice “bar up?” hide/show rules
- Competition make/miss saves

**Tag when:** logging feels reliable at practice pace.

---

## v0.4.1 — Fixes Only (if needed)

**Goal:** Patch any regressions found after v0.4.0.

---

## v0.5.0 — Review Screen + Session Grouping

**Goal:** Separate “logging” from “review” so jump history is scalable.

**In scope:**
- Add “See Jump Log” (review screen) accessible from Log.
- Review flow: select athlete → jumps grouped by date → within date split Practice vs Competition.

**Not in scope:**
- Export, attempts cycling, PR automation.

**Test focus:**
- Review loads fast
- Grouping is correct
- Navigation between Log ↔ Review is clean

**Tag when:** review is usable and doesn’t lag with growing data.

---

## v0.6.0 — Poles MVP + Log Integration

**Goal:** Add a practical pole list that can be selected during logging.

**In scope:**
- Poles page supports two lists: Team Bag / Borrowed.
- Add/edit poles with required fields: Length + Weight rating.
- Optional fields (toggleable in Settings): Brand, Flex, Nickname.
- Default sort: Length then Weight.
- Log screen pole dropdown pulls from poles inventory (when pole selection is enabled).

**Not in scope:**
- Wish List, “suggested pole”, exports.

**Test focus:**
- Add poles quickly
- Sorting works
- Log pole selection reflects changes immediately

**Tag when:** pole selection works smoothly on iPhone.

---

## v0.7.0 — Competition Attempts (1/2/3) + Smart Cycling

**Goal:** Make meet logging feel natural.

**In scope:**
- Competition mode shows attempt buttons 1/2/3.
- Attempt auto-advances after save.
- Attempt resets to 1 when height changes after a make.
- Manual override always available.

**Not in scope:**
- PR automation, exports.

**Test focus:**
- Simulate a meet: backfills, missed logs, manual overrides
- Ensure attempts don’t “trap” the coach in a wrong state

**Tag when:** competition logging is trustworthy.

---

## v0.8.0 — PR Automation (Competition Makes Only)

**Goal:** PR tracking becomes reliable, verified, and unit-aware.

**In scope:**
- Only Competition makes can trigger PR suggestion.
- Prompt coach to confirm saving PR.
- Same-height clears do not count.
- Unit conversion handled (imperial ↔ metric).

**Not in scope:**
- Exports, video.

**Test focus:**
- Mixed-unit scenarios
- Confirm prompt appears at correct times only

**Tag when:** PR logic never surprises the coach.

---

## v0.9.0 — Export / Backup

**Goal:** Data safety so seasons of logging aren’t trapped on one phone.

**In scope:**
- Export to spreadsheet-friendly format (CSV).
- Export supports meaningful grouping (at minimum per athlete; optional per date/session later).

**Not in scope:**
- Cloud sync, accounts.

**Test focus:**
- Export opens cleanly in Google Sheets / Excel
- Columns make sense
- Data matches what’s in the app

**Tag when:** you would trust export as a backup.

---

## v1.0.0 — Coach-Ready Stable

**Goal:** “Practice tomorrow with confidence” milestone.

**Requirements to call this v1.0.0:**
- Core workflow is complete and stable on iPhone PWA:
  - Athletes management (add/edit/delete)
  - Logging practice + competition
  - Review by date with practice/competition split
  - Poles inventory + selection (if enabled)
  - PR confirmation behavior (competition makes only)
- Export/backup exists.
- No known practice-stopper bugs.
- Performance acceptable with large logs (hundreds+ jumps).

**Tag when:** all requirements above pass `RELEASE_CHECKLIST.md`.

---

## Long-Term (Post–v1.0.0, Not Scheduled)

- Video recording/attachments + cloud storage
- Accounts/logins, permissions, multi-device sync
- Web dashboard
- Meet app integrations (e.g., SportTrax imports)
- App store packaging and monetization model
