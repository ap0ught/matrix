/**
 * Regression: experimental renderer entry points (three-rain, p5-rain).
 *
 * These presets are excluded from `matrix-full.spec.js` (which forces `renderer=webgl` for every
 * version × effect). Run with: `npm run test:regression`
 */
import { expect, test } from "@playwright/test";
import { assertMatrixBootsClean, rainSurfaceCanvas, settleAfterPaint } from "../matrix-playwright-helpers.js";

const base = {
	suppressWarnings: "true",
	skipIntro: "true",
};

test.describe("Regression: experimental renderers (three.js, p5.js)", () => {
	test.describe.configure({ timeout: 120_000 });

	test("three-rain preset mathcode_alphabet_three (renderer from version)", async ({ page }) => {
		const q = new URLSearchParams({
			...base,
			version: "mathcode_alphabet_three",
		}).toString();
		await assertMatrixBootsClean(page, q);
		const canvas = rainSurfaceCanvas(page);
		const { webgl } = await canvas.evaluate((el) => ({
			webgl: !!(el.getContext("webgl2") || el.getContext("webgl")),
		}));
		expect(webgl, "Three.js rain uses a WebGL-backed canvas").toBe(true);
		await expect(page.locator("select.version-select")).toHaveValue("mathcode_alphabet_three", {
			timeout: 15_000,
		});
	});

	test("three-rain explicit renderer=three&version=mathcode", async ({ page }) => {
		const q = new URLSearchParams({
			...base,
			renderer: "three",
			version: "mathcode",
		}).toString();
		await assertMatrixBootsClean(page, q);
		await settleAfterPaint(page);
		const webgl = await rainSurfaceCanvas(page).evaluate((el) => !!(el.getContext("webgl2") || el.getContext("webgl")));
		expect(webgl).toBe(true);
	});

	test("p5-rain preset mathcode_p5", async ({ page }) => {
		const q = new URLSearchParams({
			...base,
			version: "mathcode_p5",
		}).toString();
		await assertMatrixBootsClean(page, q);
		const ctx2d = await rainSurfaceCanvas(page).evaluate((el) => !!el.getContext("2d"));
		expect(ctx2d, "p5 2D renderer should expose Canvas 2D on the visible surface").toBe(true);
		await expect(page.locator("select.version-select")).toHaveValue("mathcode_p5", { timeout: 15_000 });
	});

	test("p5-rain explicit renderer=p5&version=mathcode", async ({ page }) => {
		const q = new URLSearchParams({
			...base,
			renderer: "p5",
			version: "mathcode",
		}).toString();
		await assertMatrixBootsClean(page, q);
		const ctx2d = await rainSurfaceCanvas(page).evaluate((el) => !!el.getContext("2d"));
		expect(ctx2d).toBe(true);
	});
});
