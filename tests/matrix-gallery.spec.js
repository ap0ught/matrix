/**
 * Gallery mode smoke tests: the playlist must actually change what is rendered.
 *
 * Gallery items used to be dead ends — `restartMatrixWithNewConfig()` looked for an
 * `updateConfig()` export that no renderer had, so the counter and URL advanced while the
 * shader stayed frozen. These tests assert the renderer is rebuilt and that the frame that comes
 * out of it changes with the item's palette.
 *
 * The frame is read with `readPixels` on the canvas' own GL context: a page screenshot of a
 * WebGL canvas can come back mid-grey while it animates, which tells us nothing about the rain.
 * `tests/matrix-smoke.spec.js` still covers "the gallery UI boots".
 */
import { expect, test } from "@playwright/test";
import { attachMatrixRenderingWatchers } from "./matrix-playwright-helpers.js";

const QUERY = "effect=gallery&suppressWarnings=true&skipIntro=true" + "&fortuneDuration=400&shaderDisplayDuration=5000&screenshotCaptureDuration=500";

/**
 * Deterministic `Math.random` so `generateNewPlaylist()`'s shuffle keeps `galleryItems` order.
 * The 5th entry is then "Nightmare Matrix" (red palette) and the 1st is "Classic Matrix"
 * (green), which gives the auto-advance test two visually opposite endpoints to compare.
 */
const deterministicPlaylist = () => {
	let counter = 0;
	Math.random = () => (counter += 1) / 1e9;
};

/** Installs a GL probe that samples the canvas framebuffer after each draw and counts programs. */
const installFrameProbe = () => {
	for (const name of ["WebGLRenderingContext", "WebGL2RenderingContext"]) {
		const proto = window[name]?.prototype;
		if (!proto) continue;
		const origDraw = proto.drawArrays;
		const origProgram = proto.createProgram;
		proto.createProgram = function (...args) {
			window.__matrixPrograms++;
			return origProgram.apply(this, args);
		};
		proto.drawArrays = function (...args) {
			const result = origDraw.apply(this, args);
			try {
				if (window.__matrixGrab && this.getParameter(this.FRAMEBUFFER_BINDING) === null) {
					const w = this.drawingBufferWidth;
					const h = this.drawingBufferHeight;
					const px = new Uint8Array(w * h * 4);
					this.readPixels(0, 0, w, h, this.RGBA, this.UNSIGNED_BYTE, px);
					let r = 0;
					let g = 0;
					let b = 0;
					let lit = 0;
					for (let i = 0; i < px.length; i += 4) {
						if (px[i] + px[i + 1] + px[i + 2] > 60) {
							r += px[i];
							g += px[i + 1];
							b += px[i + 2];
							lit++;
						}
					}
					window.__matrixSignature = lit ? { r: r / lit, g: g / lit, b: b / lit, lit } : { r: 0, g: 0, b: 0, lit: 0 };
				}
			} catch (error) {
				/* readPixels can fail while the context is being torn down */
			}
			return result;
		};
	}
};

async function openGallery(page) {
	await page.addInitScript(deterministicPlaylist);
	await page.addInitScript(() => {
		window.__matrixPrograms = 0;
		window.__matrixSignature = null;
		window.__matrixGrab = true;
	});
	await page.addInitScript(installFrameProbe);
	await page.goto(`/?${QUERY}`, { waitUntil: "networkidle" });
	await expect(page.locator("#gallery-info")).toBeVisible({ timeout: 30_000 });
}

const galleryState = (page) =>
	page.evaluate(() => ({
		title: document.getElementById("gallery-title")?.textContent ?? null,
		counter: document.getElementById("gallery-counter")?.textContent ?? null,
		programs: window.__matrixPrograms,
		signature: window.__matrixSignature,
	}));

/** Red vs green: which palette dominates the lit pixels. */
const channelBias = ({ signature }) => (signature?.g ?? 0) - (signature?.r ?? 0);

// Polling, not sampling once: rebuilding a pipeline compiles shaders and reloads the MSDF
// atlases, so the first frame of the next item lands a moment after the switch is announced.
const FRAME_TIMEOUT = { timeout: 20_000, intervals: [500] };
/** Four 5s advances plus fortunes, to reach the 5th playlist entry. */
const ADVANCE_TIMEOUT = { timeout: 45_000, intervals: [500] };

const pickItem = async (page, title) => {
	await page.locator("#playlist-toggle").click();
	await page.locator(".playlist-item", { hasText: title }).first().click();
	await page.locator("#playlist-close").click();
};

test.describe("Gallery mode", () => {
	test("picking a playlist item re-renders that item", async ({ page }) => {
		const watchers = attachMatrixRenderingWatchers(page);
		await openGallery(page);
		await expect(page.locator("#gallery-title")).toHaveText("Classic Matrix");
		await expect.poll(async () => channelBias(await galleryState(page)), FRAME_TIMEOUT).toBeGreaterThan(20);
		const before = await galleryState(page);

		await pickItem(page, "Nightmare Matrix");
		await expect.poll(async () => (await galleryState(page)).title, FRAME_TIMEOUT).toBe("Nightmare Matrix");
		await expect.poll(async () => channelBias(await galleryState(page)), FRAME_TIMEOUT).toBeLessThan(-20);
		const after = await galleryState(page);

		// The renderer was rebuilt, and the classic green palette gave way to the nightmare red one.
		expect(after.programs, "GL programs should be rebuilt on an item pick").toBeGreaterThan(before.programs);
		watchers.assertNoIssues("gallery selection");
	});

	test("advances and re-renders on its own", async ({ page }) => {
		const watchers = attachMatrixRenderingWatchers(page);
		await openGallery(page);
		await expect(page.locator("#gallery-title")).toHaveText("Classic Matrix");
		await expect.poll(async () => channelBias(await galleryState(page)), FRAME_TIMEOUT).toBeGreaterThan(20);
		const first = await galleryState(page);

		// With a deterministic playlist the 5th entry is the red Nightmare Matrix. Nothing clicks
		// here: the gallery's own timer has to get there, and re-render on the way.
		await expect.poll(async () => (await galleryState(page)).counter, ADVANCE_TIMEOUT).toMatch(/^5 \/ /);
		await expect.poll(async () => channelBias(await galleryState(page)), FRAME_TIMEOUT).toBeLessThan(-20);
		const later = await galleryState(page);

		expect(later.programs, "GL programs should be rebuilt on every auto-advance").toBeGreaterThan(first.programs);
		watchers.assertNoIssues("gallery auto-advance");
	});
});
