/**
 * Regression tests for the Matrix date/time drop (js/clock.js).
 *
 * The phase maths is what the whole overlay hangs off: hold for the first ten seconds of the
 * minute, then fall for the remaining fifty, and nothing drawn in between. Plain-text/numeric
 * checks, no browser. The browser smoke test is tests/matrix-clock.spec.js.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CLOCK_FALL_SECONDS, CLOCK_HOLD_SECONDS, clockPhase, clockText } from "../js/clock.js";

/** A Date at the given second of the minute. */
const atSecond = (second) => {
	const date = new Date(2026, 9, 1, 21, 39, second);
	return date;
};

describe("clockText", () => {
	it("formats weekday, date, year and zero-padded time", () => {
		// 2026-10-01 is a Thursday.
		assert.equal(clockText(atSecond(0)), "THU 01 OCT 2026 21:39:00");
		assert.equal(clockText(atSecond(7)), "THU 01 OCT 2026 21:39:07");
	});

	it("zero-pads single digit components", () => {
		const date = new Date(2026, 0, 2, 3, 4, 5);
		assert.equal(clockText(date), "FRI 02 JAN 2026 03:04:05");
	});
});

describe("clockPhase", () => {
	it("holds for the first ten seconds of the minute", () => {
		for (let second = 0; second < CLOCK_HOLD_SECONDS; second++) {
			const phase = clockPhase(atSecond(second));
			assert.equal(phase.phase, "hold", `second ${second} should hold`);
			assert.equal(phase.progress, 0);
		}
	});

	it("falls from the eleventh second onwards", () => {
		assert.equal(clockPhase(atSecond(CLOCK_HOLD_SECONDS)).phase, "fall");
		assert.equal(clockPhase(atSecond(CLOCK_HOLD_SECONDS)).progress, 0);
		assert.equal(clockPhase(atSecond(59)).phase, "fall");
	});

	it("never draws anything once the hold is over and the fall is finished", () => {
		// The last glyph should be leaving the screen right as the minute rolls over.
		const last = clockPhase(atSecond(CLOCK_HOLD_SECONDS + CLOCK_FALL_SECONDS - 1));
		assert.ok(last.progress > 0.95, `expected the fall to be nearly done, got ${last.progress}`);
	});

	it("advances monotonically through the fall", () => {
		let previous = -1;
		for (let second = CLOCK_HOLD_SECONDS; second < 60; second++) {
			const { progress } = clockPhase(atSecond(second));
			assert.ok(progress > previous, `progress went backwards at second ${second}`);
			previous = progress;
		}
		assert.ok(previous <= 1);
	});
});