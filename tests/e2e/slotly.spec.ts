import { expect, test } from "@playwright/test";

test("creates a poll, joins it, saves availability, and shows ranked results", async ({
  page,
}) => {
  const title = `E2E Slotly ${Date.now()}`;
  const participantName = "E2E Tester";

  await page.goto("/new");
  await page.getByLabel("Event name").fill(title);
  await page.getByLabel("Start date").fill("2026-06-15");
  await page.getByLabel("End date").fill("2026-06-15");
  await page.getByLabel("Event duration").selectOption("60");
  await page.getByLabel("Grid resolution").selectOption("30");
  await page.getByRole("button", { name: "Create Event" }).click();

  await expect(page).toHaveURL(/\/e\/[0-9a-f-]+$/i);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("0 participants joined")).toBeVisible();

  await page.getByLabel("Your name").fill(participantName);
  await page.getByRole("button", { name: "Join poll" }).click();

  await expect(page.getByText("You joined this poll.")).toBeVisible();
  await page
    .getByRole("button", { name: /Mon, Jun 15.*06:00 PM -> 07:00 PM/ })
    .click();
  await page.getByRole("button", { name: "Save availability" }).click();

  await expect(page.getByText("Availability saved.")).toBeVisible();
  await page.getByRole("link", { name: "View results" }).click();

  await expect(page).toHaveURL(/\/results$/);
  await expect(
    page.getByRole("heading", { name: `Best times for ${title}` }),
  ).toBeVisible();
  await expect(page.getByText("1 participant joined")).toBeVisible();
  await expect(page.getByText("1 available")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /06:00 PM -> 07:00 PM/ }),
  ).toBeVisible();
  await expect(page.getByText(participantName)).toBeVisible();
});
