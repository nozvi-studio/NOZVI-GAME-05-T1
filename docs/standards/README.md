# Studio Standards & AI Vibe-Code Rules (repository snapshot)

> **This folder is the complete, self-contained rule set for this repository.** It mirrors two owner-approved Notion hubs — "AI Vibe-Code Rules — Casual Game" (ruleset 0.6.0) and "Studio Standards — Phase 1 Review (v0.1)" — so AI agents never need Notion access. **Every AI agent working here must follow these standards.** If this folder and Notion ever disagree, this folder wins until the owner approves a sync.

- **Ruleset version:** 0.6.0 (also mirrored in `AGENTS.md`)
- **Studio standards version:** 0.1 (Draft / For Review)
- **Snapshot date:** 2026-11-06

## Mandatory language policy
All documentation and AI-agent outputs must be written in English, including plans, reviews, changelogs, metadata, examples, and code comments. Direct conversation with the owner may remain in Vietnamese. Preserve legally required translations, player-facing localization, and exact vendor identifiers.

## Purpose
Reusable standards for a casual-game studio and project-specific documentation. Use layered, modular, on-demand documentation; avoid empty files and duplicate sources of truth.

## Architecture
- **Studio Standards** (this folder): governance, templates, engineering conventions, SDK patterns and agent rules.
- **Project Docs** (`docs/`): game-specific vision, GDD, mechanics, architecture, integrations, testing and releases.
- **L0–L5:** Vision → GDD → Design Specs → Technical Specs → Integrations → Verification/Delivery. Layers describe responsibilities, not mandatory implementation order.

## Principles
1. One authoritative owner for each rule or contract.
2. Link from GDD to detailed specs; do not repeat long rules.
3. Write testable behavior before implementation.
4. Create detailed specs only when complexity warrants them.
5. The approved Git snapshot is the coding agent's implementation baseline.
6. Never overwrite approved gameplay decisions without explicit review.

## Index
| File | What it is | Use when |
|---|---|---|
| [00-governance.md](00-governance.md) | Document states, metadata, ownership, change policy | Creating or changing any doc |
| [01-game-brief-template.md](01-game-brief-template.md) | Game Brief template | Starting a new game (input for the GDD) |
| [02-master-gdd-template.md](02-master-gdd-template.md) | Master GDD structure guidance | Restructuring or reviewing a GDD |
| [03-mechanic-spec-template.md](03-mechanic-spec-template.md) | Mechanic spec (MEC-xxx) | A mechanic has non-trivial rules or edge cases → `docs/specs/mechanics/MEC-xxx-<name>.md` |
| [04-architecture-template.md](04-architecture-template.md) | Technical architecture (ARCH) | Module boundaries/lifecycle need a contract → `docs/ARCHITECTURE.md` |
| [05-integration-template.md](05-integration-template.md) | Third-party integration (INT-xxx) | Adding any SDK (analytics, ads, crash, IAP) → `docs/integrations/INT-xxx-<name>.md` |
| [06-test-plan-template.md](06-test-plan-template.md) | Test plan | Milestone verification or release → `docs/TEST-PLAN.md` |
| [07-agent-workflow.md](07-agent-workflow.md) | Agent startup, non-negotiable rules, change workflow, escalation | Every task |
| [08-setup-manifest.md](08-setup-manifest.md) | Approved repo file manifest, setup procedure, validation checklist, optional tools | Setting up a new game repo or auditing this one |
| [09-ruleset-changelog.md](09-ruleset-changelog.md) | History of the AI ruleset | Understanding why a rule exists |
| [templates/](templates/) | Verbatim setup-file templates (incl. `PLAYTEST.md`) | Creating a setup file or the first playtest log |

Task routing for this project stays in `docs/README.md` (single canonical routing table); code locations stay in `docs/CODEMAP.md`.

## Changing these standards
Standards changes require owner approval and should be backed by observed workflow evidence or an explicit owner-directed improvement. Record the change in `09-ruleset-changelog.md`, bump the version here and in `AGENTS.md`, and add a `docs/DECISIONS.md` entry.
