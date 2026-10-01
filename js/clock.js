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
 * Kept deliberately out of the WebGL pipeline: the rain renders from a fixed MSDF atlas, so an
 * arbitrary string has no glyphs to sample. This is a plain 2D canvas above it.
 *
 * The phase maths (`clockText`, `clockPhase`) is pure and unit tested — see
 * tests/clock-phase.test.mjs.
 */

/** How long the text hangs at the top before it starts falling. */
export const CLOCK_HOLD_SECONDS = 10;

/** Seconds from the start of the fall until the last glyph leaves the screen. */
export const CLOCK_FALL_SECONDS = 50;

/** Glyphs the falling characters scramble through. */
const SCRAMBLE_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:><[]{}*+-=?!$#@%&";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const pad2 = (n) => String(n).padStart(2, "0");

/**
 * The string the Matrix clock shows: weekday, date, then the time to the second.
 * @param {Date} date
 * @returns {string}
 */
export function clockText(date) {
	return `${DAYS[date.getDay()]} ${pad2(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()} ${pad2(date.getHours())}:${pad2(
		date.getMinutes(),
	)}:${pad2(date.getSeconds())}`;
}

/**
 * Where in its minute the clock is, and how far through the fall it is.
 *
 * @param {Date} date
 * @returns {{ phase: "hold" | "fall" | "idle", progress: number, secondsIntoMinute: number }}
 *   `progress` is 0..1 across the fall; `idle` means nothing should be drawn.
 */
export function clockPhase(date) {
	const secondsIntoMinute = date.getSeconds();
	if (secondsIntoMinute < CLOCK_HOLD_SECONDS) {
		return { phase: "hold", progress: 0, secondsIntoMinute };
	}
	return {
		phase: "fall",
		progress: (secondsIntoMinute - CLOCK_HOLD_SECONDS) / CLOCK_FALL_SECONDS,
		secondsIntoMinute,
	};
}

/** Stable pseudo-random glyph so a character flickers between frames without being pure noise. */
const scrambledGlyph = (index, tick) => {
	const seed = (index * 2654435761 + tick * 40503) >>> 0;
	return SCRAMBLE_CHARSET[seed % SCRAMBLE_CHARSET.length];
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
		this.trailLength = 10;
		/** Share of the fall spent staggering the characters out one after another. */
		this.totalStagger = 0.35;
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

		const { phase, progress } = clockPhase(now);
		if (phase === "idle") return;

		const text = clockText(now);
		const fontSize = Math.max(12, Math.min(height * 0.045, width / (text.length * 0.62)));
		const headerY = height * 0.18;
		const startX = (width - text.length * fontSize * 0.6) / 2;

		ctx.font = `bold ${fontSize}px "Courier New", monospace`;
		ctx.textBaseline = "middle";
		ctx.textAlign = "left";

		if (phase === "hold") {
			this.drawHold(ctx, text, startX, headerY, fontSize);
			return;
		}
		this.drawFall(ctx, text, startX, headerY, fontSize, progress, height, now);
	}

	/**
	 * The ten second hold: the date and time sit at the top, ticking, with a faint glow.
	 */
	drawHold(ctx, text, startX, headerY, fontSize) {
		ctx.save();
		ctx.shadowColor = "rgba(0, 255, 65, 0.85)";
		ctx.shadowBlur = fontSize * 0.5;
		ctx.fillStyle = "hsl(120, 100%, 72%)";
		for (let i = 0; i < text.length; i++) {
			ctx.fillText(text[i], startX + i * fontSize * 0.6, headerY);
		}
		ctx.restore();
	}

	/**
	 * The fall: each character leaves the header in turn, scrambling as it drops and trailing
	 * fading copies of itself. Characters still waiting their turn keep showing the real
	 * date/time, so the string visibly peels away.
	 */
	drawFall(ctx, text, startX, headerY, fontSize, progress, height, now) {
		// Time-driven glyph flicker, so the scramble keeps churning while a character is in flight.
		const tick = Math.floor(now.getTime() / 90);
		// Share of the fall spent staggering, so the last character starts before the minute ends.
		const stagger = this.totalStagger;
		const perGlyph = stagger / Math.max(1, text.length - 1);
		const columnWidth = fontSize * 0.6;

		for (let i = 0; i < text.length; i++) {
			const local = Math.min(1, Math.max(0, (progress - i * perGlyph) / (1 - stagger)));
			const x = startX + i * columnWidth;

			if (local <= 0) {
				ctx.fillStyle = "hsl(120, 100%, 72%)";
				ctx.fillText(text[i], x, headerY);
				continue;
			}

			// Accelerating drop, in the spirit of the rain rather than a linear slide.
			const eased = local * local;
			const y = headerY + eased * (height + fontSize * 2);
			const head = scrambledGlyph(i, tick);
			const step = fontSize * 1.05;

			// Trail: the same glyph fading out above the head, jittering like the rain.
			for (let t = this.trailLength; t >= 1; t--) {
				const trailY = y - step * t;
				if (trailY < headerY - step) break;
				const alpha = 0.32 * (1 - t / (this.trailLength + 1));
				const jitter = (scrambledGlyph(i * 31 + t, tick).charCodeAt(0) % 3) - 1;
				ctx.fillStyle = `hsla(120, 100%, 60%, ${alpha.toFixed(3)})`;
				ctx.fillText(scrambledGlyph(i + t, tick), x + jitter * (fontSize * 0.06), trailY);
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
