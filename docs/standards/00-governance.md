# 00 — Governance & Documentation Policy

## Mandatory language policy
All studio standards, project documentation, headings, examples, changelogs, code comments, AI-agent instructions, plans, and review reports must be written in English. Direct conversations with the owner may remain in Vietnamese. Preserve legally required translations, player-facing localization, and exact external identifiers.

## Purpose
Define ownership, lifecycle, traceability and boundaries between studio standards and project documents.

## Document states
- **Draft:** work in progress; may contain open questions.
- **In Review:** ready for designer/tech lead review.
- **Approved:** baseline for implementation.
- **Deprecated:** retained for traceability, not new work.

## Metadata contract
Detailed specs (MEC, ARCH, INT, TEST) start with this front matter:
```yaml
---
id: MEC-001
type: mechanic
status: draft
owner: game-design
version: 0.1
parent: GDD
related: []
studio_standard: 0.1
updated: YYYY-MM-DD
---
```

## Ownership / source of truth
| Information | Authoritative document |
| --- | --- |
| Product goal, pillars | Game Brief / GDD |
| Exact gameplay behavior | Mechanic Spec |
| Numerical tuning values | Balance config |
| Module boundaries | Architecture |
| Technical trade-off | ADR (`docs/DECISIONS.md`) |
| Third-party payloads | Integration spec / Event catalog |
| Test evidence | Test plan / test report |

## Change policy
1. Propose change with rationale.
2. Identify affected specs, code, metrics and tests.
3. Approve behavior changes before coding.
4. Implement and verify.
5. Synchronize approved docs and references in the same change set.

## Creation rule
Create a new spec only when a section has nontrivial rules, independent lifecycle, multiple contributors, or reusable contracts. Do not generate placeholder trees.

## Notion / Git
Git holds the approved, versioned snapshot and is the only source agents need. Notion (if used) is an authoring/review workspace; synchronization is a separate, explicit workflow, never assumed automatic. Resolve conflicts explicitly.

## Open review questions (studio-level)
- Who approves each document type?
- Which changes require a formal ADR?
- How are versions and sync conflicts handled?
