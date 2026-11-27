import { test as browserTest, expect } from "@playwright/test";
import missions from "../content/missions.json" with { type: "json" };

const test = browserTest.extend({
  page: async ({ page, baseURL }, use) => {
    const base = new URL(baseURL);
    const failures = [];
    const context = page.context();
    context.on("request", (request) => {
      const url = new URL(request.url());
      if (
        ["http:", "https:"].includes(url.protocol) &&
        (url.origin !== base.origin || !url.pathname.startsWith(base.pathname))
      ) {
        failures.push(`Request outside the deployed site: ${url.href}`);
      }
    });
    context.on("requestfailed", (request) => {
      const error = request.failure()?.errorText;
      if (error !== "net::ERR_ABORTED") failures.push(`${error}: ${request.url()}`);
    });
    context.on("response", (response) => {
      if (response.status() >= 400) failures.push(`${response.status()}: ${response.url()}`);
    });
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") failures.push(message.text());
    });
    await use(page);
    expect(failures).toEqual([]);
  },
});

test("entire flight log survives export, reset, import and reload", async ({
  page,
}, info) => {
  const button = (name) => page.getByRole("button", { name, exact: true });
  await page.addInitScript(() => {
    window.playedFrequencies = [];
    const start = AudioScheduledSourceNode.prototype.start;
    AudioScheduledSourceNode.prototype.start = function (...args) {
      const result = start.apply(this, args);
      if (this instanceof OscillatorNode) window.playedFrequencies.push(this.frequency.value);
      return result;
    };
  });
  await page.goto("./");
  await expect(page).toHaveTitle("Mission Mars · Project ARES");
  await expect(button("Continue")).toBeDisabled();
  await expect.poll(() =>
    page.locator("img.orbital").evaluate((image) => image.naturalWidth),
  ).toBeGreaterThan(0);
  const fontFaces = await page.evaluate(async () => {
    const fonts = ['16px "Press Start 2P"', '16px "Barlow"', '16px "IBM Plex Mono"'];
    return Promise.all(fonts.map(async (font) => (await document.fonts.load(font)).length));
  });
  expect(fontFaces).toEqual([1, 1, 1]);
  await page.screenshot({ path: info.outputPath("desktop-menu.png") });
  await button("New Game").click();
  await button("Continue briefing").click();
  expect(await page.evaluate(() => window.playedFrequencies)).toEqual(
    expect.arrayContaining([622, 466]),
  );
  await button("Open crew roster").click();
  await button("Alex Chen").click();
  await button("role").click();
  await button("Next mission").click();
  for (const m of missions.slice(1)) {
    await expect(
      page.getByRole("heading", { name: m.title, exact: true }),
    ).toBeVisible();
    const editor = page.getByRole("textbox", { name: "SQL query" });
    if (m.id === 2) {
      await button("Inspect table").click();
      await expect(
        page.getByRole("heading", { name: "Database Explorer" }),
      ).toBeVisible();
      await button("Close dialog").click();
      for (let n = 1; n <= 3; n++)
        await button("Reveal hint " + n + " of 3").click();
      await button("Reset Query").click();
      await expect(button("Reveal hint 1 of 3")).toBeVisible();
      await editor.fill("SELEC * FROM astronauts");
      await button("Run Query").click();
      await expect(page.locator("#result")).toContainText("CHECK YOUR SQL");
      await button("Clear").click();
    }
    await editor.fill(m.solution);
    await editor.press("Control+Enter");
    await button(m.id === 10 ? "View flight crew" : "Next mission").click();
  }
  await expect(
    page.getByRole("heading", { name: "Your crew is ready." }),
  ).toBeVisible();
  await expect(page.locator(".sprites img")).toHaveCount(4);
  await expect.poll(() => page.locator(".sprites img").evaluateAll(
    (sprites) => sprites.every((image) => image.naturalWidth > 0),
  )).toBe(true);
  await page.getByLabel("Flight pilot").selectOption("wilson");
  await expect(page.locator(".crewgrid")).toContainText("James Wilson");
  await button("Toggle sound").click();
  await expect(button("Toggle sound")).toContainText("SFX OFF");
  const playedBeforeSettings = await page.evaluate(() => window.playedFrequencies.length);
  await button("Settings").click();
  expect(await page.evaluate(() => window.playedFrequencies.length)).toBe(playedBeforeSettings);
  const downloaded = page.waitForEvent("download");
  await button("Export Save").click();
  const savefile = info.outputPath("flight.json");
  await (await downloaded).saveAs(savefile);
  await button("Reset Progress").click();
  await button("Reset Progress").click();
  await expect(button("Continue")).toBeDisabled();
  await button("Settings").click();
  await page.locator("input[type=file]").setInputFiles(savefile);
  await button("Import Save").click();
  await expect(button("Continue")).toBeEnabled();
  await page.reload();
  await button("Continue").click();
  await expect(page.locator(".crewgrid")).toContainText("James Wilson");
  await expect(button("Toggle sound")).toContainText("SFX OFF");
  await button("Settings").click();
  await page.locator("input[type=file]").setInputFiles({
    name: "incompatible.json", mimeType: "application/json", buffer: Buffer.from('{"version":99}')
  });
  await button("Import Save").click();
  await expect(page.getByRole("dialog")).toContainText("not a supported Mission Mars save");
  await button("Close dialog").click();
  await button("Replay missions").click();
  await page
    .getByRole("button", { name: /02 Access the Database REPLAY/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Access the Database" }),
  ).toBeVisible();
  await page.reload();
  await button("Continue").click();
  await expect(page.getByRole("heading",{name:"Access the Database"})).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByLabel("SQL query")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:info.outputPath("mobile-console.png"), fullPage:true});
});
test("phone and tablet layouts retain reachable controls", async ({ page }) => {
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./");
    await expect(
      page.getByRole("button", { name: "New Game", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page
      .getByRole("button", { name: /SQL Guide/i })
      .click();
    await page.getByRole("searchbox").fill("distinct");
    await expect(page.getByText("W3Schools reference ↗")).toBeVisible();
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page.screenshot({path:test.info().outputPath("menu-"+width+".png")});
  }
});

test("static prototype starts both runtimes and restores its IndexedDB state", async ({ page }) => {
  await page.goto("prototype.html");
  const status = page.locator("#status");
  await expect(status).toHaveText("PASS • first commit saved.", { timeout: 30000 });
  await expect(page.getByRole("row", { name: "Alex 8" })).toBeVisible();
  await expect(page.getByRole("row", { name: "Maya 9" })).toBeVisible();
  await expect(page.locator("#report")).toContainText(/Python version\s*3\.\d+\.\d+/);
  await expect(page.locator("#report")).toContainText("42601");
  await page.getByRole("button", { name: "Reload and check restoration" }).click();
  await expect(status).toHaveText("PASS • persisted database and progress restored.", { timeout: 30000 });
});
