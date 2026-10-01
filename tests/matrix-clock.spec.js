/**
 * Date/time drop smoke tests (js/clock.js).
 *
 * The overlay is pinned to a fixed second of the minute so both phases are deterministic:
 *   - hold (seconds 0-9): the date and time sit stacked at the top, nothing painted below
 *   - fall: characters have peeled off and are dropping at the rain's speed. They fall *fast* —
 *     the slowest column clears a tall screen in a few seconds — so the fall has to be sampled
 *     early, not halfway down the minute.
 *
 * The phase maths and the rain-derived fall speed are unit tested in tests/clock-phase.test.mjs.
 */
import { expect, test } from "@playwright/test";
import { attachMatrixRenderingWatchers, rainSurfaceCanvas } from "./matrix-playwright-helpers.js";

import { CLOCK_HOLD_SECONDS } from "../js/clock.js";

const VIEWPORT = { width: 420, height: 860 };

/** Freeze `Date.now()` at the given second of the current minute. */
const pinSecond = (second) => `
(() => {
	const base = new Date();
	base.setSeconds(${second}, 0);
	const RealDate = Date;
	class PinnedDate extends RealDate {
		constructor(...args) {
			if (args.length === 0) super(base.getTime());
			else super(...args);
		}
		static now() {
			return base.getTime();
		}
	}
	window.Date = PinnedDate;
})()
`;

const openWithClock = async (page, query, second) => {
	await page.setViewportSize(VIEWPORT);
	await page.addInitScript(pinSecond(second));
	await page.goto(`/?suppressWarnings=true&skipIntro=true&${query}`, { waitUntil: "networkidle" });
	await expect(rainSurfaceCanvas(page)).toBeVisible({ timeout: 30_000 });
	// Two frames so the overlay has painted at least once.
	await page.evaluate(
		() =>
			new Promise((resolve) => {
				requestAnimationFrame(() => requestAnimationFrame(resolve));
			}),
	);
};

/** Vertical extent (in CSS pixels) of everything the overlay painted. */
const paintedExtent = (page) =>
	page.evaluate(() => {
		const canvas = document.getElementById("matrix-clock");
		if (!canvas) return null;
		const ctx = canvas.getContext("2d");
		const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const scale = canvas.width / window.innerWidth;
		let top = Infinity;
		let bottom = -Infinity;
		let pixels = 0;
		for (let y = 0; y < canvas.height; y++) {
			for (let x = 0; x < canvas.width; x++) {
				if (data[(y * canvas.width + x) * 4 + 3] > 24) {
					pixels++;
					if (y / scale < top) top = y / scale;
					if (y / scale > bottom) bottom = y / scale;
				}
			}
		}
		return { top, bottom, pixels, scale };
	});

/**
 * Brightness of the header band only, so the fall can be told apart from the hold by the text
 * sitting there (the real date/time) rather than by how far the glyphs have travelled.
 */
const headerBandBrightness = (page) =>
	page.evaluate(() => {
		const canvas = document.getElementById("matrix-clock");
		if (!canvas) return null;
		const ctx = canvas.getContext("2d");
		const scale = canvas.width / window.innerWidth;
		const from = Math.floor(window.innerHeight * 0.12 * scale);
		const to = Math.floor(window.innerHeight * 0.24 * scale);
		const { data } = ctx.getImageData(0, from, canvas.width, to - from);
		let sum = 0;
		for (let i = 0; i < data.length; i += 4) {
			sum += (data[i] + data[i + 1] + data[i + 2]) * (data[i + 3] / 255);
		}
		return sum;
	});

test.describe("Date/time drop", () => {
	test("holds the date and time at the top for the first ten seconds", async ({ page }) => {
		const watchers = attachMatrixRenderingWatchers(page);
		await openWithClock(page, "dateTimeOverlay=true", 3);

		const canvas = page.locator("#matrix-clock");
		await expect(canvas).toBeAttached();
		await expect(canvas).toHaveCSS("pointer-events", "none");

		const extent = await paintedExtent(page);
		expect(extent.pixels, "the clock should paint something").toBeGreaterThan(100);
		// The header sits at 18% of the viewport height; glyphs below that would mean it is falling.
		expect(extent.top).toBeGreaterThan(0);
		expect(extent.bottom).toBeLessThan(VIEWPORT.height * 0.3);
		watchers.assertNoIssues("clock hold");
	});

	test("lets the characters fall down the screen after the hold", async ({ page }) => {
		const watchers = attachMatrixRenderingWatchers(page);

		// Same pinned minute, so the only difference between these two frames is the phase.
		await openWithClock(page, "dateTimeOverlay=true", 3);
		const heldHeader = await headerBandBrightness(page);

		const falling = await page.context().newPage();
		// Three seconds into the fall: the first characters are mid-screen.
		await openWithClock(falling, "dateTimeOverlay=true", CLOCK_HOLD_SECONDS + 3);

		const extent = await paintedExtent(falling);
		expect(extent.pixels, "the clock should paint something").toBeGreaterThan(100);
		// Characters peel off in order and fall at rain speed, so they are well down the screen
		// seconds after the hold ends...
		expect(extent.bottom).toBeGreaterThan(VIEWPORT.height * 0.4);
		// ...and the header no longer holds the date/time, it holds scrambled glyphs and trails.
		const fallingHeader = await headerBandBrightness(falling);
		expect(fallingHeader).not.toBe(heldHeader);

		await falling.close();
		watchers.assertNoIssues("clock fall");
	});

	test("can be turned off, and stays off by default in a normal browser tab", async ({ page }) => {
		await openWithClock(page, "dateTimeOverlay=false", 3);
		await expect(page.locator("#matrix-clock")).toHaveCount(0);

		const fresh = await page.context().newPage();
		await openWithClock(fresh, "screensaverMode=false", 3);
		// "auto" only enables the clock for an installed/fullscreen phone-sized PWA.
		await expect(fresh.locator("#matrix-clock")).toHaveCount(0);
		await fresh.close();
	});
});
