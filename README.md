# Hu Tieu Ganh (working title)

> One-line pitch: Run a Saigon roadside noodle cart: cook each bowl of hu tieu step by step and serve it to the right table before customers lose patience.

**Genre:** Casual · cooking / service mini-game **Platform:** web (desktop + mobile landscape) **Status:** see [docs/STATUS.md](docs/STATUS.md)

## Quick start
```bash
npm install
npm run dev
npm test
```
Other scripts: `npm run build` (type-check + production build), `npm run typecheck`, `npm run preview`.

Deploy a static build anywhere with relative paths: `npx vite build --base=./` (output in `dist/`).

Stack: [Three.js](https://threejs.org/) 0.170 · TypeScript 5 · Vite 5 · Vitest 2. Node 20+.

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
| [docs/standards/](docs/standards/README.md) | Studio standards + AI rules (binding, self-contained) | Human (owner approval) |
| `docs/specs/`, `docs/integrations/`, `docs/ARCHITECTURE.md` | Detailed specs, created only when needed | AI / Human |

## AI setup (required)
Built with an AI agent + Superpowers ([obra/superpowers](https://github.com/obra/superpowers), MIT). In Claude Code:
```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```
Other agents (Codex, Cursor): install Superpowers for that harness. All repository content is written in English.
