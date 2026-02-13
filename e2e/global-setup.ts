import { execSync } from "node:child_process";

export default function globalSetup() {
  console.log("Seeding database...");
  execSync("npm run db:seed", { stdio: "inherit" });
}
