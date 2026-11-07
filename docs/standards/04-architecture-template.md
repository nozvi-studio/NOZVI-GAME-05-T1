# 04 — Technical Architecture Template

> Architecture describes how approved game behavior is implemented, not new gameplay rules.
> Path: `docs/ARCHITECTURE.md` (create only when needed).

## Metadata
ID: ARCH-001 · Owner: Tech Lead · Status: Draft · Version: 0.1

## 1. Scope and constraints
Target platforms, runtime/engine, expected devices, performance targets and non-goals.

## 2. System context
Game runtime, platform shell, persistence, backend if any, third-party services and trust boundaries.

## 3. Runtime components
| Component | Responsibility | Public interface | Depends on |
| --- | --- | --- | --- |
| Input | [Purpose] | [Contract] | [Module] |
| Gameplay | [Purpose] | [Contract] | [Module] |

## 4. State and lifecycle
Boot, loading, gameplay, pause, background, resume, restart, shutdown and failure paths.

## 5. Data flow
Commands, events, state ownership, persistence and data validation. Include diagram if useful.

## 6. Cross-platform behavior
Web browser vs Capacitor Android/iOS; permissions, lifecycle, offline and feature differences.

## 7. Quality attributes
Frame-time and memory budgets, loading, asset management, observability, privacy and testability.

## 8. Failure modes
SDK unavailable, corrupted save, app suspended, asset load failure, network offline.

## 9. Trade-offs and ADRs
Record alternatives and rationale separately; link approved decisions.

## 10. Verification
Architecture tests, integration tests, profiling and explicit exit criteria.

## Linked design requirements
List GDD and MEC IDs that this architecture realizes.
