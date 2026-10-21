import { demonstrationPassword } from "./local-account";
import { test, expect } from "@playwright/test";
for (const width of [1440, 1920]) {
  test(`desktop acceptance and real screenshots at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto("/");
    await page.getByLabel("Demonstration role").selectOption("admin");
    await page
      .getByLabel("Password", { exact: true })
      .fill(demonstrationPassword());
    await page.getByRole("button", { name: "Sign in to workspace" }).click();
    await expect(
      page.getByRole("button", { name: "Open Maya Fictional" }),
    ).toBeVisible();
    const capture = async (name: string) => {
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const small = await page
        .locator("main button, main td, main input, main select, main small")
        .evaluateAll((nodes) =>
          nodes
            .filter((n) => Number.parseFloat(getComputedStyle(n).fontSize) < 12)
            .map((n) => n.textContent?.slice(0, 70)),
        );
      expect(small).toEqual([]);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: `artifacts/issue-2/${process.env.SCREENSHOT_RUN||"workstation"}/${width}/${name}.png`,
        fullPage: name !== "audit",
      });
    };
    expect(await page.locator('.table-scroll').evaluate(n=>n.scrollWidth<=n.clientWidth)).toBe(true);
    await page.getByRole('button',{name:'Synthetic intake',exact:true}).click();
    await expect(page.getByRole('dialog')).toBeFocused();
    await page.keyboard.press('Tab');await expect(page.getByLabel('Demonstration scenario')).toBeFocused();
    await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Synthetic intake',exact:true})).toBeFocused();
    await expect(page.locator("body")).not.toContainText(/clarity/i);
    await capture("queue");
    await page
      .getByRole("textbox", { name: "Search encounters" })
      .fill("no match");
    await expect(
      page.getByRole("heading", { name: "No matching encounters" }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Search encounters" }).fill("");
    await page.getByLabel("Filter by priority").selectOption("high");
    for (const row of await page.locator("tbody tr").all())
      await expect(row.locator(".priority")).toHaveClass(/high/);
    await page.getByLabel("Filter by priority").selectOption("all");
    expect(
      await page
        .locator("td")
        .first()
        .evaluate((n) => getComputedStyle(n).fontSize),
    ).toBe("14px");
    await page.getByRole("button", { name: "Open Maya Fictional" }).click();
    await expect(page.locator(".assessment details")).toHaveAttribute(
      "open",
      "",
    );
    await capture("ai-review");
    await page
      .getByRole("button", { name: "Clinical evidence", exact: true })
      .click();
    await capture("evidence");
    await page
      .getByRole("button", { name: "Authorization", exact: true })
      .click();
    await page.getByRole('button',{name:'Authorizations',exact:true}).click();
    await page.getByRole('button',{name:'Open Isla Fictional'}).click();
    await capture("authorization");
    await page
      .getByRole("button", { name: "Advisor review", exact: true })
      .click();
    await page.getByRole("button", { name: /^Review queue/ }).click();
    await page.getByRole("button", { name: "Open Rowan Fictional" }).click();
    await page
      .getByRole("button", { name: "Advisor review", exact: true })
      .click();
    await expect(page.getByLabel("Advisor disposition")).toBeVisible();
    await capture("advisor");
    await page.getByRole("button", { name: "Operations", exact: true }).click();
    await capture("operations");
    await page
      .getByRole("button", { name: "Audit trail", exact: true })
      .click();
    await capture("audit");
    const first=await page.locator('.audit-item').first().innerText();
    await page.getByRole('button',{name:'Next events',exact:true}).click();
    expect(await page.locator('.audit-item').first().innerText()).not.toBe(first);
    await page.getByRole('button',{name:'Previous events',exact:true}).click();
    expect(await page.locator('.audit-item').first().innerText()).toBe(first);
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.getByRole("button", { name: /^Review queue/ }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Sign out", exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Refresh", exact: true }),
    ).toBeFocused();
    expect(
      await page
        .getByRole("button", { name: "Refresh", exact: true })
        .evaluate((n) => getComputedStyle(n).outlineStyle),
    ).not.toBe("none");
  });
}
