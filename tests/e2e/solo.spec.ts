import { expect, test } from "@playwright/test";
import { followAllLeads, present, startSolo, trayCount, watchErrors } from "./helpers";

test("a full solo investigation can be solved", async ({ page }) => {
  test.slow();
  const check = watchErrors(page);
  await startSolo(page);
  await followAllLeads(page);

  await present(page, "Sarah Vale", "#017");
  await expect(page.getByText(/gave a revised statement/)).toBeVisible();
  await present(page, "Noah Grant", "#014");
  await present(page, "Marcus Reed", "#028");
  await present(page, "Elena Cross", "#018");
  await expect.poll(() => trayCount(page)).toBe(34);

  await page.getByRole("button", { name: "Verdict", exact: true }).click();
  for (const label of ["Elena Cross", "Poisoned", "23:41 – 23:47", "Room 314", "To protect what is stored under the Blackwood"]) {
    await page.locator("label", { hasText: label }).first().click();
  }
  const proof: Record<string, string[]> = {
    Motive: ["#029", "#033"],
    Opportunity: ["#018", "#019"],
    Means: ["#023", "#024"],
    Timeline: ["#025", "#026"],
    Identity: ["#020", "#034"],
  };
  for (const [slot, codes] of Object.entries(proof)) {
    const box = page.locator("div.border-dashed", { has: page.locator("p.label", { hasText: new RegExp(`^${slot}$`) }) });
    for (const code of codes) {
      await box.getByRole("button", { name: "+ Evidence" }).click();
      await box.locator(`.panel button:has-text("${code}")`).first().click();
    }
  }
  await expect(page.getByText("5/5 answered")).toBeVisible();
  await page.getByRole("button", { name: "File the verdict" }).click();
  await page.getByRole("button", { name: "File it" }).click();

  await expect(page.getByRole("heading", { name: "Case resolution" })).toBeVisible();
  await expect(page.getByText(/You solved Case 047/)).toBeVisible();
  check();
});
