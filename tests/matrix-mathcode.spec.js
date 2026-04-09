/**
 * Browser smoke tests: app boots in mathcode mode with WebGL (regl) and no JS errors.
 *
 * Shader regression coverage lives in rain-pass-state-sampling.test.mjs (text invariants).
 * We do not assert pixel colors here: the default canvas is not created with
 * preserveDrawingBuffer, so readPixels on the default framebuffer is unreliable
 * after the compositor runs.
 */
import { expect, test } from "@playwright/test";

test.describe("Matrix mathcode mode", () => {
	test("loads WebGL regl, applies mathcode version, and keeps canvas sized", async ({ page }) => {
		const pageErrors = [];
		page.on("pageerror", (err) => pageErrors.push(String(err)));

		await page.goto("/?version=mathcode&suppressWarnings=true&skipIntro=true&renderer=regl", {
			waitUntil: "networkidle",
		});

		const canvas = page.locator("canvas").first();
		await expect(canvas).toBeVisible({ timeout: 30_000 });

		const { width, height, webgl } = await canvas.evaluate((el) => {
			const w = el.width;
			const h = el.height;
			const gl = el.getContext("webgl2") || el.getContext("webgl");
			return { width: w, height: h, webgl: !!gl };
		});

		expect(pageErrors, `page errors: ${pageErrors.join("; ")}`).toHaveLength(0);
		expect(width, "canvas should have width").toBeGreaterThan(0);
		expect(height, "canvas should have height").toBeGreaterThan(0);
		expect(webgl, "WebGL context should exist (regl renderer)").toBe(true);

		await expect(page.locator("select.version-select")).toHaveValue("mathcode", { timeout: 15_000 });
	});
});
