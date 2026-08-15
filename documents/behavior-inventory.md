# FlexFit Studio — Application Behavior Inventory

This document details all observed existing workflows, business rules, inputs, outputs, and edge cases in the FlexFit Studio codebase.

---

## 1. Authentication & Sessions

* **Sign In (`auth.login`)**:
  * Inputs: `email` (string, email format), `password` (string).
  * Behavior: Case-insensitively trims email, verifies against hashed password using scrypt/crypto. Checks `user.active`. If inactive, throws `FORBIDDEN` ("This account has been deactivated.").
  * Session Creation: Generates 32-byte hex token, stores in `sessions` table (expires in 30 days), sets HTTP-only `flexfit_session` cookie.
  * Outputs: `{ id, name, role }`.

* **Sign Up (`auth.register`)**:
  * Inputs: `email`, `password` (min 6 chars), `name`, `phone` (optional).
  * Behavior: Verifies email uniqueness. Hashes password using scrypt. Defaults role to `"member"`.
  * Outputs: `{ id, name }`.

* **Sign Out (`auth.logout`)**:
  * Deletes session token from database and clears `flexfit_session` cookie.

---

## 2. Memberships & Credits

* **Plan Subscription (`plans.subscribe`)**:
  * Inputs: `planId`, `method` (`"card" | "cash" | "upi" | "transfer"`).
  * Behavior: Creates active membership starting today, ending in `today + plan.durationDays`. Sets `creditsRemaining = plan.classCredits`. Creates a payment record with status `"paid"`.
* **Unlimited Credits Rule**:
  * Plans with `classCredits >= 999` are treated as unlimited.
  * Unlimited memberships never decrement `creditsRemaining` when booking or rescheduling classes.

---

## 3. Class Browsing & Roster

* **Class Listing (`classes.list`)**:
  * Filters by `from`, `to` dates and `includeCancelled`.
  * Computes `booked` (confirmed count), `spotsLeft` (`max(0, capacity - booked)`), and `full` (`booked >= capacity`).
* **Class Roster (`classes.byId` / `bookings.rosterFor`)**:
  * Returns members with bookings for a given class ID.

---

## 4. Standard Class Booking & Cancellation

* **Booking (`bookings.book`)**:
  * Inputs: `classId`.
  * Business Rules:
    1. Class must exist and not be cancelled.
    2. Class startsAt must be in the future (`hoursUntil > 0`).
    3. User must not already have an active (`booked` or `waitlisted`) booking for this class.
    4. User must have an active membership (`status = active` and `endDate >= today`).
    5. Non-unlimited membership must have `creditsRemaining >= class.creditCost`.
  * Capacity Check & Waitlist:
    * If confirmed bookings `< capacity`: status = `"booked"`, `creditsUsed = class.creditCost`, membership credits decremented.
    * If confirmed bookings `>= capacity`: status = `"waitlisted"`, `creditsUsed = 0`, credits not decremented.

* **Cancellation (`bookings.cancel`)**:
  * Inputs: `bookingId`.
  * Authorization: Booking owner or staff (`admin` / `trainer`).
  * 12-Hour Refund Rule (`FREE_CANCELLATION_HOURS = 12`):
    * Cancelling `>= 12 hours` before class start refunds `creditsUsed` back to active membership (if non-unlimited).
    * Cancelling `< 12 hours` before class start forfeits the credit (no refund), but still frees the spot.
  * Waitlist Promotion Rule:
    * If cancelled booking was `"booked"`, automatically promotes the oldest waitlisted member (`asc(bookedAt)`).
    * Promoted member's status becomes `"booked"`, `creditsUsed` set to `class.creditCost`, and their membership credits decremented if non-unlimited.

---

## 5. Rescheduling

* **Reschedule Mutation (`reschedules.reschedule`)**:
  * Inputs: `fromBookingId`, `toClassId`.
  * Business Rules:
    1. User must own the original booking.
    2. Original booking status must be `"booked"` or `"waitlisted"`.
    3. Must be at least **4 hours** before original class start (`FREE_RESCHEDULE_HOURS = 4`).
    4. Target class must exist, not be cancelled, not be in the past.
    5. Target class must have the **exact same name** as the original class (`targetClass.name === originalClass.name`).
    6. Target class cannot be the original class ID.
    7. User must not already have an active booking for the target class.
  * Execution:
    * Inserts new booking with `creditsUsed` carried over from original booking (no extra credit charge).
    * If target class is full, status = `"waitlisted"`; otherwise `"booked"`.
    * Marks original booking as `"cancelled"`.
    * Inserts audit log in `reschedules` table.

---

## 6. Corporate Bookings & Company Credit Pools

* **Corporate Booking (`corporateBookings.book`)**:
  * Requires user to be linked to an active company (`companyMembers` + `companies.active = true`).
  * Checks company `creditPoolBalance >= class.creditCost`.
  * If full, places on waitlist (`creditsUsed = 0`). If available, status = `"booked"` and deducts credits from company `creditPoolBalance`.
* **Corporate Cancellation (`corporateBookings.cancel`)**:
  * 24-Hour Refund Rule (`CORPORATE_FREE_CANCELLATION_HOURS = 24`).
  * Refund adds credits back to company `creditPoolBalance`.
  * Promotes oldest waitlisted corporate booking if spot freed.

---

## 7. Trainer & Attendance Workflows

* **Attendance Check-in (`bookings.markAttended`)**:
  * Staff-only. Changes booking status from `"booked"` to `"attended"`, records `checkins` row with source (`"front_desk" | "kiosk" | "app"`).
* **Trainer Schedule & Availability**:
  * Trainers manage day-of-week time windows (`trainerAvailability`).
  * Conflict checking verifies no overlapping active classes exist.

---

## 8. Admin Workflows

* Dashboard stats (members count, revenue, checkins, pending payments).
* Revenue aggregation by month and payment method.
* Expiring memberships alert window (next 14 days).
* Company management (top-ups, member linking/unlinking).
* Broadcast announcements to all active members.
