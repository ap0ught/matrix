/**
 * Smoke tests: app boots without JS errors for each post-processing effect and both renderers.
 * Gallery mode is exercised separately. WebGPU cases skip when the browser has no WebGPU.
 *
 * WebGL shader/link failures are surfaced via installWebGLShaderDebugHooks in js/webgl/main.js
 * and caught by tests/matrix-playwright-helpers.js (console + pageerror).
 */
import { expect, test } from "@playwright/test";
import { assertMatrixBootsClean, attachMatrixRenderingWatchers, settleAfterPaint } from "./matrix-playwright-helpers.js";

const baseQuery = "suppressWarnings=true&skipIntro=true&version=classic";

/** Effects from getAvailableEffects() except gallery and image (image needs a reachable bg; tested separately). */
const EFFECTS = ["none", "plain", "palette", "customStripes", "stripes", "rainbow", "spectrum", "mirror"];

const VERSION_SAMPLES = ["classic", "mathcode", "resurrections"];

test.describe("Matrix WebGL effects smoke", () => {
	for (const effect of EFFECTS) {
		test(`effect=${effect} (webgl)`, async ({ page }) => {
			await assertMatrixBootsClean(page, `${baseQuery}&renderer=webgl&effect=${effect}`);
		});
	}

	for (const version of VERSION_SAMPLES) {
		test(`version=${version} (webgl)`, async ({ page }) => {
			await assertMatrixBootsClean(page, `suppressWarnings=true&skipIntro=true&renderer=webgl&version=${version}`);
		});
	}

	test("effect=image (webgl) with local bgURL", async ({ page }) => {
		const url = `${baseQuery}&renderer=webgl&effect=image&url=${encodeURIComponent("assets/sand.png")}`;
		await assertMatrixBootsClean(page, url);
	});
});

/**
 * Mirrors the supportsWebGPU() predicate in js/main.js so tests skip precisely
 * when the app itself would fall back to WebGL (not just when navigator.gpu is absent).
 */
const browserSupportsWebGPU = () => window.GPUQueue != null && navigator.gpu != null && navigator.gpu.getPreferredCanvasFormat != null;

test.describe("Matrix WebGPU smoke", () => {
	test("effect=palette when WebGPU available", async ({ page }) => {
		const hasGpu = await page.evaluate(browserSupportsWebGPU);
		test.skip(!hasGpu, "WebGPU not available in this browser");
		await assertMatrixBootsClean(page, `${baseQuery}&renderer=webgpu&effect=palette`);
	});

	test("effect=mirror when WebGPU available", async ({ page }) => {
		const hasGpu = await page.evaluate(browserSupportsWebGPU);
		test.skip(!hasGpu, "WebGPU not available in this browser");
		await assertMatrixBootsClean(page, `${baseQuery}&renderer=webgpu&effect=mirror`);
	});
});

test.describe("Gallery mode", () => {
	test("loads gallery UI without JS errors", async ({ page }) => {
		const watchers = attachMatrixRenderingWatchers(page);
		await page.goto("/?effect=gallery&suppressWarnings=true", {
			waitUntil: "networkidle",
		});
		await expect(page.locator("#gallery-info")).toBeVisible({
			timeout: 30_000,
		});
		await settleAfterPaint(page);
		watchers.assertNoIssues("gallery initial load");
	});
});
