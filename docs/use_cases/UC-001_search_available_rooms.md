# Use Case: Search Available Rooms

## Overview

**Use Case ID:** UC-001    
**Use Case Name:** Search Available Rooms    
**Primary Actor:** Guest    
**Goal:** Find available rooms for a desired stay period    
**Status:** Draft

**Requirement:** FR-001 — Guests can search for available rooms online

## Preconditions

- The hotel has at least one room configured in the system
- Room types with pricing are defined

## Main Success Scenario

1. Guest opens the room search page.
2. System displays the search form with check-in date, check-out date, and number of guests fields.
3. Guest enters check-in date, check-out date, and number of guests.
4. Guest submits the search.
5. System validates the search criteria.
6. System retrieves rooms that are not reserved for the requested dates and match the guest capacity.
7. System displays a list of available room types with name, description, capacity, and price per night.

## Alternative Flows

### A1: No Rooms Available

**Trigger:** No rooms match the search criteria (step 6)
**Flow:**

1. System displays a message indicating no rooms are available for the selected dates and capacity.
2. Guest adjusts the search criteria.
3. Use case continues at step 4.

### A2: Invalid Date Range

**Trigger:** Check-out date is on or before check-in date (step 5)
**Flow:**

1. System displays a validation error indicating the check-out date must be after the check-in date.
2. Guest corrects the dates.
3. Use case continues at step 4.

### A3: Check-In Date in the Past

**Trigger:** Check-in date is before today (step 5)
**Flow:**

1. System displays a validation error indicating the check-in date cannot be in the past.
2. Guest corrects the check-in date.
3. Use case continues at step 4.

### A4: Guest Capacity Exceeds All Room Types

**Trigger:** Number of guests exceeds the maximum capacity of any room type (step 6)
**Flow:**

1. System displays a message suggesting the guest book multiple rooms.
2. Guest adjusts the number of guests.
3. Use case continues at step 4.

## Postconditions

### Success Postconditions

- Guest sees a list of available room types for the requested dates
- No data is modified in the system

### Failure Postconditions

- No results are displayed
- No data is modified in the system

## Business Rules

### BR-001: Minimum Stay

Reservations must be for at least one night. The check-out date must be at least one day after the check-in date.

### BR-002: Advance Booking Limit

Searches cannot be made for dates more than 365 days in advance.

### BR-003: Availability Determination

A room is considered available for a date range if it has no overlapping reservation with status "confirmed" or "
checked_in" for that period, and the room status is not "maintenance".
