import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";

import * as schema from "./schema";

const client = createClient({ url: "file:./db.sqlite" });
const db = drizzle(client, { schema });

// ─── ROOM TYPES ────────────────────────────────────────────────────────────────

const roomTypeData = [
  {
    name: "Single Room",
    description: "Cozy room with a single bed, ideal for solo travelers.",
    capacity: 1,
    pricePerNight: 89,
  },
  {
    name: "Double Room",
    description:
      "Spacious room with a double bed, perfect for couples or business stays.",
    capacity: 2,
    pricePerNight: 129,
  },
  {
    name: "Twin Room",
    description: "Room with two single beds, great for friends or colleagues.",
    capacity: 2,
    pricePerNight: 119,
  },
  {
    name: "Junior Suite",
    description:
      "Upgraded room with a sitting area and premium amenities for a comfortable stay.",
    capacity: 2,
    pricePerNight: 199,
  },
  {
    name: "Executive Suite",
    description:
      "Luxurious suite with separate living area, workspace, and panoramic views.",
    capacity: 3,
    pricePerNight: 349,
  },
] as const;

// ─── ROOMS ─────────────────────────────────────────────────────────────────────

// roomTypeIndex refers to the index in roomTypeData above
const roomData = [
  // Floor 1 — ground floor, mix of singles and doubles
  { roomNumber: "101", roomTypeIndex: 0, floor: 1, status: "available" },
  { roomNumber: "102", roomTypeIndex: 0, floor: 1, status: "available" },
  { roomNumber: "103", roomTypeIndex: 1, floor: 1, status: "occupied" },
  { roomNumber: "104", roomTypeIndex: 1, floor: 1, status: "available" },
  // Floor 2 — doubles and twins
  { roomNumber: "201", roomTypeIndex: 1, floor: 2, status: "available" },
  { roomNumber: "202", roomTypeIndex: 1, floor: 2, status: "occupied" },
  { roomNumber: "203", roomTypeIndex: 2, floor: 2, status: "available" },
  { roomNumber: "204", roomTypeIndex: 2, floor: 2, status: "maintenance" },
  // Floor 3 — twins and junior suites
  { roomNumber: "301", roomTypeIndex: 2, floor: 3, status: "available" },
  { roomNumber: "302", roomTypeIndex: 3, floor: 3, status: "available" },
  { roomNumber: "303", roomTypeIndex: 3, floor: 3, status: "occupied" },
  // Floor 4 — executive suites
  { roomNumber: "401", roomTypeIndex: 4, floor: 4, status: "available" },
  { roomNumber: "402", roomTypeIndex: 4, floor: 4, status: "occupied" },
] as const;

// ─── GUESTS ────────────────────────────────────────────────────────────────────

const guestData = [
  {
    firstName: "Anna",
    lastName: "Mueller",
    email: "anna.mueller@example.com",
    phone: "+49 170 1234567",
  },
  {
    firstName: "James",
    lastName: "Smith",
    email: "james.smith@example.com",
    phone: "+44 7911 123456",
  },
  {
    firstName: "Maria",
    lastName: "Garcia",
    email: "maria.garcia@example.com",
    phone: "+34 612 345678",
  },
  {
    firstName: "Luca",
    lastName: "Rossi",
    email: "luca.rossi@example.com",
    phone: "+39 333 1234567",
  },
  {
    firstName: "Sophie",
    lastName: "Dubois",
    email: "sophie.dubois@example.com",
    phone: "+33 6 12 34 56 78",
  },
  {
    firstName: "Kenji",
    lastName: "Tanaka",
    email: "kenji.tanaka@example.com",
    phone: "+81 90 1234 5678",
  },
  {
    firstName: "Elena",
    lastName: "Petrova",
    email: "elena.petrova@example.com",
    phone: null,
  },
  {
    firstName: "Carlos",
    lastName: "Silva",
    email: "carlos.silva@example.com",
    phone: "+55 11 91234 5678",
  },
] as const;

// ─── RESERVATIONS ──────────────────────────────────────────────────────────────

