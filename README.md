# FlexFit Studio

Class booking and membership management application built for the **2026 i12 HR Drive Hackathon Computer Science Project 1: FlexFit Studio Refactor**.

Members book classes, buy memberships, and spend class credits. Staff run the front desk, manage trainers, and pull reports. Companies purchase credit pools their employees book against.

---

## 🚀 Getting Started

### Requirements
* Node.js 20+
* npm or pnpm

### Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Push database schema & seed initial data
npm run db:push
npm run db:seed

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔑 Test Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@flexfit.test` | `admin123` |
| **Trainer** | `arjun@flexfit.test` | `trainer123` |
| **Member** | `rahul.k@example.com` | `member123` |

*(All seeded members use `member123`. Additional sample accounts can be found in `src/db/seed.ts`.)*

---

## 🛠️ Commands

| Command | Description |
|---|---|
| `npm run dev` | Starts Next.js development server on port 3000 |
| `npx tsc --noEmit` | Runs TypeScript type checking |
| `npm test` | Runs Vitest unit test suite |
| `npm run build` | Compiles production build |
| `npm run db:push` | Applies SQLite database schema from `src/db/schema.ts` |
| `npm run db:seed` | Populates database with sample seed data |
| `npm run db:reset` | Destructively resets and re-seeds database |

---

## 🏗️ Architecture & Refactoring Overview

This codebase has undergone a **conservative, high-value architectural refactoring** designed to improve internal code structure, maintainability, and code reuse while preserving existing application behavior 100% identically.

### Resulting Folder Structure

```
src/
├── app/               # Next.js App Router pages and API route handlers
├── components/        # Shared React UI components (NavBar, RescheduleModal)
├── db/                # Drizzle ORM schema, client setup, and seed script
├── lib/               # Shared utilities (date helpers, formatting, password hashing)
│   ├── date.ts        # [NEW] Centralized date/time helper functions
│   └── __tests__/     # [NEW] Vitest unit tests for date helpers
└── server/            # Server layer
    ├── trpc.ts        # tRPC setup & authorization middleware
    ├── services/      # [NEW] Domain Services Layer
    │   ├── membership.ts             # Active membership lookups & credit checks
    │   ├── reschedule-validation.ts # Reusable reschedule validation rules
    │   └── waitlist.ts               # Automated waitlist promotion
    └── routers/       # Thin tRPC procedure routers

documents/             # Engineering Documentation
├── behavior-inventory.md  # Detailed inventory of all application workflows
├── refactoring-audit.md   # Traceable log of issues, changes, and benefits
├── architecture.md        # Resulting architecture and boundaries
├── decisions.md           # Key engineering decision records (ADRs)
└── verification.md        # Verification report & test matrix
```

### Major Refactorings Executed

1. **Centralized Date Helpers (`src/lib/date.ts`)**: Extracted duplicate `hoursUntil` date calculation logic scattered across 3 router files into a single, pure utility function.
2. **Extracted Membership Service (`src/server/services/membership.ts`)**: Unified active membership lookup (`activeMembershipFor`) and unlimited credit balance checks (`UNLIMITED_CREDITS = 999`).
3. **Consolidated Reschedule Validation (`src/server/services/reschedule-validation.ts`)**: Unified ~90 lines of duplicate validation logic previously copied between `reschedules.reschedule` mutation and `reschedules.validateReschedule` query into a single reusable validator function `validateRescheduleRules`.
4. **Decoupled Waitlist Promotion (`src/server/services/waitlist.ts`)**: Extracted automated promotion of waitlisted members when confirmed bookings are cancelled.

---

## ✅ Verification & Testing

* **Type Safety**: Passed `npx tsc --noEmit` with 0 errors.
* **Automated Unit Tests**: Passed `npm test` (Vitest test suite covering date utilities and membership service helpers).
* **Behavior Preservation**: All existing user workflows (login, class booking, refund policies, waitlists, corporate pools, trainer availability, admin stats) operate with exact behavioral fidelity.

---

## 📌 Known Limitations & Intentional Choices

* **Database Schema Unchanged**: The SQLite database schema was intentionally kept intact to avoid unnecessary schema migrations or risk of data corruption.
* **Targeted Extraction**: Scope was kept strictly conservative. Un-duplicated or simple queries in certain routers were left intact to prevent over-abstraction.

---

## 🤖 AI Tooling Disclosure

This refactor was conducted with assistance from **Google Antigravity AI** acting in pair-programming mode to audit codebase structure, extract domain logic into dedicated services, generate unit tests, and maintain comprehensive engineering documentation.
