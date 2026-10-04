import { expect, test } from "@playwright/test";
import { watchErrors } from "./helpers";

test("landing page tells the story", async ({ page }) => {
  const check = watchErrors(page);
  await page.goto("/");
  await expect(page).toHaveTitle(/CASEFILE/);
  await expect(page.getByRole("link", { name: /Play demo case/i }).first()).toBeVisible();
  check();
});

test("the archive shows the open case and the sealed ones", async ({ page }) => {
  const check = watchErrors(page);
  await page.goto("/archive");
  await expect(page.getByRole("heading", { name: "The Archive", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /case 047, The Last Call/i })).toBeVisible();
  await expect(page.getByText("SEALED · SEALED", { exact: false }).first()).toBeAttached();
  check();
});

test("the case intro plays and reaches the briefing", async ({ page }) => {
  const check = watchErrors(page);
  await page.goto("/cases/047");
  await page.getByRole("button", { name: "Open file" }).click();
  await page.getByRole("button", { name: "Skip ▸" }).click();
  await expect(page.getByRole("heading", { name: "The Last Call" })).toBeVisible();
  // A form button with a database; a plain link to the device-only mode without one.
  const begin = page.getByRole("button", { name: "Begin investigation" }).or(page.getByRole("link", { name: "Begin investigation" }));
  await expect(begin).toBeVisible();
  check();
});

test("unknown pages get the in-world 404", async ({ page }) => {
  const res = await page.goto("/cases/999");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("No such file.")).toBeVisible();
});

test("the admin area does not announce itself", async ({ page }) => {
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);
});

test("health endpoint reports the database", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  expect(await res.json()).toMatchObject({ ok: true });
});
