import { expect, test } from "@playwright/test";
import { trayCount } from "./helpers";

test("two investigators share a room, hold different records and see each other's work", async ({ browser }) => {
  test.slow();
  const host = await (await browser.newContext()).newPage();
  const guest = await (await browser.newContext()).newPage();

  await host.goto("/rooms/new");
  await host.getByRole("button", { name: "Open room" }).click();
  await host.waitForURL(/\/play\/[A-Z0-9]+$/);
  const url = host.url();
  await host.getByRole("button", { name: /^Detective/ }).click();
  await expect(host.getByText("Yours — click to release")).toBeVisible();

  await guest.goto(url);
  await guest.getByRole("button", { name: "Join the investigation" }).click();
  await expect(guest.getByText("Your role")).toBeVisible();
  await guest.getByRole("button", { name: /^Cyber/ }).click();
  await expect(host.getByText(/Taken by/)).toBeVisible();
  await guest.getByRole("button", { name: "I'm ready" }).click();

  await host.getByRole("button", { name: "Open the case" }).click();
  await expect(host.getByRole("button", { name: /^Desk/ })).toBeVisible();
  await expect(guest.getByRole("button", { name: /^Desk/ })).toBeVisible();

  // Asymmetric starting records
  const hostRecords = await trayCount(host);
  const guestRecords = await trayCount(guest);
  expect(hostRecords).toBeGreaterThan(1);
  expect(guestRecords).toBeGreaterThan(1);
  expect(hostRecords).not.toBe(guestRecords);

  // A lead's result stays private to whoever followed it
  await host.getByRole("button", { name: /^Desk/ }).click();
  await host.getByRole("button", { name: "Investigate", exact: true }).first().click();
  await expect(host.getByText(/private to you/)).toBeVisible();
  await expect.poll(() => trayCount(host)).toBe(hostRecords + 1);
  expect(await trayCount(guest)).toBe(guestRecords);
  await host.getByRole("button", { name: "Close desk" }).click();

  // Team chat with a record reference
  await host.getByRole("button", { name: /^Chat/ }).click();
  await host.getByRole("textbox", { name: "Message" }).fill("Check #001 — the times don't sit right.");
  await host.getByRole("button", { name: "Send" }).click();
  await guest.getByRole("button", { name: /^Chat/ }).click();
  await expect(guest.getByText("the times don't sit right")).toBeVisible();
  await guest.getByRole("button", { name: "Close", exact: false }).first().click().catch(() => {});

  // The verdict sheet is shared
  await guest.goto(url);
  await guest.getByRole("button", { name: "Verdict", exact: true }).click();
  await guest.locator("label", { hasText: "Marcus Reed" }).first().click();
  await host.goto(url);
  await host.getByRole("button", { name: "Verdict", exact: true }).click();
  await expect(host.locator("label.border-amber-500", { hasText: "Marcus Reed" })).toBeVisible();
});
