import { expect, test } from "@playwright/test";
import { unique, watchErrors } from "./helpers";

test("register, sign out, sign in, and a wrong password keeps the email", async ({ page }) => {
  const check = watchErrors(page);
  const email = `${unique("e2e")}@casefile.test`;
  await page.goto("/login?mode=register");
  await page.locator("input[name=codename]").fill("Night Ledger");
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill("long enough password");
  await page.locator("form button[type=submit]").first().click();
  await page.waitForURL(/\/archive/);
  await expect(page.getByRole("button", { name: /Night Ledger/ })).toBeVisible();

  await page.getByRole("button", { name: /Night Ledger/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL((u) => u.pathname === "/");

  await page.goto("/login");
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill("not the password");
  await page.locator("form button[type=submit]").first().click();
  await expect(page.locator("p[role=alert]")).toBeVisible();
  await expect(page.locator("input[name=email]")).toHaveValue(email);

  await page.locator("input[name=password]").fill("long enough password");
  await page.locator("form button[type=submit]").first().click();
  await page.waitForURL(/\/archive/);
  check();
});

test("a guest can register in place and keep their investigation", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Continue as a guest/ }).click();
  await page.waitForURL(/\/archive/);
  await page.goto("/cases/047");
  await page.getByRole("button", { name: "Open file" }).click();
  await page.getByRole("button", { name: "Skip ▸" }).click();
  await page.getByRole("button", { name: "Begin investigation" }).click();
  await page.waitForURL(/\/play\//);
  const room = page.url();

  await page.goto("/login?mode=register&next=/profile");
  await page.locator("input[name=codename]").fill("Pale Sparrow");
  await page.locator("input[name=email]").fill(`${unique("guest")}@casefile.test`);
  await page.locator("input[name=password]").fill("long enough password");
  await page.locator("form button[type=submit]").first().click();
  await page.waitForURL(/\/profile/);
  await expect(page.getByRole("heading", { name: "Pale Sparrow" })).toBeVisible();
  await expect(page.getByText("The Last Call").first()).toBeVisible();

  await page.goto(room);
  await expect(page.getByRole("button", { name: /^Desk/ })).toBeVisible();
});
