import { HydrateClient } from "~/trpc/server";
import { RoomSearch } from "~/app/_components/room-search";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center gap-8 px-4 py-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Hotel Reservation System
          </h1>
          <p className="text-lg text-white/70">
            Find and book your perfect room
          </p>
          <RoomSearch />
        </div>
      </main>
    </HydrateClient>
  );
}
