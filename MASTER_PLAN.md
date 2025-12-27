# Taykof PWA — Master Plan

Current stable version: v0.3.0  
Last updated: 2025-12-27

---

## Purpose of This Document

This document is the single source of truth for how Taykof is built and evolved.


## Global UI Standards

These rules apply across all tabs/screens:

- The top-of-screen title MUST be consistent across Athletes / Log / Poles / Settings:
  - One title only (no redundant subtitles like “Jump Log” or “Preferences”).
  - Same font, size, spacing, and placement on every screen.
- Instructional helper text under titles SHOULD be removed where the UI is self-explanatory.
- Branding:
  - The app name “TAYKOF” should not be tiny text.
  - Replace with a more professional header treatment (logo/wordmark).
- Bottom navigation:
  - Make the bottom nav slightly larger and positioned slightly higher for easier tapping on phones.

---

## Athletes

### Athletes List Screen

What works now:
- Adding athletes is fast and straightforward.
- Deleting athletes is fast and straightforward.

Required behavior:
- Remove the instructional text under the Athletes title.
- Layout order MUST be:
  1) Saved athletes list (top)
  2) Add athlete form (below)
- Athlete add fields:
  - Name is required.
  - Sex selection remains for quick reference.

Nice-to-have / later:
- Archive athletes (keep their data but remove from active list). This may be deferred until a future login/cloud phase.

### Athlete Detail Screen

What works now:
- The athlete detail view is simple.

Required behavior:
- Add an edit affordance (small pencil icon) to edit athlete details.
- PR handling:
  - Manual PR entry should remain available.
  - PR input should be feet/inches as two fields when using imperial:
    - Feet field
    - Inches field (supports decimals as needed)
  - On mobile, numeric fields should open a numeric keypad (not full keyboard) for speed.
- Reduce PR/save confusion:
  - Do NOT place “View jump log” directly under a PR input in a way that reads as a “Save” button.
  - PR should be displayed as a section with the current PR visible.
  - Editing PR should be a deliberate action (e.g., pencil icon opens edit inputs).

PR automation (cross-screen rule):
- If a coach logs a Competition “Make” at a height higher than the recorded PR:
  - Show a prompt: “This appears to be a new PR. Save it?”
  - Only update PR if the coach confirms.
- Same-height clears do NOT count as a PR.
- Unit conversion MUST be handled correctly because competitions may use imperial or metric.

Athlete detail enhancements:
- Show a small list of recent jumps for that athlete on the athlete detail page (target: ~3–4, final number TBD).
- Provide a button below that list labeled “See All Jumps” that navigates to the athlete’s full jump history.

---

## Log

What works now:
- Page is clean and simple; fits “quick logging on the track.”

Required header behavior:
- Remove redundant header text (“Log” + “Jump log”).
- Remove instructional text under the title.

### Athlete selection
- Athlete dropdown MUST be fast and easy:
  - Athlete list should be alphabetized.
- Nice-to-have:
  - A Male/Female quick filter/toggle above athlete dropdown to speed selection for large rosters.

### Timestamp behavior
- Remove the Date input from the Log form.
- Each saved jump MUST automatically receive a date + time timestamp at the moment “Add jump” is pressed.

### Form order and defaults
- After Athlete selection, show Practice/Competition selection next (it drives the rest of the form).
- For a selected athlete, the Log form SHOULD default to the values used in that athlete’s previous logged jump (where applicable).

### Competition mode (attempt tracking)
- If Competition is selected:
  - Show Attempt buttons: 1 / 2 / 3.
  - Attempt should auto-cycle forward after logging.
  - If the last attempt was a MAKE and the coach moves to a new height, attempt resets to 1.
  - Coach MUST be able to override the attempt selection manually (for cases where a jump was not logged in real time).

### Bar height input
- Bar height should be placed directly below Practice/Competition selection.
- Bar height should auto-populate with the previous bar height for that athlete (regardless of make or miss).
- Imperial input preference:
  - Feet + Inches in separate inputs.
  - Inches supports two decimal places for speed and precision.

### Practice mode (bar up rules)
- If Practice is selected:
  - Show Bar up? Yes/No.
  - If Bar up = No:
    - Hide bar height input.
    - Hide make/miss result controls.
  - If Bar up = Yes:
    - Show bar height input.
    - Show make/miss result controls.
  - Height should still default to last used height when relevant.

