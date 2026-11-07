# 07 — AI Agent Workflow (document router rules)

> Read only what the task needs. Do not interpret missing information as permission to invent game rules.

## Startup
1. Read `AGENTS.md` and `docs/README.md`.
2. Identify task type and affected requirement IDs (GDD-§n, MEC-xxx, INT-xxx).
3. Read approved source documents; check status and version.
4. Read dependent specs, code and tests as needed.
5. If authoritative specs conflict or are missing, ask for a decision.

## Routing boundary
`docs/README.md` is the single canonical task-routing table; `docs/CODEMAP.md` maps code locations and module boundaries. This page holds studio-wide rules only — do not create a second routing table here.

## Non-negotiable rules
- Approved gameplay rules are not silently modified.
- One source of truth per behavior, number and contract.
- No SDK initialization before its documented privacy gate where required.
- No hard-coded credentials.
- No new files solely to fill a folder tree.
- Implement against approved specs and test observable behavior.
- Record significant technical choices in an ADR (`docs/DECISIONS.md`).
- Update impacted docs and tests with code changes.

## Change workflow
Request → Impact analysis → Design approval → Implementation → Verification → Documentation sync.

## Stop and escalate (ask the owner)
Conflicting requirements, unresolved consent rules, ambiguous monetization behavior, missing acceptance criteria for risky changes, or changes to approved game pillars.
