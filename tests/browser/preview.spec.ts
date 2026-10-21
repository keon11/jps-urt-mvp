import { screenshotRun } from "./artifact-run";
import { test, expect } from "@playwright/test";
test("isolated fixture frontend uses no backend or credentials", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("http://localhost:4173");
  await expect(
    page.getByText("Frontend preview — fictional fixtures", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open Maya Fictional" }),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/issue-2/${screenshotRun}/fixture-preview-workstation.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open Maya Fictional" }).click();
  await expect(
    page.getByRole("button", { name: "Run initial review", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Reasoning & source lineage", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Authorization", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Simulate submission" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Authorization Review", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Internal Authorization Review",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Approve internal next step",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.screenshot({path:`artifacts/issue-2/${screenshotRun}/fixture-preview-authorization.png`,fullPage:true});
  await page.getByRole("button", { name: "Operations", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Encounter status mix" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Audit trail", exact: true }).click();
  await expect(page.locator(".audit-item").first()).toBeVisible();
  await page.screenshot({
    path: `artifacts/issue-2/${screenshotRun}/fixture-preview-audit.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Policy management", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Policy Management Center",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Request policy change", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Publish approved version", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: `artifacts/issue-2/${screenshotRun}/fixture-preview-policy.png`,
    fullPage: true,
  });
  await expect(page.locator("body")).not.toContainText(/clarity/i);
  expect(
    requests.every((url) => new URL(url).origin === "http://localhost:4173"),
  ).toBe(true);
  expect(requests.some((url) => url.includes("/api/"))).toBe(false);
});
