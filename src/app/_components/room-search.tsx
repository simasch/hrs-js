"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function RoomSearch() {
  const today = formatDate(new Date());
  const tomorrow = formatDate(
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  );

  const [checkInDate, setCheckInDate] = useState(today);
  const [checkOutDate, setCheckOutDate] = useState(tomorrow);
  const [guestCount, setGuestCount] = useState(1);
  const [searchParams, setSearchParams] = useState<{
    checkInDate: string;
    checkOutDate: string;
    guestCount: number;
  } | null>(null);

  const searchQuery = api.room.searchAvailable.useQuery(searchParams!, {
    enabled: searchParams !== null,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearchParams({ checkInDate, checkOutDate, guestCount });
  }

  const zodError = searchQuery.error?.data?.zodError;
  const fieldErrors = zodError?.fieldErrors;
  const formErrors = zodError?.formErrors;

  return (
    <div className="w-full max-w-3xl">
      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-lg bg-white/10 p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Check-in Date</span>
            <input
              type="date"
              value={checkInDate}
              min={today}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="rounded-md bg-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)]"
              required
            />
            {fieldErrors?.checkInDate && (
              <span className="text-sm text-red-400">
                {fieldErrors.checkInDate[0]}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Check-out Date</span>
            <input
              type="date"
              value={checkOutDate}
              min={checkInDate || today}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="rounded-md bg-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)]"
              required
            />
            {fieldErrors?.checkOutDate && (
              <span className="text-sm text-red-400">
                {fieldErrors.checkOutDate[0]}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Guests</span>
            <input
              type="number"
              value={guestCount}
              min={1}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="rounded-md bg-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)]"
              required
            />
          </label>
        </div>

        {formErrors && formErrors.length > 0 && (
          <p className="mt-2 text-sm text-red-400">{formErrors[0]}</p>
        )}

        <button
          type="submit"
          className="mt-4 w-full rounded-md bg-[hsl(280,100%,70%)] px-4 py-2 font-semibold text-white transition hover:bg-[hsl(280,100%,60%)] disabled:opacity-50"
          disabled={searchQuery.isFetching}
        >
          {searchQuery.isFetching ? "Searching..." : "Search Rooms"}
        </button>
      </form>

      {searchQuery.isError && !zodError && (
        <p className="mb-4 text-center text-red-400">
          An error occurred. Please try again.
        </p>
      )}

      {searchQuery.isSuccess && searchQuery.data.length === 0 && (
        <div className="rounded-lg bg-white/10 p-6 text-center">
          <p className="text-lg">
            No rooms available for the selected dates and capacity.
          </p>
          <p className="mt-2 text-sm text-white/70">
            Try adjusting your dates or reducing the number of guests.
          </p>
        </div>
      )}

      {searchQuery.isSuccess && searchQuery.data.length > 0 && (
        <div className="grid gap-4">
          {searchQuery.data.map((roomType) => (
            <div
              key={roomType.id}
              className="rounded-lg bg-white/10 p-6 transition hover:bg-white/15"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">{roomType.name}</h3>
                  {roomType.description && (
                    <p className="mt-1 text-white/70">
                      {roomType.description}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-white/60">
                    Up to {roomType.capacity}{" "}
                    {roomType.capacity === 1 ? "guest" : "guests"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    CHF {roomType.pricePerNight.toFixed(2)}
                  </p>
                  <p className="text-sm text-white/60">per night</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
