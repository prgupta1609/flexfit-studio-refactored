import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, classes, type Booking, type GymClass } from "@/db/schema";
import { hoursUntil } from "@/lib/date";

export const FREE_RESCHEDULE_HOURS = 4;

export type TRPCErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "BAD_REQUEST"
  | "CONFLICT";

export type RescheduleValidationResult =
  | {
      valid: true;
      originalBooking: Booking;
      originalClass: GymClass;
      targetClass: GymClass;
      targetIsFull: boolean;
    }
  | {
      valid: false;
      reason: string;
      code: TRPCErrorCode;
    };

/**
 * Validates whether a user can reschedule a booking to a target class.
 * Centralizes identical validation logic used by both the reschedule mutation and query.
 */
export async function validateRescheduleRules(
  database: typeof db,
  userId: number,
  fromBookingId: number,
  toClassId: number,
): Promise<RescheduleValidationResult> {
  // Get original booking and class
  const originalRow = await database
    .select({
      booking: bookings,
      cls: classes,
    })
    .from(bookings)
    .innerJoin(classes, eq(bookings.classId, classes.id))
    .where(eq(bookings.id, fromBookingId))
    .get();

  if (!originalRow) {
    return { valid: false, reason: "Booking not found.", code: "NOT_FOUND" };
  }

  const originalBooking = originalRow.booking;
  const originalClass = originalRow.cls;

  // Verify ownership
  if (originalBooking.userId !== userId) {
    return {
      valid: false,
      reason: "You cannot reschedule this booking.",
      code: "FORBIDDEN",
    };
  }

  // Verify booking status is active
  if (
    originalBooking.status !== "booked" &&
    originalBooking.status !== "waitlisted"
  ) {
    return {
      valid: false,
      reason: "This booking is no longer active.",
      code: "BAD_REQUEST",
    };
  }

  // Verify reschedule cutoff time (within 4 hours of original class)
  const hoursBeforeOriginal = hoursUntil(originalClass.startsAt);
  if (hoursBeforeOriginal < FREE_RESCHEDULE_HOURS) {
    return {
      valid: false,
      reason: `You can only reschedule up to ${FREE_RESCHEDULE_HOURS} hours before the class starts.`,
      code: "BAD_REQUEST",
    };
  }

  // Get target class
  const targetClass = await database
    .select()
    .from(classes)
    .where(eq(classes.id, toClassId))
    .get();

  if (!targetClass) {
    return { valid: false, reason: "Target class not found.", code: "NOT_FOUND" };
  }

  // Verify target class name matches original
  if (targetClass.name !== originalClass.name) {
    return {
      valid: false,
      reason: "You can only reschedule to a class with the same name.",
      code: "BAD_REQUEST",
    };
  }

  // Verify target class is not the same class
  if (targetClass.id === originalClass.id) {
    return {
      valid: false,
      reason: "You are already booked for this class.",
      code: "BAD_REQUEST",
    };
  }

  // Verify target class has not started
  if (hoursUntil(targetClass.startsAt) <= 0) {
    return {
      valid: false,
      reason: "This class has already started.",
      code: "BAD_REQUEST",
    };
  }

  // Verify target class is not cancelled
  if (targetClass.cancelled) {
    return {
      valid: false,
      reason: "This class has been cancelled.",
      code: "BAD_REQUEST",
    };
  }

  // Check if user already has an active booking for target class
  const existingBooking = await database
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.classId, targetClass.id),
        eq(bookings.userId, userId),
        sql`${bookings.status} in ('booked', 'waitlisted')`,
      ),
    )
    .get();

  if (existingBooking) {
    return {
      valid: false,
      reason: "You already have an active booking for this class.",
      code: "CONFLICT",
    };
  }

  // Check if target class capacity is full
  const [{ count }] = await database
    .select({ count: sql<number>`count(*)` })
    .from(bookings)
    .where(
      and(eq(bookings.classId, targetClass.id), eq(bookings.status, "booked")),
    );

  const targetIsFull = Number(count) >= targetClass.capacity;

  return {
    valid: true,
    originalBooking,
    originalClass,
    targetClass,
    targetIsFull,
  };
}
