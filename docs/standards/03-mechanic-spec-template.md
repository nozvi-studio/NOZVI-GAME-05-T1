# 03 — Mechanic Specification Template

> Create one spec for a mechanic with meaningful independent rules or edge cases.
> Path: `docs/specs/mechanics/MEC-xxx-<name>.md`. Add the metadata front matter from `00-governance.md`, a row in the GDD mechanics index and in `docs/README.md`.

## Metadata
ID: MEC-XXX · Parent: GDD §4 · Owner: Game Designer · Status: Draft · Version: 0.1

## 1. Purpose
What player decision, skill or feeling does this mechanic enable?

## 2. Entities and terminology
Define actors, objects and state names without ambiguous synonyms.

## 3. Preconditions
What must be true before activation?

## 4. Trigger
Player input or game event that initiates the mechanic.

## 5. Rules and observable behavior
Numbered deterministic rules. Distinguish mandatory behavior from tunable values.

## 6. State transitions
| Before | Event / Guard | After | Side effects |
| --- | --- | --- | --- |
| [State] | [Event] | [State] | [Result] |

## 7. Edge cases
Interrupted input, simultaneous events, invalid targets, pause/resume, repeated actions, object destruction.

## 8. Player feedback
Visual, audio, haptic and UI states; include accessibility fallback.

## 9. Balance parameters
IDs, units, defaults and link to authoritative balance config. No duplicate numeric source.

## 10. Acceptance criteria
- Given [initial state], when [event], then [observable outcome].
- Given [edge case], when [event], then [safe outcome].

## 11. Dependencies
Related mechanics, architecture components, test cases and analytics events.

## 12. Open questions
Explicit unresolved decisions; agents must not silently invent answers.
