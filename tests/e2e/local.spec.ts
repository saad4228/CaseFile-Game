import { expect, test } from "@playwright/test";
import { trayCount, watchErrors } from "./helpers";

test("device-only mode saves progress in the browser and ORACLE searches it", async ({ page }) => {
  const check = watchErrors(page);
  await page.goto("/investigation/047");
  await expect(page.getByRole("button", { name: /^Desk/ })).toBeVisible();
  const before = await trayCount(page);

  await page.getByRole("button", { name: /^Desk/ }).click();
  await page.getByRole("button", { name: "Investigate", exact: true }).first().click();
  await expect(page.getByText(/New record/)).toBeVisible();
  expect(await trayCount(page)).toBeGreaterThan(before);
  const after = await trayCount(page);

  await page.reload();
  await expect(page.getByRole("button", { name: /^Desk/ })).toBeVisible();
  await expect.poll(() => trayCount(page)).toBe(after);

  await page.getByRole("button", { name: /^Desk/ }).click();
  await page.getByRole("button", { name: "Oracle" }).click();
  await page.getByLabel("Ask ORACLE").fill("What happened between 23:40 and 23:50?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByText(/records? you hold mention a time/)).toBeVisible();
  // Follow-up questions appear under the answer and can be asked with one tap.
  await page.getByRole("group", { name: "Ask next" }).getByRole("button").first().click();
  await expect(page.locator("p.font-display.italic", { hasText: /^“.*”$/ })).toHaveCount(2);
  check();
});
