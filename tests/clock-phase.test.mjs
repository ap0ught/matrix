/**
 * Regression tests for the Matrix date/time drop (js/clock.js).
 *
 * The phase maths is what the whole overlay hangs off: hold for the first ten seconds of the
 * minute, then fall for the remaining fifty, and nothing drawn in between. Plain-text/numeric
 * checks, no browser. The browser smoke test is tests/matrix-clock.spec.js.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CLOCK_FALL_SECONDS, CLOCK_HOLD_SECONDS, clockLines, clockPhase, glyphCycleHz, rainFallSpeed } from "../js/clock.js";

/** A Date at the given second of the minute. */
const atSecond = (second) => {
	const date = new Date(2026, 9, 1, 21, 39, second);
	return date;
};

describe("clockLines", () => {
	it("puts the date and the time on their own lines", () => {
		// 2026-10-01 is a Thursday.
		assert.deepEqual(clockLines(atSecond(0)), ["THU 01 OCT 2026", "21:39:00"]);
		assert.deepEqual(clockLines(atSecond(7)), ["THU 01 OCT 2026", "21:39:07"]);
	});

	it("zero-pads single digit components", () => {
		const date = new Date(2026, 0, 2, 3, 4, 5);
		assert.deepEqual(clockLines(date), ["FRI 02 JAN 2026", "03:04:05"]);
	});
});

describe("rainFallSpeed", () => {
	// Defaults from js/config.js: fallSpeed 0.3, raindropLength 0.75, animationSpeed 1,
	// numColumns 80 (the grid is square), glyphVerticalSpacing 1.
	const defaults = { fallSpeed: 0.3, raindropLength: 0.75, animationSpeed: 1, numColumns: 80, glyphVerticalSpacing: 1 };

	it("follows the raindrop maths: 100 * raindropLength * fallSpeed cells per second", () => {
		// 100 * 0.75 * 0.3 = 22.5 cells/s, each cell 875/80 px tall, at a 0.75 column offset.
		assert.ok(Math.abs(rainFallSpeed(defaults, 875, 0.75) - 22.5 * (875 / 80) * 0.75) < 1e-6);
	});

	it("scales with the viewport, the speed settings and the column offset", () => {
		const base = rainFallSpeed(defaults, 875, 0.75);
		assert.ok(Math.abs(rainFallSpeed(defaults, 1750, 0.75) / base - 2) < 1e-6);
		assert.ok(Math.abs(rainFallSpeed({ ...defaults, fallSpeed: 0.6 }, 875, 0.75) / base - 2) < 1e-6);
		assert.ok(Math.abs(rainFallSpeed(defaults, 875, 1) / base - 1 / 0.75) < 1e-6);
	});

	it("crosses a tall phone screen in a few seconds, like the rain does", () => {
		const speed = rainFallSpeed(defaults, 1000, 0.5);
		assert.ok(speed > 100 && speed < 400, `expected a rain-like speed, got ${speed}`);
	});
});

describe("glyphCycleHz", () => {
	it("turns the per-frame cycleSpeed into glyph changes per second", () => {
		// cycleSpeed 0.03 at 60fps is ~1.8 rolls a second, as in rainPass.symbol.frag.glsl.
		assert.ok(Math.abs(glyphCycleHz({ cycleSpeed: 0.03, animationSpeed: 1 }) - 1.8) < 1e-9);
		assert.ok(Math.abs(glyphCycleHz({ cycleSpeed: 0.03, animationSpeed: 2 }) - 3.6) < 1e-9);
	});
});

describe("clockPhase", () => {
	it("holds for the first ten seconds of the minute", () => {
		for (let second = 0; second < CLOCK_HOLD_SECONDS; second++) {
			const phase = clockPhase(atSecond(second));
			assert.equal(phase.phase, "hold", `second ${second} should hold`);
			assert.equal(phase.elapsed, 0);
		}
	});

	it("falls from the eleventh second onwards", () => {
		assert.equal(clockPhase(atSecond(CLOCK_HOLD_SECONDS)).phase, "fall");
		assert.equal(clockPhase(atSecond(CLOCK_HOLD_SECONDS)).elapsed, 0);
		assert.equal(clockPhase(atSecond(59)).phase, "fall");
	});

	it("never draws anything once the hold is over and the fall is finished", () => {
		// The slowest column should be clear of the screen well before the minute rolls over.
		const fall = rainFallSpeed({}, 1000, 0.5);
		assert.ok((1000 + 200) / fall < CLOCK_FALL_SECONDS, `the fall should finish inside the minute`);
	});

	it("advances monotonically through the fall", () => {
		let previous = -1;
		for (let second = CLOCK_HOLD_SECONDS; second < 60; second++) {
			const { elapsed } = clockPhase(atSecond(second));
			assert.ok(elapsed > previous, `elapsed went backwards at second ${second}`);
			previous = elapsed;
		}
		assert.ok(previous <= CLOCK_FALL_SECONDS);
	});
});
