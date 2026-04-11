/**
 * Smoke test: p5.js experimental mathcode mode.
 */
import { expect, test } from "@playwright/test";
import { attachMatrixRenderingWatchers, settleAfterPaint } from "./matrix-playwright-helpers.js";

test.describe("Matrix p5.js mathcode mode", () => {
	test("loads p5-rain preset and exposes a canvas", async ({ page }) => {
		const watchers = attachMatrixRenderingWatchers(page);

		await page.goto("/?version=mathcode_p5&suppressWarnings=true&skipIntro=true", {
			waitUntil: "networkidle",
		});

		const canvases = page.locator("canvas");
		await expect(canvases.first()).toBeVisible({ timeout: 30_000 });
		await settleAfterPaint(page);

		const count = await canvases.count();
		expect(count, "p5 adds its own canvas while the Matrix canvas may stay hidden").toBeGreaterThanOrEqual(1);

		watchers.assertNoIssues("mathcode_p5 p5.js");

		await expect(page.locator("select.version-select")).toHaveValue("mathcode_p5", { timeout: 15_000 });
	});
});
