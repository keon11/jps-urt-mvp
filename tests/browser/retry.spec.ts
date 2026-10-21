import { test, expect } from "@playwright/test";
import { demonstrationPassword } from "./local-account";
test("a failed payer-simulator click retries the same logical event identifier", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Password", { exact: true })
    .fill(demonstrationPassword());
  await page.getByRole("button", { name: "Sign in to workspace" }).click();
  await page
    .getByRole("button", { name: "Authorizations", exact: true })
    .click();
  await page.getByRole("button", { name: "Open Isla Fictional" }).click();
  const ids: string[] = [];
  await page.route(
    "**/api/cases/authorization/authorization",
    async (route) => {
      ids.push(route.request().postDataJSON().eventId);
      if (ids.length === 1)
        await route.fulfill({
          status: 502,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Injected transport failure; retry preserves identity",
          }),
        });
      else await route.continue();
    },
  );
  await page
    .getByRole("button", { name: "Log simulated notification", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Injected transport failure",
  );
  await expect(page.getByText(/Unresolved event/)).toBeVisible();
  await page
    .getByRole("button", { name: "Log simulated notification", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Simulated event recorded",
  );
  expect(ids).toHaveLength(2);
  expect(ids[1]).toBe(ids[0]);
  await expect(page.getByText(/Unresolved event/)).toHaveCount(0);
});
