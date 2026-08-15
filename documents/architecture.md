# FlexFit Studio — System Architecture

This document describes the architectural layout and clear responsibility boundaries of the refactored FlexFit Studio application.

---

## Architecture Overview Diagram

```
+-------------------------------------------------------------------+
|                        Next.js App Router                         |
|                    Client Pages & React Query                     |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                            tRPC Layer                             |
|          (Procedure Routing, Zod Input Validation, Auth)           |
+-------------------------------------------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
+-----------------------+                   +-----------------------+
|  Domain Services      |                   |    Shared Utilities   |
| - membership.ts       |                   | - date.ts             |
| - reschedule-val.ts   |                   | - format.ts           |
| - waitlist.ts         |                   | - password.ts         |
+-----------------------+                   +-----------------------+
            |                                           |
            +---------------------+---------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                       Drizzle ORM & SQLite                        |
|                        (src/db/schema.ts)                         |
+-------------------------------------------------------------------+
```

---

## Responsibility Boundaries

### 1. Presentation Layer (`src/app/`, `src/components/`)
* Contains UI page routes and React components.
* Interacts with backend purely via `trpc` client hooks.
* Performs no direct database operations or business rule calculations.

### 2. Transport & API Layer (`src/server/routers/`, `src/server/trpc.ts`)
* `trpc.ts` defines middleware (`protectedProcedure`, `staffProcedure`, `adminProcedure`) enforcing authentication and role-based permissions.
* Routers validate incoming Zod schemas, resolve current session user context, and delegate domain queries to service functions.
* Exposes public tRPC API contracts with unchanged names, inputs, and output types.

### 3. Domain Services Layer (`src/server/services/`)
* **`membership.ts`**: Handles active membership resolution and unlimited credit balance assertions.
* **`reschedule-validation.ts`**: Encapsulates 11-point reschedule validation rules shared between mutation and query endpoints.
* **`waitlist.ts`**: Encapsulates automated promotion of waitlisted members upon booking cancellations.

### 4. Utility Layer (`src/lib/`)
* **`date.ts`**: Pure date calculation and formatting helpers (`hoursUntil`, `addDays`, `todayIsoDate`).
* **`format.ts`**: Currency and timestamp formatting.
* **`password.ts`**: Hashing and bcrypt verification.

### 5. Database Layer (`src/db/`)
* **`schema.ts`**: Unchanged SQLite schema definitions via Drizzle ORM.
* **`index.ts`**: Database connection initialization using `@libsql/client`.
