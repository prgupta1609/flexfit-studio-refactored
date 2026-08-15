# FlexFit Studio — Engineering Decision Record

This document details key architectural decisions, rationale, trade-offs, and why certain code was intentionally left unchanged.

---

## Key Decisions

### ADR-01: Targeted Service Extraction over Mass Rewrite

* **Context**: The codebase was functional, but suffered from inline code duplication across router handlers.
* **Decision**: Adopted a conservative, high-value refactoring approach. Extracted only clear, duplicated logic (`hoursUntil`, `activeMembershipFor`, reschedule validation rules, waitlist promotion) into targeted modules rather than performing a mass rewrite of all routers.
* **Rationale**: Minimizes regression risk while yielding maximum structure improvement and defensibility.
* **Trade-offs**: Some routers (e.g. `admin.ts`) retain simple Drizzle queries inline where duplication was low and risk of behavior change was high.

---

### ADR-02: Zero Schema Modifications

* **Context**: The existing SQLite schema in `src/db/schema.ts` includes 14 tables.
* **Decision**: Kept the SQLite database schema 100% unchanged.
* **Rationale**: The database schema fully supported all application requirements. Schema changes would introduce migration risk, breaking changes to existing seed data, and unnecessary complexity.

---

### ADR-03: Consolidated Reschedule Validation Pattern

* **Context**: `reschedules.reschedule` (mutation) and `reschedules.validateReschedule` (query) duplicated 90+ lines of identical validation rules, but needed to return different response structures (TRPCError vs boolean payload).
* **Decision**: Created `validateRescheduleRules` returning a structured union type (`{ valid: true, ... } | { valid: false, reason, code }`).
* **Rationale**: Single source of truth guarantees that pre-validation checks in UI match server mutation enforcement without duplicating code.

---

### ADR-04: Targeted Unit Testing Post-Refactoring

* **Context**: The codebase had Vitest configured but no test files.
* **Decision**: Created a minimal `vitest.config.ts` for alias resolution and wrote targeted unit tests for `date.ts` and `membership.ts`.
* **Rationale**: Followed the guideline to write targeted unit tests for extracted logic after refactoring, proving correctness without delaying core refactoring.

---

### ADR-05: Pre-Existing Schedule Query Key Stabilization Fix

* **Context**: During behavior verification, `src/app/schedule/page.tsx` was observed getting stuck on "Loading schedule...". Investigation revealed `classes.list.useQuery` input used `from: new Date().toISOString()`, generating a new timestamp parameter on every re-render and triggering an infinite query refetch loop.
* **Decision**: Stabilized the `from` query parameter using React `useState(() => new Date().toISOString())` to calculate the timestamp once on mount.
* **Rationale**: Preserves the exact `classes.list` API, return payload, and UI workflow while resolving a pre-existing infinite rendering loop bug.

