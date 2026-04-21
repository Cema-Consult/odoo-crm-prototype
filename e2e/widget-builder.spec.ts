import { test, expect } from "@playwright/test";

// Skip the whole file if no LLM key — the test hits a real Claude call
test.skip(!process.env.ANTHROPIC_API_KEY, "needs ANTHROPIC_API_KEY");

test("admin: generate → publish → appears on dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Use demo credentials" }).click();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/dashboard/studio");
  await page.getByPlaceholder(/Bar chart of won deals/).fill("Bar chart of opportunities grouped by stage, count.");
  await page.getByRole("button", { name: /Generate/ }).click();

  // Wait for the preview to render something
  await expect(page.getByText("Preview")).toBeVisible();
  await page.waitForTimeout(8000); // LLM round-trip

  await page.getByRole("button", { name: /Approve & publish/ }).click();

  await page.goto("/dashboard");
  await page.getByRole("tab", { name: "Custom widgets" }).click();
  // Expect at least one WidgetRenderer card to be visible
  await expect(page.locator(".bg-surface.border.rounded-lg").first()).toBeVisible();
});
