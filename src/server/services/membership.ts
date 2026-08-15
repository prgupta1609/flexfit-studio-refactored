import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { memberships, type Membership } from "@/db/schema";
import { todayIsoDate } from "@/lib/date";

/** Plans with this many credits are treated as unlimited and never decrement. */
export const UNLIMITED_CREDITS = 999;

/**
 * Checks whether a credit balance represents unlimited credits.
 */
export function isUnlimitedCredits(creditsRemaining: number): boolean {
  return creditsRemaining >= UNLIMITED_CREDITS;
}

/**
 * Fetches the current active membership for a given user ID.
 */
export async function activeMembershipFor(
  database: typeof db,
  userId: number,
): Promise<Membership | undefined> {
  const today = todayIsoDate();
  return database
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.status, "active"),
        sql`${memberships.endDate} >= ${today}`,
      ),
    )
    .orderBy(desc(memberships.endDate))
    .get();
}
