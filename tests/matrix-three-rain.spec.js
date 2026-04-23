/**
 * Smoke test: Three.js experimental rain (mathcode + alphabet columns).
 */
import { expect, test } from "@playwright/test";
import { assertMatrixBootsClean, rainSurfaceCanvas } from "./matrix-playwright-helpers.js";

test.describe("Matrix Three.js mathcode+alphabet mode", () => {
	test("loads three-rain stack and keeps canvas sized", async ({ page }) => {
		const query = new URLSearchParams({
			version: "mathcode_alphabet_three",
			suppressWarnings: "true",
			skipIntro: "true",
		}).toString();

		await assertMatrixBootsClean(page, query);

		const canvas = rainSurfaceCanvas(page);
		const { webgl } = await canvas.evaluate((el) => ({
			webgl: !!(el.getContext("webgl2") || el.getContext("webgl")),
		}));

		expect(webgl, "Three.js uses WebGL backing").toBe(true);

		await expect(page.locator("select.version-select")).toHaveValue("mathcode_alphabet_three", {
			timeout: 15_000,
		});
	});
});
