import { test, expect } from "@playwright/test";

test("login → pipeline → drag card → persists", async ({ page }) => {
  // Use a wider viewport so all 4 columns fit without horizontal scroll
  await page.setViewportSize({ width: 1400, height: 900 });

  await page.goto("/login");
  await page.getByRole("button", { name: "Use demo credentials" }).click();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("link", { name: "Pipeline" }).click();
  await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();

  // Wait for cards to load
  const firstCardLink = page.locator("a[href^='/opportunities/']").first();
  await firstCardLink.waitFor();
  const cardText = (await firstCardLink.innerText()).trim();

  // The draggable wrapper: dnd-kit's useSortable spreads {...attributes} giving role="button" tabindex="0"
  const firstDraggable = page.locator("[role='button'][tabindex='0']").first();
  await firstDraggable.waitFor();

  // Locate the Won column header and column
  const wonHeaderText = page.locator("div.text-xs.uppercase", { hasText: "Won" }).first();
  await wonHeaderText.waitFor();
  const wonColumn = wonHeaderText.locator("xpath=ancestor::div[contains(@class,'min-w-[280px]')][1]");

  const targetBox = await wonColumn.boundingBox();
  if (!targetBox) throw new Error("missing Won column box");

  const cardBox = await firstDraggable.boundingBox();
  if (!cardBox) throw new Error("missing card box");

  const sx = cardBox.x + cardBox.width / 2;
  const sy = cardBox.y + cardBox.height / 2;
  const tx = targetBox.x + targetBox.width / 2;
  // Target the column header area — the header div with stage name is at the very top.
  // p-3 = 12px padding, header height ~24px, so header center is at y+24.
  // We want to land in the header (before any cards start) to hit the column droppable.
  const ty = targetBox.y + 20;

  // Use page.mouse for real pointer events that dnd-kit PointerSensor handles natively
  // 1. Move to source, press
  await page.mouse.move(sx, sy);
  await page.mouse.down();

  // 2. Small moves to exceed activation distance of 4px (use small steps to avoid jumps)
  await page.mouse.move(sx + 1, sy, { steps: 1 });
  await page.mouse.move(sx + 3, sy, { steps: 1 });
  await page.mouse.move(sx + 6, sy, { steps: 1 });
  await page.waitForTimeout(50);

  // 3. Move to target position in multiple steps
  await page.mouse.move(tx, ty, { steps: 20 });
  await page.waitForTimeout(200);

  // 4. Release to drop
  await page.mouse.up();

  // Allow React to re-render and the PATCH mutation to flush
  await page.waitForTimeout(1000);

  // Verify the card moved to Won
  await expect(wonColumn.getByText(cardText, { exact: false }).first()).toBeVisible();

  // Reload and verify persistence
  await page.reload();
  await wonColumn.waitFor();
  await expect(wonColumn.getByText(cardText, { exact: false }).first()).toBeVisible();
});
