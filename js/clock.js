/**
 * Matrix Date/Time Drop
 *
 * "The Oracle will show you how."
 *
 * A DOM overlay that stamps the current date and time at the top of the screen at the start of
 * every minute, holds it there for ten seconds, then lets it peel off and fall out of frame with
 * scrambled glyph trails — the digital clock from the films, in a `<canvas>` on top of whichever
 * renderer is running.
 *
 * The fall borrows the rain's own motion: cells per second come out of the same raindrop maths the
 * WebGL pass uses (`fallSpeed`, `raindropLength`, `animationSpeed`, the glyph grid), columns vary
 * their speed between 0.5x and 1x like the rain does, and glyphs re-roll at the same cadence as
 * `cycleSpeed`. That is what makes the clock dissolve into the background instead of reading as a
 * separate effect — by the time it reaches the bottom there is nothing left to tell apart.
 *
 * Kept out of the WebGL pipeline on purpose: the rain renders from a fixed MSDF atlas, so an
 * arbitrary string has no glyphs to sample. This is a plain 2D canvas above it.
 *
 * The phase maths (`clockLines`, `clockPhase`, `rainFallSpeed`) is pure and unit tested — see
 * tests/clock-phase.test.mjs.
 */

/** How long the text hangs at the top before it starts falling. */
export const CLOCK_HOLD_SECONDS = 10;

/** Longest the fall can take; characters at the rain\'s slowest column speed clear the screen in less. */
export const CLOCK_FALL_SECONDS = 50;

/** Glyphs the falling characters scramble through — the rain's alphabet, digits and a few marks. */
const SCRAMBLE_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:><[]{}*+-=?!$#@%&";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** Assumed frame rate when converting `cycleSpeed` (per frame) into glyph changes per second. */
const ASSUMED_FPS = 60;

const pad2 = (n) => String(n).padStart(2, "0");

/**
 * The two lines the Matrix clock shows: the date, then the time to the second.
 * @param {Date} date
 * @returns {[string, string]}
 */
