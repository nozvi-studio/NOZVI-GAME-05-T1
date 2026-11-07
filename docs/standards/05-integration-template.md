# 05 — Third-party Integration Template

> One spec per integration with a materially distinct lifecycle or data contract.
> Path: `docs/integrations/INT-xxx-<name>.md`.

## Metadata
ID: INT-XXX · Owner: Engineering · Status: Draft · Version: 0.1

## 1. Provider and purpose
Product requirement, vendor, official docs, license, cost and alternatives.

## 2. Platform matrix
| Capability | Web | Android | iOS |
| --- | --- | --- | --- |
| Supported | [Verify] | [Verify] | [Verify] |

## 3. SDK and configuration
Approved versions, installation, environment-specific config, secret handling; never store real secrets in docs.

## 4. Initialization and lifecycle
Startup timing, consent gates, background/resume, shutdown, idempotency and retries.

## 5. Data contract
Events, payload fields, identifiers, validation, sampling, retention and prohibited sensitive fields. Link event catalog where needed.

## 6. Consent and privacy
Purposes, legal review requirements, opt-in/out behavior, withdrawal, deletion and SDK-specific data collection. Do not assume all telemetry uses one consent basis.

## 7. Failure and offline behavior
SDK timeout, no network, quota exceeded, duplicate delivery, disabled provider; game must remain playable where feasible.

## 8. Verification
Development test, staging, production sanity check, platform coverage and evidence.

## 9. Disable, rollback and migration
Feature flag, kill switch if available, data implications, vendor replacement plan.

## 10. References and open questions
Official links, date checked, owner and unresolved issues.

## Suggested specialization
Analytics: Event Catalog. Crash: Error taxonomy/sampling. Ads: Placement Matrix. Privacy: Consent State Machine.
