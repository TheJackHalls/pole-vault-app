# Taykof PWA — Master Plan

## Purpose of This Document

This document is the **single source of truth** for how Taykof is built and evolved.

It exists to:

* Keep the project aligned with real coaching needs
* Prevent feature creep
* Give clear guidance to AI tools (Codex)
* Help future changes stay consistent and stable

If there is ever a conflict between ideas in chat, commits, or experiments, **this document wins**.

---

## What Taykof Is

Taykof is a **mobile-first, offline-capable PWA** designed to help a **high school pole vault coach** quickly log and review jumps during practice or competition.

It is:

* Coach-first
* Speed-focused
* Designed for one-handed use outdoors
* Meant to replace (or beat) a paper clipboard

---

## What Taykof Is Not (Current Scope)

Taykof is **not** currently:

* A recruiting platform
* A social app
* A deep analytics tool
* A cloud-synced system
* A multi-user athlete self-logging app

Those ideas may exist later, but they are **explicitly out of scope right now**.

---

## Core Design Principles (Non-Negotiable)

These rules apply to **every change**:

1. **Speed over completeness**
   If a feature slows practice down, it fails.

2. **Mobile-first always**
   iPhone Safari + PWA behavior matters more than desktop.

3. **Minimal taps**
   Fewer taps beats more data.

4. **Readable outdoors**
   Light mode, high contrast, large tap targets.

5. **Offline-first**
   The app must work with no internet.

6. **Stable > clever**
   Predictable and boring is better than fragile and fancy.

---

## Current State

**Current stable version:** v0.2.1
**Status:** Stable, reliable, ready for iteration

v0.2.1 focused on:

* iPhone tap reliability
* Preventing silent crashes
* Hardening storage and initialization
* Fixing jump log logic contradictions

---

## Page-by-Page Intent

### Athletes Page

**Primary job:**
Quickly select, add, and manage athletes without slowing practice.

**Must be fast:**

* Selecting an athlete
* Adding a new athlete
* Deleting an athlete (with safety)

**Secondary concerns:**

* Editing names/descriptors
* Viewing jump history

**Future improvement ideas (not commitments):**

* Better empty states
* Clearer confirmation before deletes
* Faster return to logging

---

### Log Page (Core Screen)

**Primary job:**
Log a jump in under ~5 seconds.

**Must be fast:**

* Athlete selection
* Bar height
* Make / miss
* Save

**Optional / secondary:**

* Notes
* Pole text
* Extra context fields (future)

**Rules:**

* Practice vs competition behavior must be predictable
* The app should remember recent context where possible
* Logging should never require unnecessary typing

This page has the **highest priority** in all decisions.

---

### Poles Page

**Primary job:**
Lightweight reference only.

**Current intent:**

* Simple list of poles with identifiers
* No tracking, no recommendations

If this page adds complexity without clear benefit, it should remain minimal or placeholder-level.

---

### Settings Page

**Primary job:**
Control behavior without cluttering practice screens.

**Appropriate settings:**

* Units (imperial / metric)
* Defaults that affect logging speed
* Data management (clear/reset)

Settings should be:

* Rarely used
* Easy to understand
* Safe (no accidental data loss)

---

## How Releases Are Planned

Work is organized into **small, outcome-based releases**.

Each release should have:

* One clear goal
* 1–3 small changes max
* A simple test checklist
* No unrelated extras

Example goals:

* “Logging is faster”
* “Review is easier to scan”
* “Mistakes are harder to make”

---

## Near-Term Roadmap (Living Section)

### v0.3.0 — Coach Workflow Improvement (Draft)

**Candidate goals (choose one):**

* Reduce taps when logging consecutive jumps
* Make recent jumps easier to scan
* Add safety/undo for common mistakes

Final scope to be defined before implementation.

---

## Backlog (Ideas, Not Promises)

These are intentionally **parked**:

* Approach distance
* Coach’s mark
* Steps
* Grip height
* Landing zone
* CSV export
* Video attachments
* Accounts / syncing

Presence here does **not** mean “coming soon.”

---

## Rules for AI Contributions (Codex)

When using AI tools:

* Always reference this document
* Fix stability issues before adding features
* Do not expand scope without updating this plan
* Prefer minimal, readable changes
* Avoid refactors unless explicitly requested

AI should behave like a careful assistant, not a product designer.

---

## Definition of Success

Taykof is successful if:

* A coach chooses it over paper
* It never distracts from practice
* Notes are useful the next day
* The app feels boring, reliable, and trustworthy

---

**This document will evolve.
Stability and clarity matter more than speed.**