### Optional per-jump fields (toggled from Settings)
All of the following should be storable per jump, but only appear in the Log form if enabled in Settings:

1) Steps
- Settings selects counting mode:
  - “Lefts/Rights” → dropdown 1–10
  - “Steps” → dropdown 1–20

2) Approach distance (imperial/metric)
- If imperial: Feet input + Inches dropdown 1–12 (whole inches, no decimals)

3) Coach’s mark distance (same input patterns as approach)

4) Takeoff step distance (same input patterns as approach)

5) Pole selection
- Dropdown populated from the Poles screen inventory
- First option: “Add new pole”

6) Grip height (imperial/metric)
- If imperial: Feet input + Inches dropdown (whole inches)

7) Standards
- Metric: dropdown 40–80 cm in 5 cm increments
- Imperial: dropdown 18–31.5 inches in 1-inch increments (with 31.5 as a special final option)

8) Landing
- Buttons: Shallow / Centered / Deep

9) Pole bend
- Buttons: Too much / Just right / Too little (wording may be refined later)

10) Notes
- Notes remain optional and should stay supported.

### Recent jumps and full review separation
- On the Log screen, show only the most recent ~3 jumps for the currently selected athlete.
- Provide a button near the top of the Log screen (“See Jump Log” or similar) that takes the user to a separate review screen where:
  - Athlete is selected for review
  - Jumps are grouped by date
  - Within a date, jumps are separated into Practice vs Competition (warmups before competition attempts)

Scaling consideration (later):
- Athletes may accumulate hundreds/thousands of jumps over time.
- Long-term options may include archiving or pruning very old practice jumps (not an immediate requirement).

Video (future):
- Eventually: record video directly in-app and attach to jumps with cloud storage (future phase).
- Possible interim: allow attaching a link (e.g., Google Photos link) to a jump (future consideration).

---

## Poles

Current state:
- Placeholder / coming soon.

Required header behavior:
- Poles title should match the same top title styling as other tabs.

Required functionality:
- Allow creating and managing a list of poles organized into:
  - Team Bag
  - Borrowed Poles

Pole fields when adding/editing:
- Required:
  - Length
  - Weight rating
- Optional (toggleable via Settings):
  - Brand
  - Flex
  - Nickname

Sorting:
- Default sort: Length, then Weight.
- Optional sort modes: Brand or Flex (if those fields are enabled).

Log integration:
- When pole selection is enabled on the Log screen, the pole dropdown MUST reflect poles stored here.

Nice-to-have / later:
- “Wish List” button at bottom of Poles screen for poles not yet owned.
- Future idea: “suggested pole” helper (details TBD).

---

## Settings

Required header behavior:
- Remove redundant “Preferences” header and instructions.
- Show only “Settings” with standardized title styling.

Settings MUST organize controls into logical groups and support toggles implied by Athletes/Log/Poles.

### Appearance
- Support Light/Dark mode selection (even if default remains light-first for outdoor use).

### Units
- Imperial vs Metric preference (used across Log inputs and conversions).

### Logging options (feature toggles)
- Toggles for optional Log fields:
  - Steps (and steps counting mode selection)
  - Approach distance
  - Coach’s mark
  - Takeoff step
  - Pole selection
  - Grip height
  - Standards
  - Landing
  - Pole bend
  - Notes (if ever made toggleable; currently assumed always available)

### Poles options (field toggles)
- Toggle display/storage of:
  - Brand
  - Flex
  - Nickname

### Data management
- Export/backup feature is required:
  - Export to spreadsheet-friendly format(s).
- (Existing clear/reset data features should remain safe and explicit.)

Wishlist / long-term:
- Integration with meet tracking apps (e.g., SportTrax) to import meet results and auto-add bar heights/makes/misses/place to competition data (future/backburner).
- App store packaging (iOS/Android), free vs paid tiers, pricing model (future planning).
- Website + login + cloud storage + coach/athlete permissions (far-future platform goal).

---

## Product Rules and Data Rules

- Name collisions:
  - Mitigate duplicate names by expecting First + Last.
  - Graduation year may be used as an additional optional disambiguator.
- Corrections:
  - No undo required; use edit controls for corrections.
- PR rules:
  - PR updates only from Competition makes.
  - Always ask to confirm saving the PR.
  - Same height does not count as a PR.
  - Unit conversion matters and must be handled correctly.
- Review grouping:
  - Organize by date.
  - Within date: separate Practice vs Competition (warmups vs meet attempts).
