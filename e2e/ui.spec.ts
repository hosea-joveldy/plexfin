import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const NAV_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Search", path: "/search" },
  { label: "Ratings", path: "/ratings" },
  { label: "Settings", path: "/settings" },
];

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Keep the pointer away from the sidebar so it doesn't start hover-expanded
  // (default mouse position (0,0) is inside the fixed full-height rail).
  await page.mouse.move(400, 300);
  await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible();
});

// 1. Sidebar logo uses the SVG icon
test("sidebar logo renders PlexFin SVG icon", async ({ page }) => {
  const logoLink = page.locator('nav a[aria-label="PlexFin home"]');
  await expect(logoLink).toBeVisible();
  const svg = logoLink.locator("svg");
  await expect(svg).toHaveCount(1);
  // Verify it's the PlexFin brand mark (play triangle shapes), not a generic lucide icon
  const viewBox = await svg.getAttribute("viewBox");
  expect(viewBox).toBe("0 0 160 160");
  const polygons = await svg.locator("polygon").count();
  expect(polygons).toBeGreaterThanOrEqual(2); // amber play triangle + accent
  const rect = await svg.locator("rect").count();
  expect(rect).toBe(1);
});

// 2. Sidebar expands to 240px on hover
test("sidebar expands to 240px on hover", async ({ page }) => {
  const nav = page.locator('nav[aria-label="Primary"]');
  const before = await nav.boundingBox();
  expect(before?.width).toBeCloseTo(80, 0);
  await nav.hover();
  await page.waitForTimeout(500); // allow any transition
  const after = await nav.boundingBox();
  expect(after?.width).toBeCloseTo(240, 0);
});

// 3. Nav items show text labels on hover
test("nav items show text labels on hover", async ({ page }) => {
  await page.locator('nav[aria-label="Primary"]').hover();
  await page.waitForTimeout(300); // allow expansion
  for (const item of NAV_ITEMS) {
    const label = page
      .locator(`nav [aria-label="${item.label}"] span[aria-hidden="true"]`)
      .filter({ hasText: item.label });
    await expect(label).toBeVisible();
  }
});

// 4. Main content shifts right when the sidebar expands
test("main content shifts right on sidebar hover", async ({ page }) => {
  const main = page.locator("#main-content");
  const before = await main.boundingBox();
  await page.locator('nav[aria-label="Primary"]').hover();
  await page.waitForTimeout(500);
  const after = await main.boundingBox();
  expect(after!.x).toBeGreaterThan(before!.x);
  expect(after!.x).toBeCloseTo(240, 0);
});

// 5. Routes navigable
for (const item of NAV_ITEMS) {
  test(`route ${item.path} is navigable via sidebar`, async ({ page }) => {
    if (item.label === "Search") {
      // Search nav goes through flyout; test direct URL nav here
      await page.goto("/search");
    } else {
      await page.locator(`nav a[aria-label="${item.label}"]`).click();
    }
    await expect(page).toHaveURL(new RegExp(item.path === "/" ? "\\/$" : item.path));
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.locator("#main-content div").first()).toBeVisible();
  });
}

test("home page renders hero and content rows", async ({ page }) => {
  await expect(page.locator("#main-content")).toContainText(/./);
  const hero = page.locator("#main-content section, #main-content [class*=hero]", { hasText: /./ }).first();
  await expect(hero).toBeVisible();
});

// 6. Search flyout opens/closes
test("search flyout opens via search icon and closes on Escape", async ({ page }) => {
  const trigger = page.locator('nav button[aria-label="Search"]');
  await trigger.click();
  const dialog = page.locator('[role="dialog"][aria-label="Search PlexFin"]');
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  // input focused
  await expect(dialog.locator("input")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("search flyout closes on outside click", async ({ page }) => {
  const trigger = page.locator('nav button[aria-label="Search"]');
  await trigger.click();
  const dialog = page.locator('[role="dialog"][aria-label="Search PlexFin"]');
  await expect(dialog).toBeVisible();
  await page.mouse.click(800, 500);
  await expect(dialog).toHaveCount(0);
});

test("search flyout submits and navigates to search results", async ({ page }) => {
  const trigger = page.locator('nav button[aria-label="Search"]');
  await trigger.click();
  const dialog = page.locator('[role="dialog"][aria-label="Search PlexFin"]');
  await dialog.locator("input").fill("midnight");
  await dialog.locator("input").press("Enter");
  await expect(page).toHaveURL(/\/search\?q=midnight/);
  await expect(dialog).toHaveCount(0);
});

test("recent searches are shown in flyout", async ({ page }) => {
  await page.locator('nav button[aria-label="Search"]').click();
  const dialog = page.locator('[role="dialog"][aria-label="Search PlexFin"]');
  await expect(dialog).toContainText("The Last Horizon");
});

// 7. Responsive breakpoints
async function assertNoHorizontalOverflow(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow, `horizontal overflow at ${width}px`).toBe(false);
}



test("no horizontal overflow at 1024px", async ({ page }) => {
  await assertNoHorizontalOverflow(page, 1024);
});

test("no horizontal overflow at 768px", async ({ page }) => {
  await assertNoHorizontalOverflow(page, 768);
});

test("all routes usable at 1024px", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  for (const path of ["/", "/search", "/ratings", "/settings"]) {
    await page.goto(path);
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.locator("#main-content")).not.toBeEmpty();
  }
});

test("all routes usable at 768px", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  for (const path of ["/", "/search", "/ratings", "/settings"]) {
    await page.goto(path);
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.locator("#main-content")).not.toBeEmpty();
  }
});

// 8. Focus styles and keyboard navigation
test("focus-visible ring appears on keyboard focus", async ({ page }) => {
  await page.keyboard.press("Tab"); // skip link
  await page.keyboard.press("Tab"); // logo
  await page.keyboard.press("Tab"); // Home
  const homeLink = page.locator('nav a[aria-label="Home"]');
  await expect(homeLink).toBeFocused();
  const boxShadow = await homeLink.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(boxShadow).not.toBe("none");
});

test("keyboard: Enter activates nav link, Escape closes flyout", async ({ page }) => {
  await page.locator('nav a[aria-label="Ratings"]').focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/ratings/);
  // flyout via keyboard
  const trigger = page.locator('nav button[aria-label="Search"]');
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.locator('[role="dialog"][aria-label="Search PlexFin"]');
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("nav label is visible on keyboard focus", async ({ page }) => {
  await page.locator('nav a[aria-label="Settings"]').focus();
  const label = page
    .locator('nav a[aria-label="Settings"] span[aria-hidden="true"]')
    .filter({ hasText: "Settings" });
  await expect(label).toBeVisible();
});

// Console errors
test("no console errors across routes", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  for (const path of ["/", "/search", "/ratings", "/settings"]) {
    await page.goto(path);
    await page.waitForTimeout(200);
  }
  expect(errors).toEqual([]);
});
