import { test, expect } from "@playwright/test";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

test.describe("Room Search", () => {
  test("page loads with search form visible", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Hotel Reservation System" }),
    ).toBeVisible();
    await expect(page.getByLabel("Check-in Date")).toBeVisible();
    await expect(page.getByLabel("Check-out Date")).toBeVisible();
    await expect(page.getByLabel("Guests")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Search Rooms" }),
    ).toBeVisible();
  });

  test("successful search returns room cards", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Check-in Date").fill(daysFromNow(30));
    await page.getByLabel("Check-out Date").fill(daysFromNow(32));
    await page.getByLabel("Guests").fill("1");
    await page.getByRole("button", { name: "Search Rooms" }).click();

    await expect(page.getByText("Single Room")).toBeVisible();
    await expect(page.getByText("CHF 89.00")).toBeVisible();
  });

  test("empty results show message", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Check-in Date").fill(daysFromNow(30));
    await page.getByLabel("Check-out Date").fill(daysFromNow(32));
    await page.getByLabel("Guests").fill("10");
    await page.getByRole("button", { name: "Search Rooms" }).click();

    await expect(
      page.getByText("No rooms available for the selected dates and capacity."),
    ).toBeVisible();
  });

  test("validation errors display", async ({ page }) => {
    await page.goto("/");

    // Same date for check-in and check-out: browser allows it (min is >=)
    // but server rejects it (Zod requires check-out strictly after check-in)
    const sameDate = daysFromNow(5);
    await page.getByLabel("Check-in Date").fill(sameDate);
    await page.getByLabel("Check-out Date").fill(sameDate);
    await page.getByLabel("Guests").fill("1");
    await page.getByRole("button", { name: "Search Rooms" }).click();

    await expect(
      page.getByText("Check-out date must be after check-in date"),
    ).toBeVisible({ timeout: 15000 });
  });
});
