import { expect, test, type Locator, type Page } from "@playwright/test";

test("creates a poll, joins it, saves availability, and shows ranked results", async ({
  page,
}) => {
  const title = `E2E Slotly ${Date.now()}`;
  const participantName = "E2E Tester";

  await page.goto("/new");
  await page.getByLabel("Event name").fill(title);
  await page.getByLabel("Start date").fill("2026-06-15");
  await page.getByLabel("End date").fill("2026-06-15");
  await page.getByLabel("Start time").fill("19:00");
  await page.getByLabel("End time").fill("22:00");
  await page.getByLabel("Event duration").selectOption("60");
  await page.getByLabel("Slot size").selectOption("30");
  await page.getByRole("button", { name: "Create Event" }).click();

  await expect(page).toHaveURL(/\/e\/[0-9a-f-]+$/i);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("0 participants joined")).toBeVisible();

  await page.getByLabel("Your name").fill(participantName);
  await page.getByRole("button", { name: "Join poll" }).click();

  await expect(page.getByText("You joined this poll.")).toBeVisible();
  const firstSlot = page.getByRole("button", {
    name: /Mon, Jun 15.*07:00 PM -> 07:30 PM/,
  });
  const secondSlot = page.getByRole("button", {
    name: /Mon, Jun 15.*07:30 PM -> 08:00 PM/,
  });

  await expect(
    page.getByRole("button", { name: "Save availability" }),
  ).toBeDisabled();
  await firstSlot.click();
  await expect(firstSlot).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Cancel changes" }).click();
  await expect(firstSlot).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("button", { name: "Apply to all days" }).click();
  await expect(firstSlot).toHaveAttribute("aria-pressed", "true");
  await expect(secondSlot).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(firstSlot).toHaveAttribute("aria-pressed", "false");
  await expect(secondSlot).toHaveAttribute("aria-pressed", "false");

  await firstSlot.click();
  await expect(firstSlot).toHaveAttribute("aria-pressed", "true");
  await firstSlot.click();
  await expect(firstSlot).toHaveAttribute("aria-pressed", "false");

  await dragBetween(page, firstSlot, secondSlot);
  await expect(firstSlot).toHaveAttribute("aria-pressed", "true");
  await expect(secondSlot).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Save availability" }).click();

  await expect(page.getByText("Availability saved.")).toBeVisible();
  await page.reload();
  await expect(
    page.getByText(`Welcome back, ${participantName}.`),
  ).toBeVisible();
  await expect(page.getByLabel("Your name")).toBeHidden();
  await expect(firstSlot).toHaveAttribute("aria-pressed", "true");
  await expect(secondSlot).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: "View results" }).click();

  await expect(page).toHaveURL(/\/results$/);
  await expect(
    page.getByRole("heading", { name: `Best times for ${title}` }),
  ).toBeVisible();
  await expect(page.getByText("1 participant joined")).toBeVisible();
  await expect(page.getByText("1 available")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /07:00 PM -> 08:00 PM/ }),
  ).toBeVisible();
  await expect(page.getByText(participantName)).toBeVisible();
});

async function dragBetween(
  page: Page,
  startLocator: Locator,
  endLocator: Locator,
) {
  const startBox = await startLocator.boundingBox();
  const endBox = await endLocator.boundingBox();

  if (!startBox || !endBox) {
    throw new Error("Expected drag targets to be visible");
  }

  await page.mouse.move(
    startBox.x + startBox.width / 2,
    startBox.y + startBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    endBox.x + endBox.width / 2,
    endBox.y + endBox.height / 2,
    { steps: 8 },
  );
  await page.mouse.up();
}
