# <Game Name>

> One-line pitch: <verb-driven sentence, e.g. "Tap to flip gravity and dodge spikes for as long as you can.">

**Genre:** Casual · <hyper-casual / puzzle / idle / arcade / merge> **Platform:** <web / iOS / Android> **Status:** see [docs/STATUS.md](docs/STATUS.md)

## Quick start
```bash
<install command>
<run command>
<test command>
```

## Docs map
| File | Purpose | Who updates |
|---|---|---|
| [AGENTS.md](AGENTS.md) | Rules for AI agents (read first) | Human |
| [docs/GDD.md](docs/GDD.md) | Game design: product intent, scope, milestones | Human (AI may propose) |
| [docs/STATUS.md](docs/STATUS.md) | Project memory: now, next, blockers | AI every session |
| [CHANGELOG.md](CHANGELOG.md) | What changed, per version | AI with every change |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Why we chose X over Y | AI / Human |
| [docs/README.md](docs/README.md) | Docs map: index + what to read per task | AI when docs change |
| [docs/CODEMAP.md](docs/CODEMAP.md) | Code map: where code lives | AI when structure changes |
| `docs/specs/`, `docs/integrations/`, `docs/ARCHITECTURE.md` | Detailed specs, created only when needed | AI / Human |

## AI setup (required)
Built with an AI agent + Superpowers ([obra/superpowers](https://github.com/obra/superpowers), MIT). In Claude Code:
```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```
Other agents (Codex, Cursor): install Superpowers for that harness. All repository content is written in English.
