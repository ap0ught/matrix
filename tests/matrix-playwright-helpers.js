/**
 * Playwright helpers: fail tests when the app logs Matrix WebGL debug errors or
 * known broken-WebGL console lines (e.g. useProgram: program not valid).
 *
 * Listeners must be attached before navigation so early compile/link failures are captured.
 */
import { expect } from "@playwright/test";

/**
 * @param {import("@playwright/test").Page} page
 * @returns {{ assertNoIssues: (context?: string) => void }}
 */
export function attachMatrixRenderingWatchers(page) {
	const issues = [];

	page.on("pageerror", (err) => {
		issues.push({ source: "pageerror", text: String(err) });
	});

	page.on("console", (msg) => {
		const text = msg.text();
		if (!isFailingWebglConsoleMessage(msg.type(), text)) {
			return;
		}
		issues.push({ source: `console.${msg.type()}`, text });
	});

	return {
		assertNoIssues(context = "") {
			if (issues.length === 0) {
				return;
			}
			const detail = issues.map((i) => `  - [${i.source}] ${i.text}`).join("\n");
			throw new Error(`Expected no Matrix/WebGL bootstrap failures${context ? ` (${context})` : ""}.\n${detail}`);
		},
	};
}

/**
 * @param {string} type
 * @param {string} text
 */
function isFailingWebglConsoleMessage(type, text) {
	// Injected hooks in js/webgl/main.js (installWebGLShaderDebugHooks)
	if (/\[Matrix\]\[WebGL\]/.test(text)) {
		return true;
	}
	// Chrome / ANGLE when program never linked
	if (/useProgram:\s*program not valid/i.test(text)) {
		return true;
	}
	// Same family: invalid program bound for draw
	if (
		(type === "error" || type === "warning") &&
		/^WebGL:/i.test(text.trim()) &&
		/INVALID_OPERATION/i.test(text) &&
		/\b(useProgram|drawArrays|drawElements)\b/i.test(text)
	) {
		return true;
	}
	return false;
}

/** Two animation frames so regl has a chance to compile/link and run a draw after paint. */
export async function settleAfterPaint(page) {
	await page.evaluate(
		() =>
			new Promise((resolve) => {
				requestAnimationFrame(() => {
					requestAnimationFrame(resolve);
				});
			}),
	);
}

/**
 * The drawable rain surface: first **visible** `<canvas>` (experimental `p5-rain` hides the Matrix
 * canvas and adds a second one; WebGL/WebGPU/Three use the original canvas as visible).
 * @param {import("@playwright/test").Page} page
 */
export function rainSurfaceCanvas(page) {
	return page.locator("canvas").filter({ visible: true }).first();
}

/**
 * Goto, wait for canvas, settle frames, then assert no page/console Matrix-WebGL failures and canvas size.
 * @param {import("@playwright/test").Page} page
 * @param {string} query - URL query string (without leading ?/) or absolute http(s) URL
 */
export async function assertMatrixBootsClean(page, query) {
	const watchers = attachMatrixRenderingWatchers(page);
	const path = query.startsWith("http") ? query : `/?${query}`;
	await page.goto(path, { waitUntil: "networkidle" });
	const canvas = rainSurfaceCanvas(page);
	await expect(canvas).toBeVisible({ timeout: 30_000 });
	await settleAfterPaint(page);
	const { w, h } = await canvas.evaluate((el) => ({
		w: el.width,
		h: el.height,
	}));
	watchers.assertNoIssues(query);
	expect(w, `canvas width for ${query}`).toBeGreaterThan(0);
	expect(h, `canvas height for ${query}`).toBeGreaterThan(0);
}

/**
 * Gallery mode: no rain canvas assertion; ensure UI mounts and no Matrix/WebGL console failures.
 * @param {import("@playwright/test").Page} page
 * @param {string} query - URL query string (without leading ?/) or absolute http(s) URL
 */
export async function assertGalleryBootsClean(page, query) {
	const watchers = attachMatrixRenderingWatchers(page);
	const path = query.startsWith("http") ? query : `/?${query}`;
	await page.goto(path, { waitUntil: "networkidle" });
	await expect(page.locator("#gallery-info")).toBeVisible({ timeout: 30_000 });
	await settleAfterPaint(page);
	watchers.assertNoIssues(query);
}
