/**
 * Smoke tests: app boots without JS errors for each post-processing effect and both renderers.
 * Gallery mode is exercised separately. WebGPU cases skip when the browser has no WebGPU.
 */
import { expect, test } from "@playwright/test";

const baseQuery = "suppressWarnings=true&skipIntro=true&version=classic";

/** Effects from getAvailableEffects() except gallery and image (image needs a reachable bg; tested separately). */
const EFFECTS = ["none", "plain", "palette", "customStripes", "stripes", "rainbow", "spectrum", "mirror"];

const VERSION_SAMPLES = ["classic", "mathcode", "resurrections"];

async function assertBootsClean(page, query) {
	const pageErrors = [];
	page.on("pageerror", (err) => pageErrors.push(String(err)));
	await page.goto(`/?${query}`, { waitUntil: "networkidle" });
	const canvas = page.locator("canvas").first();
	await expect(canvas).toBeVisible({ timeout: 30_000 });
	const { w, h } = await canvas.evaluate((el) => ({
		w: el.width,
		h: el.height,
	}));
	expect(pageErrors, `page errors for ${query}: ${pageErrors.join("; ")}`).toHaveLength(0);
	expect(w).toBeGreaterThan(0);
	expect(h).toBeGreaterThan(0);
}

test.describe("Matrix WebGL effects smoke", () => {
	for (const effect of EFFECTS) {
		test(`effect=${effect} (webgl)`, async ({ page }) => {
			await assertBootsClean(page, `${baseQuery}&renderer=webgl&effect=${effect}`);
		});
	}

	for (const version of VERSION_SAMPLES) {
		test(`version=${version} (webgl)`, async ({ page }) => {
			await assertBootsClean(page, `suppressWarnings=true&skipIntro=true&renderer=webgl&version=${version}`);
		});
	}

	test("effect=image (webgl) with local bgURL", async ({ page }) => {
		const url = `${baseQuery}&renderer=webgl&effect=image&url=${encodeURIComponent("assets/sand.png")}`;
		await assertBootsClean(page, url);
	});
});

test.describe("Matrix WebGPU smoke", () => {
	test("effect=palette when WebGPU available", async ({ page }) => {
		const hasGpu = await page.evaluate(() => !!navigator.gpu);
		test.skip(!hasGpu, "WebGPU not available in this browser");
		await assertBootsClean(page, `${baseQuery}&renderer=webgpu&effect=palette`);
	});

	test("effect=mirror when WebGPU available", async ({ page }) => {
		const hasGpu = await page.evaluate(() => !!navigator.gpu);
		test.skip(!hasGpu, "WebGPU not available in this browser");
		await assertBootsClean(page, `${baseQuery}&renderer=webgpu&effect=mirror`);
	});
});

test.describe("Gallery mode", () => {
	test("loads gallery UI without JS errors", async ({ page }) => {
		const pageErrors = [];
		page.on("pageerror", (err) => pageErrors.push(String(err)));
		await page.goto("/?effect=gallery&suppressWarnings=true", {
			waitUntil: "networkidle",
		});
		await expect(page.locator("#gallery-info")).toBeVisible({
			timeout: 30_000,
		});
		expect(pageErrors, `page errors: ${pageErrors.join("; ")}`).toHaveLength(0);
	});
});
