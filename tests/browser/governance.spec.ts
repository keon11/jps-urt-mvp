import { screenshotRun } from "./artifact-run";
import { test, expect, type Page } from "@playwright/test";
import { demonstrationPassword } from "./local-account";
async function login(page: Page, role: string) {
  await page.goto("/");
  await page.getByLabel("Demonstration role").selectOption(role);
  await page
    .getByLabel("Password", { exact: true })
    .fill(demonstrationPassword(role));
  await page.getByRole("button", { name: "Sign in to workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Review queue", exact: true }),
  ).toBeVisible();
}
async function changeRole(page: Page, role: string) {
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await login(page, role);
  await page
    .getByRole("button", { name: "Policy management", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Policy Management Center",
      exact: true,
    }),
  ).toBeVisible();
}
test("policy governance and internal authorization buttons execute real role-restricted backend workflows", async ({
  page,
}) => {
  await login(page, "reviewer");
  await page
    .getByRole("button", { name: "Policy management", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Request policy change", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Draft correction created",
  );
  let article = page.locator(".change-request").first();
  await article
    .getByRole("button", { name: "Request Approval", exact: true })
    .click();
  await expect(article).toContainText("evidence verification");
  await changeRole(page, "admin");
  article = page.locator(".change-request").first();
  for (const [button, state] of [
    ["Verify evidence", "conflict analysis"],
    ["Analyze conflicts", "testing"],
    ["Test candidate", "authorized approval"],
    ["Supervisor approval", "admin"],
  ]) {
    await article.getByRole("button", { name: button, exact: true }).click();
    await expect(article).toContainText(state);
  }
  await changeRole(page, "advisor");
  article = page.locator(".change-request").first();
  await article.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(article).toContainText("approved");
  await changeRole(page, "admin");
  article = page.locator(".change-request").first();
  await article
    .getByRole("button", { name: "Publish approved version", exact: true })
    .click();
  await expect(
    page.getByText("Active: synthetic-2", { exact: true }),
  ).toBeVisible();
  for (const width of [1440, 1920]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.screenshot({
      path: `artifacts/issue-2/${screenshotRun}/${width}/policy-center.png`,
      fullPage: true,
    });
  }
  await article
    .getByRole("button", { name: "Roll back publication", exact: true })
    .click();
  await expect(
    page.getByText("Active: synthetic-1", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Review queue/ }).click();
  await page.getByRole("button", { name: "Open Maya Fictional" }).click();
  await page
    .getByRole("button", { name: "Authorization Review", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Approve internal next step", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Internal review recorded",
  );
  for (const width of [1440, 1920]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.screenshot({
      path: `artifacts/issue-2/${screenshotRun}/${width}/internal-authorization.png`,
      fullPage: true,
    });
  }
  await expect(
    page.getByRole("heading", {
      name: "Internal Authorization Review",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/clarity/i);
});
