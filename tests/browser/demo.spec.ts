import { demonstrationPassword } from "./local-account";
import { test, expect, type Page } from "@playwright/test";
async function shot(page: Page, path: string, fullPage = true) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path, fullPage });
}
async function signIn(page: Page, role = "reviewer") {
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
async function open(page: Page, name: string, tab = "Review queue") {
  await page
    .getByRole("button", { name: tab, exact: tab !== "Review queue" })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Open " + name, exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: new RegExp(name) }),
  ).toBeVisible();
}
test("all eight synthetic utilization review scenarios work end to end", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await signIn(page);
  await test.step("1. Synthetic intake and persisted FHIR evidence", async () => {
    await page
      .getByRole("button", { name: "Synthetic intake", exact: true })
      .click();
    await page.getByLabel("Demonstration scenario").selectOption("respiratory");
    await page
      .getByRole("button", { name: "Ingest synthetic encounter" })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "already in the queue",
    );
    await page
      .getByRole("button", { name: "Clinical evidence", exact: true })
      .click();
    await expect(
      page.getByText("Oxygen saturation", { exact: true }),
    ).toBeVisible();
    await shot(page, "artifacts/01-fhir-evidence.png", true);
  });
  await test.step("2. Local AI-driven prioritization and 3. inpatient versus observation recommendation", async () => {
    await page.getByRole("button", { name: "Overview", exact: true }).click();
    await page
      .getByRole("button", { name: "Run initial review", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Initial review completed",
    );
    await expect(
      page.getByText("Local AI triage", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Inpatient review suggested",
        exact: true,
      }),
    ).toBeVisible();
    await shot(page, "artifacts/02-ai-review.png", true);
    await open(page, "Noah Fictional");
    await expect(
      page.getByRole("heading", {
        name: "Observation review suggested",
        exact: true,
      }),
    ).toBeVisible();
  });
  await test.step("4. Continued-stay review responds to synthetic clinical changes", async () => {
    await open(page, "Avery Fictional");
    await page.getByLabel("Oxygen %").fill("86");
    await page.getByLabel("Systolic mmHg").fill("84");
    await page.getByLabel("Expected nights").fill("3");
    await page
      .getByRole("button", { name: "Save synthetic observations" })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "observations updated",
    );
    await page
      .getByRole("button", { name: "Continued-stay review", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Continued-stay review completed",
    );
    await expect(
      page
        .locator(".assessment")
        .getByText("Continued-stay review suggested", { exact: true }),
    ).toBeVisible();
    await shot(page, "artifacts/03-continued-stay.png", true);
  });
  await test.step("5. Authorization, payer responses and notification tracking", async () => {
    await open(page, "Isla Fictional", "Authorizations");
    const expire = page.getByRole("button", {
      name: "Simulate expiration",
      exact: true,
    });
    if (await expire.isEnabled()) {
      await expire.click();
      await expect(page.getByRole("status")).toContainText(
        "Simulated event recorded",
      );
    }
    await page
      .getByRole("button", { name: "Simulate submission", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Simulated event recorded",
    );
    await page
      .getByLabel("Simulated payer response")
      .selectOption("pending-information");
    await page
      .getByRole("button", { name: "Record simulated response" })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Simulated event recorded",
    );
    await page
      .getByRole("button", { name: "Simulate submission", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Simulated event recorded",
    );
    await page.getByLabel("Simulated payer response").selectOption("approved");
    await page
      .getByRole("button", { name: "Record simulated response" })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Simulated event recorded",
    );
    await page
      .getByRole("button", { name: "Log simulated notification" })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Simulated event recorded",
    );
    await expect(
      page.getByText("Authorization event history", { exact: true }),
    ).toBeVisible();
    await shot(page, "artifacts/04-authorization.png", true);
  });
  await test.step("6. Potential denial-risk identification is explained and labeled illustrative", async () => {
    await open(page, "Leo Fictional");
    await expect(page.locator(".risk-line")).toContainText(
      "Elevated illustrative risk",
    );
    await expect(page.locator(".assessment")).toContainText(
      "physician document is missing",
    );
    await shot(page, "artifacts/05-denial-risk.png", true);
  });
  await test.step("7. Physician advisor escalation and role-restricted human override", async () => {
    await open(page, "Rowan Fictional");
    await page
      .getByRole("button", { name: "Advisor review", exact: true })
      .click();
    if (
      await page
        .getByRole("button", { name: "Escalate to physician advisor" })
        .isEnabled()
    ) {
      await page
        .getByRole("button", { name: "Escalate to physician advisor" })
        .click();
      await expect(page.getByRole("status")).toContainText("escalated");
    }
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await signIn(page, "advisor");
    await open(page, "Rowan Fictional", "Physician advisor");
    await page.getByLabel("Advisor disposition").selectOption("Observation");
    await page
      .getByLabel("Decision reason")
      .selectOption("clinical-judgment-override");
    await page.getByRole("button", { name: "Record human decision" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Human review decision recorded",
    );
    await expect(page.locator(".decision-card")).toContainText("Observation");
    await shot(page, "artifacts/06-physician-advisor.png", true);
  });
  await test.step("8. Dashboards, explanations and audit trails", async () => {
    await page.getByRole("button", { name: "Operations", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Encounter status mix" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Human review outcomes" }),
    ).toBeVisible();
    await shot(page, "artifacts/07-operations.png", true);
    await page
      .getByRole("button", { name: "Audit trail", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Cross-workflow audit trail" }),
    ).toBeVisible();
    await expect(page.locator(".audit-item").first()).toBeVisible();
    await shot(page, "artifacts/08-audit.png", false);
    await page
      .getByRole("button", { name: /^Review queue/ })
      .first()
      .click();
    await shot(page, "artifacts/00-review-queue.png", true);
    await page.setViewportSize({ width: 1280, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
  expect(errors).toEqual([]);
});
test("invalidated session returns to sign-in instead of leaving unusable controls", async ({
  page,
  context,
}) => {
  await signIn(page);
  await expect(
    page.getByRole("button", { name: "Open Maya Fictional", exact: true }),
  ).toBeVisible();
  await shot(page, "artifacts/00-review-queue.png", true);
  await context.addCookies([
    {
      name: "ur_session",
      value: "invalidated-demo-token",
      url: "http://localhost:3000",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Hospital utilization review" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Sign in");
});
test("Grafana renders live aggregate reporting", async ({ page }) => {
  const login = await page.request.post("http://localhost:3001/login", {
    data: { user: "demo-admin", password: "synthetic-grafana-local-only" },
  });
  expect(login.ok()).toBe(true);
  await page.goto("http://localhost:3001/d/ur-synthetic-operations");
  await expect(
    page
      .getByText("Clarity UR · Synthetic Operations", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByText("Active fictional encounters", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("No data", { exact: true })).toHaveCount(0);
  await expect(page.getByText("6", { exact: true }).first()).toBeVisible();
  await shot(page, "artifacts/10-grafana.png", false);
});
