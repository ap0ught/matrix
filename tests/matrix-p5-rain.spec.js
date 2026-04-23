/**
 * Smoke test: p5.js experimental mathcode mode.
 */
import { expect, test } from "@playwright/test";
import { assertMatrixBootsClean, rainSurfaceCanvas } from "./matrix-playwright-helpers.js";

test.describe("Matrix p5.js mathcode mode", () => {
	test("loads p5-rain preset and exposes a visible 2D canvas", async ({ page }) => {
		const query = new URLSearchParams({
			version: "mathcode_p5",
			suppressWarnings: "true",
			skipIntro: "true",
		}).toString();

		await assertMatrixBootsClean(page, query);

		const ctx2d = await rainSurfaceCanvas(page).evaluate((el) => !!el.getContext("2d"));
		expect(ctx2d, "p5 2D mode should expose CanvasRenderingContext2D on the visible surface").toBe(true);

		await expect(page.locator("select.version-select")).toHaveValue("mathcode_p5", { timeout: 15_000 });
	});
});
