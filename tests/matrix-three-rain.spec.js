/**
 * Smoke test: Three.js experimental rain (mathcode + alphabet columns).
 */
import { expect, test } from "@playwright/test";
import { attachMatrixRenderingWatchers, settleAfterPaint } from "./matrix-playwright-helpers.js";

test.describe("Matrix Three.js mathcode+alphabet mode", () => {
	test("loads three-rain stack and keeps canvas sized", async ({ page }) => {
		const watchers = attachMatrixRenderingWatchers(page);

		await page.goto("/?version=mathcode_alphabet_three&suppressWarnings=true&skipIntro=true", {
			waitUntil: "networkidle",
		});

		const canvas = page.locator("canvas").first();
		await expect(canvas).toBeVisible({ timeout: 30_000 });
		await settleAfterPaint(page);

		const { width, height, webgl } = await canvas.evaluate((el) => {
			const w = el.width;
			const h = el.height;
			const gl = el.getContext("webgl2") || el.getContext("webgl");
			return { width: w, height: h, webgl: !!gl };
		});

		watchers.assertNoIssues("mathcode_alphabet_three three.js");
		expect(width, "canvas should have width").toBeGreaterThan(0);
		expect(height, "canvas should have height").toBeGreaterThan(0);
		expect(webgl, "Three.js uses WebGL backing").toBe(true);

		await expect(page.locator("select.version-select")).toHaveValue("mathcode_alphabet_three", {
			timeout: 15_000,
		});
	});
});