// Helper: date string relative to today
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// guestIndex/roomIndex refer to insertion order (0-based)
const reservationData = [
  // Past — checked out
  {
    guestIndex: 0,
    roomIndex: 0,
    checkIn: dateOffset(-14),
    checkOut: dateOffset(-10),
    status: "checked_out",
  },
  {
    guestIndex: 1,
    roomIndex: 4,
    checkIn: dateOffset(-7),
    checkOut: dateOffset(-3),
    status: "checked_out",
  },
  // Current — checked in (matches rooms marked "occupied")
  {
    guestIndex: 2,
    roomIndex: 2, // room 103
    checkIn: dateOffset(-2),
    checkOut: dateOffset(3),
    status: "checked_in",
  },
  {
    guestIndex: 3,
    roomIndex: 5, // room 202
    checkIn: dateOffset(-1),
    checkOut: dateOffset(4),
    status: "checked_in",
  },
  {
    guestIndex: 4,
    roomIndex: 10, // room 303
    checkIn: dateOffset(-3),
    checkOut: dateOffset(2),
    status: "checked_in",
  },
  {
    guestIndex: 5,
    roomIndex: 12, // room 402
    checkIn: dateOffset(0),
    checkOut: dateOffset(5),
    status: "checked_in",
  },
  // Future — confirmed
  {
    guestIndex: 6,
    roomIndex: 3,
    checkIn: dateOffset(7),
    checkOut: dateOffset(12),
    status: "confirmed",
  },
  {
    guestIndex: 7,
    roomIndex: 11,
    checkIn: dateOffset(10),
    checkOut: dateOffset(14),
    status: "confirmed",
  },
  {
    guestIndex: 0,
    roomIndex: 8,
    checkIn: dateOffset(20),
    checkOut: dateOffset(25),
    status: "confirmed",
  },
  // Cancelled
  {
    guestIndex: 1,
    roomIndex: 9,
    checkIn: dateOffset(5),
    checkOut: dateOffset(8),
    status: "cancelled",
  },
];

// ─── INVOICES ──────────────────────────────────────────────────────────────────

// Invoices for checked-out reservations (indices 0 and 1 above)
// Total = nights × pricePerNight of the room's type
function nightsBetween(checkIn: string, checkOut: string): number {
  const msPerDay = 86_400_000;
  return Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / msPerDay,
  );
}

// ─── SEED ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Seeding database...\n");

  // Clear existing data (reverse FK order)
  await db.delete(schema.invoices).run();
  await db.delete(schema.reservations).run();
  await db.delete(schema.rooms).run();
  await db.delete(schema.roomTypes).run();
  await db.delete(schema.guests).run();

  // Reset auto-increment counters
  await db.run(
    sql`DELETE FROM sqlite_sequence WHERE name LIKE 'hrs_%'`,
  );

  // Room types
  const insertedRoomTypes = await db
    .insert(schema.roomTypes)
    .values([...roomTypeData])
    .returning();
  console.log(`  Room types:    ${insertedRoomTypes.length} inserted`);

  // Rooms
  const roomValues = roomData.map((r) => ({
    roomNumber: r.roomNumber,
    roomTypeId: insertedRoomTypes[r.roomTypeIndex]!.id,
    floor: r.floor,
    status: r.status,
  }));
  const insertedRooms = await db
    .insert(schema.rooms)
    .values(roomValues)
    .returning();
  console.log(`  Rooms:         ${insertedRooms.length} inserted`);

  // Guests
  const insertedGuests = await db
    .insert(schema.guests)
    .values([...guestData])
    .returning();
  console.log(`  Guests:        ${insertedGuests.length} inserted`);

  // Reservations
  const reservationValues = reservationData.map((r) => ({
    guestId: insertedGuests[r.guestIndex]!.id,
    roomId: insertedRooms[r.roomIndex]!.id,
    checkInDate: r.checkIn,
    checkOutDate: r.checkOut,
    status: r.status,
  }));
  const insertedReservations = await db
    .insert(schema.reservations)
    .values(reservationValues)
    .returning();
  console.log(`  Reservations:  ${insertedReservations.length} inserted`);

  // Invoices — for checked-out reservations only
  const invoiceValues = insertedReservations
    .filter((_r, i) => reservationData[i]!.status === "checked_out")
    .map((res) => {
      const room = insertedRooms.find((r) => r.id === res.roomId)!;
      const roomType = insertedRoomTypes.find(
        (rt) => rt.id === room.roomTypeId,
      )!;
      const nights = nightsBetween(res.checkInDate, res.checkOutDate);
      return {
        reservationId: res.id,
        totalAmount: nights * roomType.pricePerNight,
      };
    });
  const insertedInvoices = await db
    .insert(schema.invoices)
    .values(invoiceValues)
    .returning();
  console.log(`  Invoices:      ${insertedInvoices.length} inserted`);

  console.log("\nDone.");
  client.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
