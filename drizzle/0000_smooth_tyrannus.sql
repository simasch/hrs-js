CREATE TABLE `hrs_guest` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`firstName` text(50) NOT NULL,
	`lastName` text(50) NOT NULL,
	`email` text(100) NOT NULL,
	`phone` text(20)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hrs_guest_email_unique` ON `hrs_guest` (`email`);--> statement-breakpoint
CREATE TABLE `hrs_invoice` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reservationId` integer NOT NULL,
	`totalAmount` real NOT NULL,
	`issuedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`reservationId`) REFERENCES `hrs_reservation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hrs_invoice_reservationId_unique` ON `hrs_invoice` (`reservationId`);--> statement-breakpoint
CREATE TABLE `hrs_reservation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guestId` integer NOT NULL,
	`roomId` integer NOT NULL,
	`checkInDate` text(10) NOT NULL,
	`checkOutDate` text(10) NOT NULL,
	`status` text(20) DEFAULT 'confirmed' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`guestId`) REFERENCES `hrs_guest`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`roomId`) REFERENCES `hrs_room`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `reservation_guest_idx` ON `hrs_reservation` (`guestId`);--> statement-breakpoint
CREATE INDEX `reservation_room_idx` ON `hrs_reservation` (`roomId`);--> statement-breakpoint
CREATE TABLE `hrs_room_type` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(50) NOT NULL,
	`description` text(500),
	`capacity` integer NOT NULL,
	`pricePerNight` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hrs_room_type_name_unique` ON `hrs_room_type` (`name`);--> statement-breakpoint
CREATE TABLE `hrs_room` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`roomNumber` text(10) NOT NULL,
	`roomTypeId` integer NOT NULL,
	`status` text(20) DEFAULT 'available' NOT NULL,
	`floor` integer,
	FOREIGN KEY (`roomTypeId`) REFERENCES `hrs_room_type`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hrs_room_roomNumber_unique` ON `hrs_room` (`roomNumber`);