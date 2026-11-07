# Code map
Updated: YYYY-MM-DD · Keep under ~80 lines. One row per module, not per file.
> Rows below are EXAMPLES. At setup, keep only paths that actually exist; never list a folder that has not been created.

## Entry points
| What | File |
|---|---|
| App bootstrap | `<path>` |
| Main game scene / loop | `<path>` |
| Balance config | `<path>` |
| Test setup | `<path>` |

## Modules
| Module (folder) | Responsibility | Key files (max 3) | Depends on | Requirement IDs | Tests |
|---|---|---|---|---|---|
| `src/core/` | Pure gameplay rules, no engine imports | `<file>` | — | GDD §2 | `<path>` |
<!-- add rows: input, scenes, ui, audio, save, integrations ... -->

## Do not read (generated, vendored or binary)
`dist/`, `build/`, `coverage/`, `node_modules/`, `assets/` binaries, lockfiles — unless the task is specifically about them.

## Conventions that help navigation
- One module = one folder with a small public entry (e.g. `index.ts`); other modules import only that entry.
- Keep source files under ~300 lines; split when larger.
- File and folder names match the domain terms in the GDD / MEC specs.
