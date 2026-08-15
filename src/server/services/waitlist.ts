import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, memberships } from "@/db/schema";
import { UNLIMITED_CREDITS } from "./membership";

/**
 * Promotes the oldest waitlisted member for a class when a confirmed spot becomes available.
 * Deducts credits from the member's active membership if applicable.
 */
export async function promoteNextWaitlistedMember(
  database: typeof db,
  classId: number,
  creditCost: number,
): Promise<boolean> {
  const next = await database
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.classId, classId),
        eq(bookings.status, "waitlisted"),
      ),
    )
    .orderBy(asc(bookings.bookedAt))
    .get();

  if (!next) {
    return false;
  }

  await database
    .update(bookings)
    .set({ status: "booked", creditsUsed: creditCost })
    .where(eq(bookings.id, next.id));

  if (next.membershipId) {
    const ms = await database
      .select()
      .from(memberships)
      .where(eq(memberships.id, next.membershipId))
      .get();

    if (ms && ms.creditsRemaining < UNLIMITED_CREDITS) {
      await database
        .update(memberships)
        .set({
          creditsRemaining: Math.max(0, ms.creditsRemaining - creditCost),
        })
        .where(eq(memberships.id, ms.id));
    }
  }

  return true;
}
