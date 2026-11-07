# 08 — Setup Manifest & Procedure (AI Vibe-Code Rules 0.6.0)

Source of truth for the rule files an AI agent creates in a new casual-game repo. Verbatim payloads live in [templates/](templates/).

## How an agent sets up a repo
1. Read the approved file manifest below. Governance/standards pages are reference material, not per-project setup files (this repo keeps them in `docs/standards/` by owner decision so Notion is not needed).
2. For each manifest entry, use the listed destination path. Never derive paths from page titles.
3. Copy the template payload verbatim (from `templates/`), preserving Markdown fences and line breaks. If extraction is ambiguous, stop and ask.
4. Resolve placeholders from the approved Game Brief (`01-game-brief-template.md`) and the selected technology stack. Do not invent missing values.
5. Validate paths, required placeholders, commands, and Markdown syntax before committing. Do not create extra files.

## File manifest (approved)
| Destination path | Template | When to create | Purpose |
| --- | --- | --- | --- |
| `README.md` | `templates/README.md` | Setup | Pitch, quick start, docs map |
| `AGENTS.md` | `templates/AGENTS.md` | Setup | Compact shared entrypoint and core safeguards |
| `CLAUDE.md` | `templates/CLAUDE.md` | Setup | Imports AGENTS for Claude Code |
| `.claude/settings.json` | `templates/claude-settings.json` | Setup | Declares the Superpowers plugin, protected-action permissions |
| `docs/GDD.md` | `templates/GDD.md` | Setup | Casual-game design doc |
| `docs/STATUS.md` | `templates/STATUS.md` | Setup | Project memory |
| `CHANGELOG.md` | `templates/CHANGELOG.md` | Setup | History, updated with every change |
| `docs/DECISIONS.md` | `templates/DECISIONS.md` | Setup | Decision log (ADR-lite) |
| `docs/README.md` | `templates/docs-README.md` | Setup | Docs map: index + what to read per task |
| `docs/CODEMAP.md` | `templates/CODEMAP.md` | Setup | Code map: modules, entry points, do-not-read paths |
| `docs/PLAYTEST.md` | `templates/PLAYTEST.md` | First playtest only | Playtest log |

Detailed specs (mechanics, architecture, integrations, test plan) are created on demand using templates 03–06, never at setup.

## Post-setup validation checklist
- [ ] Exactly the "Setup" files above exist at the listed paths
- [ ] No unresolved required placeholders remain in README or GDD (or the agent asked the human)
- [ ] Markdown fences balanced; `.claude/settings.json` is valid JSON
- [ ] Project setup and run commands documented in README actually run
- [ ] All content in English

## Optional workflow plugin: Superpowers
[obra/superpowers](https://github.com/obra/superpowers) (MIT). In Claude Code:
`/plugin marketplace add obra/superpowers-marketplace` then `/plugin install superpowers@superpowers-marketplace`

## Optional tool: GitNexus
[abhigyanpatwari/GitNexus](https://github.com/abhigyanpatwari/GitNexus) — local code knowledge graph exposed to agents over MCP (`query`, `context`, `impact`, `detect_changes`…). Setup per machine: `npx gitnexus analyze --index-only` then `npx gitnexus setup`. **License: PolyForm Noncommercial 1.0.0** — confirm it is acceptable for a commercial studio (or buy the commercial license) before adopting. Never run plain `analyze` in a repo: it overwrites `AGENTS.md`/`CLAUDE.md` and adds hooks and skills.

## Versioning and change control
- Current ruleset: 0.6.0, mirrored in `AGENTS.md` and `docs/standards/README.md`.
- History: `09-ruleset-changelog.md`.
- Keep agent entrypoints short. Repository task routing belongs only in `docs/README.md`; `docs/CODEMAP.md` maps code locations.
