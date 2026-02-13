import { relations, sql } from "drizzle-orm";
import { index, sqliteTableCreator, unique } from "drizzle-orm/sqlite-core";

/**
 * Multi-project schema: all tables prefixed with `hrs_`.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `hrs_${name}`);

// ─── GUEST ──────────────────────────────────────────────────────────────────────

export const guests = createTable(
  "guest",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    firstName: d.text({ length: 50 }).notNull(),
    lastName: d.text({ length: 50 }).notNull(),
    email: d.text({ length: 100 }).notNull(),
    phone: d.text({ length: 20 }),
  }),
  (t) => [unique().on(t.email)],
);

export const guestsRelations = relations(guests, ({ many }) => ({
  reservations: many(reservations),
}));

// ─── ROOM TYPE ──────────────────────────────────────────────────────────────────

export const roomTypes = createTable(
  "room_type",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 50 }).notNull(),
    description: d.text({ length: 500 }),
    capacity: d.integer({ mode: "number" }).notNull(),
    pricePerNight: d.real().notNull(),
  }),
  (t) => [unique().on(t.name)],
);

export const roomTypesRelations = relations(roomTypes, ({ many }) => ({
  rooms: many(rooms),
}));

// ─── ROOM ───────────────────────────────────────────────────────────────────────

export const rooms = createTable(
  "room",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    roomNumber: d.text({ length: 10 }).notNull(),
    roomTypeId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => roomTypes.id),
    status: d.text({ length: 20 }).notNull().default("available"),
    floor: d.integer({ mode: "number" }),
  }),
  (t) => [unique().on(t.roomNumber)],
);

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  roomType: one(roomTypes, {
    fields: [rooms.roomTypeId],
    references: [roomTypes.id],
  }),
  reservations: many(reservations),
}));

// ─── RESERVATION ────────────────────────────────────────────────────────────────

export const reservations = createTable(
  "reservation",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    guestId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => guests.id),
    roomId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => rooms.id),
    checkInDate: d.text({ length: 10 }).notNull(),
    checkOutDate: d.text({ length: 10 }).notNull(),
    status: d.text({ length: 20 }).notNull().default("confirmed"),
    createdAt: d
      .integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  }),
  (t) => [
    index("reservation_guest_idx").on(t.guestId),
    index("reservation_room_idx").on(t.roomId),
  ],
);

export const reservationsRelations = relations(
  reservations,
  ({ one, many }) => ({
    guest: one(guests, {
      fields: [reservations.guestId],
      references: [guests.id],
    }),
    room: one(rooms, {
      fields: [reservations.roomId],
      references: [rooms.id],
    }),
    invoice: one(invoices),
  }),
);

// ─── INVOICE ────────────────────────────────────────────────────────────────────

export const invoices = createTable(
  "invoice",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    reservationId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => reservations.id),
    totalAmount: d.real().notNull(),
    issuedAt: d
      .integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  }),
  (t) => [unique().on(t.reservationId)],
);

export const invoicesRelations = relations(invoices, ({ one }) => ({
  reservation: one(reservations, {
    fields: [invoices.reservationId],
    references: [reservations.id],
  }),
}));
