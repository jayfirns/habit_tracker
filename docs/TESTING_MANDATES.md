---
created: 2025-12-30T20:19
updated: 2025-12-31T10:17
---
# TESTING_MANDATES.md

🧭 Purpose

This document establishes non-negotiable testing standards for this repository. It exists to:
	•	Ensure consistent behavior across modules and contributors
	•	Prevent regressions through clear, enforced expectations
	•	Enable clarity when onboarding collaborators or switching tools
	•	Support modular development by validating interfaces and state changes

Testing is not a postscript — it defines behavior and drives architecture.

⸻

1️⃣ Mandatory Coverage Requirements

Every new feature, refactor, or bug fix must be accompanied by tests addressing the following dimensions (if applicable):

UI Logic
	•	Tab toggles, view switches, and user-driven DOM changes
	•	This includes testing that user events (e.g., `click`, `submit`) are correctly wired to their handler functions and trigger the expected state changes.
	•	Conditional rendering logic (e.g., chart modes, filters, popups)
	•	Responsive behaviors (e.g., resizing, scroll thresholds)

State Management
	•	Mutations to internal or external data stores must be reflected in UI
	•	Re-rendering and reactivity: does the UI update when data/state changes?
	•	Defaults and resets: are fallback states clearly testable?

Edge & Empty States
	•	Input: null, empty arrays, malformed objects, incomplete payloads
	•	Output: blank panels, warnings, hidden charts, disabled interactions

Global Exposure
	•	If a method or variable is exposed globally (e.g., window.updateEnergyMixData), it must:
	•	Be testable for existence
	•	Demonstrate expected behavior under known inputs
	•	Be safe to call repeatedly

Integration Boundaries
	•	DOM tests must simulate user actions and assert effects (e.g., via jsdom)
	•	Avoid testing internal logic unless it prevents regressions
	•	Persisted state must be validated end-to-end when cross-device behavior is required (e.g., backend save/load plus UI state lock)

⸻

2️⃣ Test Authoring Standards

All tests must follow these principles:

Naming
	•	✅ Good: test_toggle_chart_mode_updates_DOM
	•	❌ Bad: test_behavior or test_chart()

Structure

Use the clear format:

// 1. Setup
// 2. Act
// 3. Assert

Tests that fail should provide immediate clarity as to what failed and why. Use nested describe() blocks for grouped behavior.

Isolation
	•	Avoid cross-test dependencies
	•	Use beforeEach() and afterEach() to ensure clean environments

Clarity
	•	Prefer explicit selectors over brittle assumptions
	•	Minimize test mocking unless external dependencies demand it
	•	Comments are encouraged only when behavior is not self-evident

⸻

3️⃣ TDD Enforcement Workflow

This repository favors test-first implementation as a habit.

For any new behavior:
	1.	Write a failing test for what should exist or work
	2.	Implement the minimal code to pass the test
	3.	Refactor while the tests stay green
	4.	Repeat for additional behavior
	5.	Submit code + tests as a single atomic commit (or PR branch)

💡 If the test doesn’t fail without your code, it doesn’t count.

⸻

4️⃣ Assertion Checklist (Per Test Case)

Every test must answer these questions:
	•	What condition or behavior are we validating?
	•	Why does this matter to the system’s stability or UX?
	•	How are we confirming success/failure?
	•	Have we checked both expected and unexpected input?

If these answers aren’t evident in the test body, it’s not complete.

⸻

5️⃣ Maintenance & Refactor Mandates
	•	When functionality changes, related tests must be updated
	•	Deleted features must have their tests removed — no zombie assertions
	•	Tests that are consistently skipped/flaky must be fixed or quarantined and tracked
	•	When refactoring, tests must not only confirm that the new implementation works but also assert that no unintended side effects or behavioral changes have been introduced. If a behavioral change is intentional, it must be documented and have its own corresponding tests.

⸻

6️⃣ Encouraged Practices

These are not required, but strongly supported:
	•	Interaction Testing: For complex components, consider tests that simulate a full user journey (e.g., `click tab` -> `click toggle` -> `update data`) to validate how different states interact.
	•	Snapshot testing for static layouts (e.g., legend rendering)
	•	Visual diffing for canvas or SVG charts
	•	Test utilities (e.g., renderWithDOM(), mockEnergyMixData()) to reduce boilerplate
	•	Use data-testid when DOM selectors would otherwise be fragile

⸻

7️⃣ Test File Naming Convention

Use consistent test file paths:

component/
  MyPanel.js
  MyPanel.test.mjs   ✅

models/
  dataUtils.js
  dataUtils.spec.mjs ✅

lib/
  helpers.mjs
  helpers.test.mjs   ✅

Suffixes .test.mjs or .spec.mjs are accepted. Keep test files in the same directory as the file they validate unless globally scoped.

⸻

8️⃣ CI & Tooling Expectations
	•	Tests must pass locally before opening PRs
	•	If CI is configured, tests should be runnable via npm test or node --test
	•	Git hooks or workflows may block commits if minimum test coverage is not met

⸻

🔒 Final Mandate

No feature is considered implemented until its tests pass, cover the necessary edge cases, and can be understood by another developer reading them in isolation.
