# 09 — AI Ruleset Changelog

Changes to the AI agent ruleset (not to the game). The game's own history is in the root `CHANGELOG.md`.

## [0.6.0] — 2026-11-06
- Simplified `AGENTS.md` into a compact entrypoint; removed mandatory workflow ceremonies, fixed context budgets and session-by-session status rewrites.
- Made optional skills and GitNexus non-blocking; kept core scope, gameplay approval, secrets, protected-action and proportionate verification safeguards.
- Kept `CLAUDE.md` as the shared `AGENTS.md` import and Claude-specific permissions in `.claude/settings.json`.

## [0.5.0] — 2026-11-06
### Added
- Task complexity routing (T1/T2/T3) to reduce unnecessary context loading and agent overhead.
- Multi-agent orchestration rules: main-agent ownership, bounded delegation, explicit scope/output contracts, non-overlapping work, and integration responsibility.
- Risk-based verification levels (L0–L3), separating focused checks during implementation from the full verification merge gate.
- Quality gate requirements for evidence-based reporting, impact review, deterministic checks, and severity-based review findings.
### Changed
- Consolidated repository task routing under `docs/README.md`; `docs/CODEMAP.md` remains the code-location map.
- Clarified that the AI Agent Document Router is a governance/reference page, not a competing routing table.
- Replaced full-suite runs before every commit and every merge with focused checks during development and one L3 full verification gate before merge, rerunning when later changes invalidate evidence.
### Governance
- The ruleset version is mirrored in the repository `AGENTS.md` snapshot.
- Project-level `CHANGELOG.md` remains a separate required setup file for recording that game's code/content changes.

## [0.4.0] — 2026-11-04
- Added optional GitNexus code-graph discovery and impact workflow with CODEMAP + grep fallback and safe `--index-only` indexing.
- Added focused test scope during implementation and full test suite + typecheck verification before commit and merge.

## [0.3.1] — 2026-11-03
- Added protected-action controls, soft file budget, single ruleset version source, example-path labels, compact STATUS guidance, and bounded subagent guidance.
- Deferred CI-at-first-code and one additional review item.

## [0.3.0] — 2026-11-03
- Added `docs/README.md` and `docs/CODEMAP.md` onboarding maps plus context-budget guidance to avoid scanning the repository.

## [0.2.0] — 2026-11-03
- Applied initial architecture review findings covering the file manifest and explicit paths, stack section, source-of-truth hierarchy, English-only repository content, Superpowers approval fallback, GDD requirements, secrets/public IDs, and playtest template.

## [0.1] — 2026-11-02
- Initial AI Agent ruleset.
