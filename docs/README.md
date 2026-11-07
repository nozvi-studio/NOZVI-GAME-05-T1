# Docs map (read this instead of scanning docs/)
Updated: 2026-11-07

## 1. Document index
Only files listed here exist. Status: Draft / Approved / Deprecated.
| ID | File | Owns (source of truth for) | Status |
|---|---|---|---|
| GDD | `docs/GDD.md` | Product intent, scope, milestones, mechanics index (MEC-001 lives in GDD §2) | Approved |
| STATUS | `docs/STATUS.md` | Current state, next steps, blockers | — |
| CODEMAP | `docs/CODEMAP.md` | Where code lives, module boundaries, entry points | — |
| DEC | `docs/DECISIONS.md` | Technical/design trade-offs (ADR-lite) | — |
| — | `CHANGELOG.md` | History | — |
| BAL | `config/balance.json` | Tuning values | — |
| ARCH | `docs/ARCHITECTURE.md` | Layering, core API contract, interactable names | Approved |
| MEC-002 | `docs/specs/mechanics/MEC-002-bowl-assembly.md` | Bowl assembly rules, quality formula | Approved |
| MEC-003 | `docs/specs/mechanics/MEC-003-customers.md` | Customers, patience, day flow | Approved |
| MEC-004 | `docs/specs/mechanics/MEC-004-serve-payment.md` | Serving and payment | Approved |
| ARCH-002 | `docs/specs/ARCH-002-visual-readability-and-feedback.md` | Visual readability, polish and feedback requirements (VIS-xxx), acceptance, owner decisions | Approved |
| PLAN-001 | `docs/plans/PLAN-001-visual-polish.md` | Ordered implementation plan for ARCH-002 (4 phases) | Approved |
| STD | `docs/standards/README.md` | Studio standards + AI rules index (binding) | Approved |
| STD-00…09 | `docs/standards/0x-*.md` | Governance, templates 01–06, agent workflow, setup manifest, ruleset changelog | Approved |
| TPL | `docs/standards/templates/` | Verbatim setup-file templates (incl. PLAYTEST) | Approved |

## 2. Routing: what to read per task
Read the "First" column; open "Then" only if the task needs it. Never read every file.
| Task | First | Then (only if needed) |
|---|---|---|
| New gameplay feature | GDD (relevant § only), STATUS | MEC spec, CODEMAP module row, related tests |
| Gameplay bug | MEC spec (or GDD §) for that behavior | CODEMAP module row → that module's files + tests |
| Balance / tuning | GDD §7, balance config | MEC spec §9 |
| Refactor | CODEMAP, ARCHITECTURE | DECISIONS (grep topic), module tests |
| UI / juice | GDD §6, §10 | ARCH-002 (VIS requirements), PLAN-001, CODEMAP ui row |
| Analytics / ads / SDK | INT spec | GDD §9, §12; CODEMAP integrations row |
| Playtest follow-up | PLAYTEST (latest entry only) | GDD §12 |
| Release | STATUS, CHANGELOG [Unreleased] | Test results, INT specs |
| Write a new spec (MEC / ARCH / INT / TEST) | Matching template in `docs/standards/` (03–06) | `docs/standards/00-governance.md` metadata |
| First playtest | `docs/standards/templates/PLAYTEST.md` | GDD §12 |
| Process / rules question | `docs/standards/07-agent-workflow.md` | `docs/standards/00-governance.md` |

## 3. Requirement IDs
IDs (GDD-§n, MEC-xxx, INT-xxx) appear in specs, in test names and in a one-line comment at the main implementing function, so `grep -r "MEC-001"` finds spec, code and tests without scanning.