export function clockLines(date) {
	const dateLine = `${DAYS[date.getDay()]} ${pad2(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
	const timeLine = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
	return [dateLine, timeLine];
}

/**
 * The rain's downward speed in pixels per second, for a column falling at `columnSpeedOffset` times
 * the average rate.
 *
 * Mirrors shaders/glsl/rainPass.raindrop.frag.glsl: a cell scrolls by
 * `100 * raindropLength * fallSpeed * columnSpeedOffset` cells per unit of sim time, a cell is
 * `glyphVerticalSpacing / numColumns` of the screen tall (the grid is square — see
 * js/webgl/rainPass.js), and sim time runs at `animationSpeed`.
 *
 * @param {Object} config - Matrix config
 * @param {number} viewportHeight - CSS pixels
 * @param {number} [columnSpeedOffset] - 0.5..1, the rain's per-column speed variation
 * @returns {number} pixels per second
 */
export function rainFallSpeed(config, viewportHeight, columnSpeedOffset = 0.75) {
	const { fallSpeed = 0.3, raindropLength = 0.75, animationSpeed = 1, numColumns = 80, glyphVerticalSpacing = 1 } = config ?? {};
	const cellsPerSecond = 100 * raindropLength * fallSpeed * animationSpeed * columnSpeedOffset;
	return cellsPerSecond * ((glyphVerticalSpacing / numColumns) * viewportHeight);
}

/**
 * How often the rain re-rolls a cell's glyph, in glyph changes per second — `cycleSpeed` is per
 * frame in rainPass.symbol.frag.glsl.
 * @param {Object} config - Matrix config
 * @returns {number}
 */
export function glyphCycleHz(config) {
	const { cycleSpeed = 0.03, animationSpeed = 1 } = config ?? {};
	return Math.max(0.5, animationSpeed * cycleSpeed * ASSUMED_FPS);
}

/**
 * Where in its minute the clock is, and how long the fall has been running.
 *
 * @param {Date} date
 * @returns {{ phase: "hold" | "fall" | "idle", elapsed: number, secondsIntoMinute: number }}
 *   `elapsed` is seconds into the fall; `idle` means nothing should be drawn.
 */
export function clockPhase(date) {
	const secondsIntoMinute = date.getSeconds();
	if (secondsIntoMinute < CLOCK_HOLD_SECONDS) {
		return { phase: "hold", elapsed: 0, secondsIntoMinute };
	}
	return {
		phase: "fall",
		elapsed: secondsIntoMinute - CLOCK_HOLD_SECONDS,
		secondsIntoMinute,
	};
}

/** Stable pseudo-random glyph so a character flickers between rolls without being pure noise. */
const scrambledGlyph = (index, roll) => {
	const seed = (index * 2654435761 + roll * 40503) >>> 0;
	return SCRAMBLE_CHARSET[seed % SCRAMBLE_CHARSET.length];
};

/** The rain's per-column speed variation: every column is a bit slower or faster than average. */
const columnSpeedOffset = (index) => {
	const seed = (index * 374761393 + 668265263) >>> 0;
	return 0.5 + (((seed >>> 8) % 1000) / 1000) * 0.5;
};

/**
 * The Matrix date/time overlay.
 */
export default class DateTimeOverlay {
	constructor(config = {}) {
		this.config = config;
		this.canvas = null;
		this.context = null;
		this.isRunning = false;
		this.rafId = null;
		/** Trailing characters drawn above each falling glyph, head excluded. */
		this.trailLength = 9;
		/** Seconds between one character leaving the header and the next starting. */
		this.staggerSeconds = 0.09;
	}

	/**
	 * Should the overlay run? `auto` means "when this is a phone-sized, fullscreen or installed
	 * PWA" — the case it was asked for — so desktop browsing is left alone.
	 * @param {Object|boolean|string} setting
	 * @returns {boolean}
	 */
	static isEnabled(setting) {
		if (setting === true) return true;
		if (typeof setting === "string") {
			const normalized = setting.toLowerCase();
			if (normalized === "false" || normalized === "0") return false;
			if (normalized === "true" || normalized === "1") return true;
		}
		const installed = matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches;
		const touch = matchMedia("(pointer: coarse)").matches || (navigator.maxTouchPoints ?? 0) > 0;
		return installed && touch;
	}

	/**
	 * Build and start the overlay if the config asks for it.
	 * @param {Object} config - Matrix config (`dateTimeOverlay`)
	 * @returns {DateTimeOverlay|null} null when disabled, so callers can ignore it
	 */
	static createIfEnabled(config) {
		if (!DateTimeOverlay.isEnabled(config?.dateTimeOverlay)) {
			return null;
		}
		return new DateTimeOverlay(config).start();
	}

	/**
	 * Attach the canvas and begin animating.
	 * @returns {this}
	 */
	start() {
		if (this.isRunning) return this;

		this.canvas = document.createElement("canvas");
		this.canvas.id = "matrix-clock";
		this.canvas.setAttribute("aria-hidden", "true");
		Object.assign(this.canvas.style, {
			position: "fixed",
			inset: "0",
			width: "100%",
			height: "100%",
			pointerEvents: "none",
			// Below the gallery fortunes (20000), playlist (15000) and mode display (1000).
			zIndex: "100",
		});
		document.body.appendChild(this.canvas);
		this.context = this.canvas.getContext("2d");

		this.resize();
		window.addEventListener("resize", this.resize);
		window.addEventListener("orientationchange", this.resize);

		this.isRunning = true;
		this.tick();
		return this;
	}

	/**
	 * Stop animating and remove the canvas.
	 */
	stop() {
		if (!this.isRunning) return;
		this.isRunning = false;
		cancelAnimationFrame(this.rafId);
		window.removeEventListener("resize", this.resize);
		window.removeEventListener("orientationchange", this.resize);
		this.canvas?.remove();
		this.canvas = null;
		this.context = null;
	}

	/** Match the backing store to the viewport so the glyphs stay crisp on high-DPI screens. */
	resize = () => {
		if (!this.canvas) return;
		const devicePixelRatio = Math.min(window.devicePixelRatio ?? 1, 3);
		this.canvas.width = Math.ceil(window.innerWidth * devicePixelRatio);
		this.canvas.height = Math.ceil(window.innerHeight * devicePixelRatio);
		this.context?.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
	};

	tick = () => {
		if (!this.isRunning) return;
		this.draw(new Date());
		this.rafId = requestAnimationFrame(this.tick);
	};

	/**
	 * Draw one frame of the clock.
	 * @param {Date} now
	 */
	draw(now) {
		const ctx = this.context;
		if (!ctx) return;

		const width = window.innerWidth;
		const height = window.innerHeight;
		ctx.clearRect(0, 0, width, height);

		const { phase, elapsed } = clockPhase(now);
		if (phase === "idle") return;

		const lines = clockLines(now);
		const longest = Math.max(...lines.map((line) => line.length));
		const fontSize = Math.max(12, Math.min(height * 0.04, width / (longest * 0.62)));
		const lineGap = fontSize * 1.45;
		const centerY = height * 0.17;

		ctx.font = `bold ${fontSize}px "Courier New", monospace`;
		ctx.textBaseline = "middle";
		ctx.textAlign = "left";

		lines.forEach((line, lineIndex) => {
			const startX = (width - line.length * fontSize * 0.6) / 2;
			const headerY = centerY + (lineIndex - (lines.length - 1) / 2) * lineGap;
			// The date peels first, the time a beat later, so the two lines do not read as one block.
			const lineDelay = lineIndex * this.staggerSeconds * 3;
			if (phase === "hold") {
				this.drawHold(ctx, line, startX, headerY, fontSize);
			} else {
				this.drawFall(ctx, line, startX, headerY, fontSize, elapsed - lineDelay, height);
			}
		});
	}

	/**
	 * The ten second hold: the date and time sit stacked at the top, ticking, with a faint glow.
	 */
	drawHold(ctx, line, startX, headerY, fontSize) {
		ctx.save();
		ctx.shadowColor = "rgba(0, 255, 65, 0.85)";
		ctx.shadowBlur = fontSize * 0.5;
		ctx.fillStyle = "hsl(120, 100%, 72%)";
		for (let i = 0; i < line.length; i++) {
			ctx.fillText(line[i], startX + i * fontSize * 0.6, headerY);
		}
		ctx.restore();
	}

	/**
	 * The fall: characters leave the header in order and drop at the rain's own speed, each column
	 * a little slower or faster like the rain's, re-rolling glyphs at `cycleSpeed` and trailing
	 * fading copies. The ones still waiting their turn keep showing the real date/time.
	 *
	 * @param {number} elapsed - seconds since this line started falling
	 */
	drawFall(ctx, line, startX, headerY, fontSize, elapsed, height) {
		const columnWidth = fontSize * 0.6;
		const cycleHz = glyphCycleHz(this.config);
		const step = fontSize * 1.05;

		for (let i = 0; i < line.length; i++) {
			const age = elapsed - i * this.staggerSeconds;
			const x = startX + i * columnWidth;

			if (age <= 0) {
				ctx.fillStyle = "hsl(120, 100%, 72%)";
				ctx.fillText(line[i], x, headerY);
				continue;
			}

			const y = headerY + age * rainFallSpeed(this.config, height, columnSpeedOffset(i));
			if (y - this.trailLength * step > height) {
				continue; // Gone; the rain below takes over.
			}

			// Re-roll glyphs at the rain's cadence, and vary the roll per character so the
			// scramble does not march in lockstep.
			const roll = Math.floor(age * cycleHz + columnSpeedOffset(i) * 7);
			const head = scrambledGlyph(i, roll);

			for (let t = this.trailLength; t >= 1; t--) {
				const trailY = y - step * t;
				if (trailY < headerY - step) break;
				const alpha = 0.3 * (1 - t / (this.trailLength + 1));
				const jitter = (scrambledGlyph(i * 31 + t, roll).charCodeAt(0) % 3) - 1;
				ctx.fillStyle = `hsla(120, 100%, 60%, ${alpha.toFixed(3)})`;
				ctx.fillText(scrambledGlyph(i + t, roll + t), x + jitter * (fontSize * 0.06), trailY);
			}

			ctx.save();
			ctx.shadowColor = "rgba(0, 255, 65, 0.9)";
			ctx.shadowBlur = fontSize * 0.4;
			ctx.fillStyle = "hsl(120, 100%, 78%)";
			ctx.fillText(head, x, y);
			ctx.restore();
		}
	}
}
