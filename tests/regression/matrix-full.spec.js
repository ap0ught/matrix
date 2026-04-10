/**
 * Full regression: every version (mode) × every post-process effect on WebGL.
 *
 * Run: `npm run test:regression`
 * Requires: `npx playwright install` (Chromium). Not included in `npm test`.
 *
 * Sources of truth for the Cartesian product:
 * - `getAvailableModes()` / `getAvailableEffects()` in `js/config.js`
 */
import { test } from "@playwright/test";
import { getAvailableEffects, getAvailableModes } from "../../js/config.js";
import { assertGalleryBootsClean, assertMatrixBootsClean } from "../matrix-playwright-helpers.js";

const MODES = getAvailableModes();
const EFFECTS = getAvailableEffects();

/**
 * @param {string} version
 * @param {string} effect
 */
function buildQuery(version, effect) {
	const params = new URLSearchParams({
		suppressWarnings: "true",
		skipIntro: "true",
		renderer: "webgl",
		version,
		effect,
	});
	if (effect === "image") {
		params.set("url", "assets/sand.png");
	}
	return params.toString();
}

test.describe("Full regression: version × effect (WebGL)", () => {
	test.describe.configure({ timeout: 120_000 });

	for (const version of MODES) {
		for (const effect of EFFECTS) {
			test(`${version} + ${effect}`, async ({ page }) => {
				const query = buildQuery(version, effect);
				if (effect === "gallery") {
					await assertGalleryBootsClean(page, query);
				} else {
					await assertMatrixBootsClean(page, query);
				}
			});
		}
	}
});
