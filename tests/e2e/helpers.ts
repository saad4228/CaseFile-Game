import { expect, type Page } from "@playwright/test";

/** Fail the test on uncaught page errors (hydration mismatches, crashes). */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return () => expect(errors, "uncaught page errors").toEqual([]);
}

export const unique = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

/** Open the case file, skip the intro, and begin a server-backed solo investigation. */
export async function startSolo(page: Page) {
  await page.goto("/cases/047");
  await page.getByRole("button", { name: "Open file" }).click();
  await page.getByRole("button", { name: "Skip ▸" }).click();
  await page.getByRole("button", { name: "Begin investigation" }).click();
  await page.waitForURL(/\/play\/[A-Z0-9]+$/);
  await expect(page.getByRole("button", { name: /^Desk/ })).toBeVisible();
}

export async function trayCount(page: Page) {
  const text = await page.getByRole("region", { name: "Evidence tray" }).innerText();
  return Number(text.match(/EVIDENCE\s*·\s*(\d+)/i)?.[1] ?? NaN);
}

export async function followAllLeads(page: Page) {
  await page.getByRole("button", { name: /^Desk/ }).click();
  await page.getByRole("button", { name: /^Leads/ }).click();
  for (let i = 0; i < 30; i++) {
    const btn = page.getByRole("button", { name: "Investigate", exact: true }).first();
    if (!(await btn.count())) break;
    await btn.click();
    await expect(page.getByText("Recovering record…")).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Close desk" }).click();
}

export async function present(page: Page, suspect: string, code: string) {
  await page.getByRole("button", { name: "People", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(suspect) }).first().click();
  await page.getByRole("tab", { name: /Interview room/ }).click();
  await page.getByRole("button", { name: "Present evidence ▾" }).click();
  await page.getByLabel("Find a record to present").fill(code);
  await page.locator(`ul button:has-text("${code}")`).first().click();
  await expect(page.getByText("…", { exact: true })).toHaveCount(0);
}
