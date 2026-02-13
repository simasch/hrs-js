"use client";

import { api } from "~/trpc/react";

export function LatestPost() {
  const [hello] = api.post.hello.useSuspenseQuery({ text: "from tRPC" });

  return (
    <div className="w-full max-w-xs">
      <p className="truncate">{hello.greeting}</p>
    </div>
  );
}
