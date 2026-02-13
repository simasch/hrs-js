import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestCaller } from "~/test/helpers";
import { guests, reservations, rooms, roomTypes } from "~/server/db/schema";

/** Returns a YYYY-MM-DD string offset from today */
function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

describe("room.searchAvailable", () => {
  let ctx: Awaited<ReturnType<typeof createTestCaller>>;

  beforeEach(async () => {
    ctx = await createTestCaller();
  });

  afterEach(() => {
    ctx.client.close();
  });

  // ── Seed helpers ────────────────────────────────────────────────────

  async function seedRoomType(
    overrides: Partial<typeof roomTypes.$inferInsert> & { name: string },
  ) {
    const [rt] = await ctx.db
      .insert(roomTypes)
      .values({
        capacity: 2,
        pricePerNight: 100,
        ...overrides,
      })
      .returning();
    return rt!;
  }

  async function seedRoom(
    roomTypeId: number,
    roomNumber: string,
    overrides?: Partial<typeof rooms.$inferInsert>,
  ) {
    const [r] = await ctx.db
      .insert(rooms)
      .values({
        roomNumber,
        roomTypeId,
        status: "available",
        floor: 1,
        ...overrides,
      })
      .returning();
    return r!;
  }

  async function seedGuest(email: string) {
    const [g] = await ctx.db
      .insert(guests)
      .values({
        firstName: "Test",
        lastName: "Guest",
        email,
      })
      .returning();
    return g!;
  }

  async function seedReservation(
    guestId: number,
    roomId: number,
    checkInDate: string,
    checkOutDate: string,
    status = "confirmed",
  ) {
    const [r] = await ctx.db
      .insert(reservations)
      .values({ guestId, roomId, checkInDate, checkOutDate, status })
      .returning();
    return r!;
  }

  // ── Happy path ─────────────────────────────────────────────────────

  it("returns available room types matching guest count", async () => {
    const single = await seedRoomType({
      name: "Single",
      capacity: 1,
      pricePerNight: 80,
    });
    const double = await seedRoomType({
      name: "Double",
      capacity: 2,
      pricePerNight: 120,
    });
    await seedRoom(single.id, "101");
    await seedRoom(double.id, "201");

    const result = await ctx.caller.room.searchAvailable({
      checkInDate: futureDate(1),
      checkOutDate: futureDate(3),
      guestCount: 2,
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Double");
  });

  it("returns results ordered by price ascending", async () => {
    const expensive = await seedRoomType({
      name: "Suite",
      capacity: 2,
      pricePerNight: 300,
    });
    const cheap = await seedRoomType({
      name: "Standard",
      capacity: 2,
      pricePerNight: 100,
    });
    await seedRoom(expensive.id, "401");
    await seedRoom(cheap.id, "101");

    const result = await ctx.caller.room.searchAvailable({
      checkInDate: futureDate(1),
      checkOutDate: futureDate(3),
      guestCount: 1,
    });

    expect(result).toHaveLength(2);
    expect(result[0]!.name).toBe("Standard");
    expect(result[1]!.name).toBe("Suite");
  });

  // ── Reservation conflicts ─────────────────────────────────────────

  it("excludes rooms with overlapping reservations", async () => {
    const rt = await seedRoomType({ name: "Standard", capacity: 2 });
    const room = await seedRoom(rt.id, "101");
    const guest = await seedGuest("guest@test.com");

    // Reservation: day 2–6, search: day 4–8 → overlap
    await seedReservation(
      guest.id,
      room.id,
      futureDate(2),
      futureDate(6),
      "confirmed",
    );

    const result = await ctx.caller.room.searchAvailable({
      checkInDate: futureDate(4),
      checkOutDate: futureDate(8),
      guestCount: 1,
    });

    expect(result).toHaveLength(0);
  });

  it("includes rooms when reservations don't overlap", async () => {
    const rt = await seedRoomType({ name: "Standard", capacity: 2 });
    const room = await seedRoom(rt.id, "101");
    const guest = await seedGuest("guest@test.com");

    // Reservation: day 2–4, search: day 5–8 → no overlap
    await seedReservation(guest.id, room.id, futureDate(2), futureDate(4));

    const result = await ctx.caller.room.searchAvailable({
      checkInDate: futureDate(5),
      checkOutDate: futureDate(8),
      guestCount: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Standard");
  });

  it("treats cancelled reservations as not blocking", async () => {
    const rt = await seedRoomType({ name: "Standard", capacity: 2 });
    const room = await seedRoom(rt.id, "101");
    const guest = await seedGuest("guest@test.com");

    // Cancelled reservation that overlaps
    await seedReservation(
      guest.id,
      room.id,
      futureDate(2),
      futureDate(6),
      "cancelled",
    );

    const result = await ctx.caller.room.searchAvailable({
      checkInDate: futureDate(3),
      checkOutDate: futureDate(5),
      guestCount: 1,
    });

    expect(result).toHaveLength(1);
  });

  // ── Room status ────────────────────────────────────────────────────

  it("excludes rooms in maintenance", async () => {
    const rt = await seedRoomType({ name: "Standard", capacity: 2 });
    await seedRoom(rt.id, "101", { status: "maintenance" });

    const result = await ctx.caller.room.searchAvailable({
      checkInDate: futureDate(1),
      checkOutDate: futureDate(3),
      guestCount: 1,
    });

    expect(result).toHaveLength(0);
  });

  // ── Input validation ──────────────────────────────────────────────

  it("rejects check-in date in the past", async () => {
    await expect(
      ctx.caller.room.searchAvailable({
        checkInDate: "2020-01-01",
        checkOutDate: "2020-01-05",
        guestCount: 1,
      }),
    ).rejects.toThrow(/Check-in date cannot be in the past/);
  });

  it("rejects check-out before check-in", async () => {
    await expect(
      ctx.caller.room.searchAvailable({
        checkInDate: futureDate(5),
        checkOutDate: futureDate(2),
        guestCount: 1,
      }),
    ).rejects.toThrow(/Check-out date must be after check-in date/);
  });
});
