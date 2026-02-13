import { z } from "zod";
import { and, eq, gt, lt, not, sql } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { reservations, rooms, roomTypes } from "~/server/db/schema";

const searchAvailableInput = z
  .object({
    checkInDate: z.string().date(),
    checkOutDate: z.string().date(),
    guestCount: z.number().int().min(1),
  })
  .refine((data) => data.checkOutDate > data.checkInDate, {
    message: "Check-out date must be after check-in date",
    path: ["checkOutDate"],
  })
  .refine(
    (data) => {
      const today = new Date().toISOString().slice(0, 10);
      return data.checkInDate >= today;
    },
    {
      message: "Check-in date cannot be in the past",
      path: ["checkInDate"],
    },
  )
  .refine(
    (data) => {
      const today = new Date();
      const checkIn = new Date(data.checkInDate);
      const diffDays =
        (checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 365;
    },
    {
      message: "Cannot search more than 365 days in advance",
      path: ["checkInDate"],
    },
  );

export const roomRouter = createTRPCRouter({
  searchAvailable: publicProcedure
    .input(searchAvailableInput)
    .query(async ({ ctx, input }) => {
      const { checkInDate, checkOutDate, guestCount } = input;

      // Subquery: room IDs that have an overlapping reservation with status confirmed or checked_in
      const overlappingReservations = ctx.db
        .select({ roomId: reservations.roomId })
        .from(reservations)
        .where(
          and(
            lt(reservations.checkInDate, checkOutDate),
            gt(reservations.checkOutDate, checkInDate),
            sql`${reservations.status} IN ('confirmed', 'checked_in')`,
          ),
        );

      // Find room types that have capacity >= guestCount and at least one available room
      const availableRoomTypes = await ctx.db
        .selectDistinct({
          id: roomTypes.id,
          name: roomTypes.name,
          description: roomTypes.description,
          capacity: roomTypes.capacity,
          pricePerNight: roomTypes.pricePerNight,
        })
        .from(roomTypes)
        .innerJoin(rooms, eq(rooms.roomTypeId, roomTypes.id))
        .where(
          and(
            sql`${roomTypes.capacity} >= ${guestCount}`,
            not(eq(rooms.status, "maintenance")),
            sql`${rooms.id} NOT IN (${overlappingReservations})`,
          ),
        )
        .orderBy(roomTypes.pricePerNight);

      return availableRoomTypes;
    }),
});
