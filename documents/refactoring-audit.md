# FlexFit Studio — Refactoring Audit

This document records each refactoring made, explaining the original issue, rationale, location of extracted logic, behavior preservation mechanism, and verification steps.

---

## Refactoring Log

### 1. Extract Shared Date Helpers

* **Target File Created**: [`src/lib/date.ts`](file:///c:/Users/Aradhya%20Gupta/flexfit-studio/src/lib/date.ts)
* **Consolidated Routers**:
  * [`src/server/routers/bookings.ts`](file:///c:/Users/Aradhya%20Gupta/flexfit-studio/src/server/routers/bookings.ts)
  * [`src/server/routers/corporate-bookings.ts`](file:///c:/Users/Aradhya%20Gupta/flexfit-studio/src/server/routers/corporate-bookings.ts)
  * [`src/server/routers/reschedules.ts`](file:///c:/Users/Aradhya%20Gupta/flexfit-studio/src/server/routers/reschedules.ts)
  * [`src/server/routers/plans.ts`](file:///c:/Users/Aradhya%20Gupta/flexfit-studio/src/server/routers/plans.ts)
* **Original Issue**: `hoursUntil(iso, now)` function was copied verbatim into 3 separate router files. `addDays(dateIso, days)` was duplicated locally in `plans.ts`.
* **Executed Change**: Extracted pure date helper functions `hoursUntil`, `addDays`, and `todayIsoDate` into `src/lib/date.ts`.
* **Expected Benefit**: Eliminates code duplication, centralizes date parsing and arithmetic, simplifies unit testing.
* **Risk & Mitigation**: Extremely low risk. Behavior preserved by using exact same mathematical calculations `(new Date(iso).getTime() - now.getTime()) / 36e5`.
* **Verification**: TypeScript type check (`npx tsc --noEmit`) and Vitest unit tests in `src/lib/__tests__/date.test.ts`.

---

### 2. Extract Active Membership Lookup & Unlimited Credit Check

* **Target File Created**: [`src/server/services/membership.ts`](file:///c:/Users/Aradhya%20Gupta/flexfit-studio/src/server/services/membership.ts)
* **Consolidated Routers**:
  * [`src/server/routers/bookings.ts`](file:///c:/Users/Aradhya%20Gupta/flexfit-studio/src/server/routers/bookings.ts)
  * [`src/server/routers/reschedules.ts`](file:///c:/Users/Aradhya%20Gupta/flexfit-studio/src/server/routers/reschedules.ts)
* **Original Issue**: `activeMembershipFor(db, userId)` function was duplicated across `bookings.ts` and `reschedules.ts`. Constant `UNLIMITED_CREDITS = 999` was declared locally in multiple files.
* **Executed Change**: Created `membership.ts` service with `activeMembershipFor` and `isUnlimitedCredits`. Replaced duplicate inline Drizzle queries with the service function call.
* **Expected Benefit**: Single source of truth for active membership status evaluation and unlimited credit balance rules.
* **Risk & Mitigation**: Low risk. Preserved exact Drizzle filtering conditions (`eq(status, "active")` and `endDate >= today`).
* **Verification**: TypeScript type check (`npx tsc --noEmit`) and Vitest unit tests in `src/server/services/__tests__/membership.test.ts`.

---

### 3. Consolidate Reschedule Validation Rules

* **Target File Created**: [`src/server/services/reschedule-validation.ts`](file:///c:/Users/Aradhya%20Gupta/flexfit-studio/src/server/services/reschedule-validation.ts)
* **Consolidated Router**: [`src/server/routers/reschedules.ts`](file:///c:/Users/Aradhya%20Gupta/flexfit-studio/src/server/routers/reschedules.ts)
* **Original Issue**: Over 90 lines of identical validation logic (4-hour cutoff check, ownership check, active booking status check, target class name match check, capacity check) were copy-pasted between the `reschedules.reschedule` mutation and `reschedules.validateReschedule` query.
* **Executed Change**: Extracted `validateRescheduleRules` function into `reschedule-validation.ts`. Both procedure handlers now call `validateRescheduleRules`.
* **Expected Benefit**: Prevents validation drift between pre-validation queries and mutation execution; eliminates ~90 lines of code duplication.
* **Risk & Mitigation**: Low risk. Re-used exact error messages and tRPC error codes (`NOT_FOUND`, `FORBIDDEN`, `BAD_REQUEST`, `CONFLICT`).
* **Verification**: TypeScript type check (`npx tsc --noEmit`).

---

### 4. Extract Automated Waitlist Promotion Helper

* **Target File Created**: [`src/server/services/waitlist.ts`](file:///c:/Users/Aradhya%20Gupta/flexfit-studio/src/server/services/waitlist.ts)
* **Consolidated Router**: [`src/server/routers/bookings.ts`](file:///c:/Users/Aradhya%20Gupta/flexfit-studio/src/server/routers/bookings.ts)
* **Original Issue**: Inline database updates for selecting the oldest waitlisted member, promoting them to `"booked"`, and deducting credits were directly embedded in `bookings.ts:cancel`.
* **Executed Change**: Extracted `promoteNextWaitlistedMember(database, classId, creditCost)` to `src/server/services/waitlist.ts`.
* **Expected Benefit**: Decouples waitlist management from cancellation router logic.
* **Risk & Mitigation**: Low risk. Preserves exact query sorting (`asc(bookings.bookedAt)`) and credit deduction formulas.
* **Verification**: TypeScript type check (`npx tsc --noEmit`).
