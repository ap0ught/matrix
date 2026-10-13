/**
 * Experimental p5.js mathcode rain (2D canvas, CPU text — not MSDF / bloom / effects).
 * See RENDERING_PIPELINE.md.
 */
import { setupFullscreenToggle } from "../fullscreen.js";
import { MATHCODE_GLYPHS } from "../three-rain/glyphs.js";

const loadJS = (src) =>
	new Promise((resolve, reject) => {
		const tag = document.createElement("script");
		tag.onload = resolve;
		tag.onerror = reject;
		tag.src = src;
		document.body.appendChild(tag);
	});

/* p5 installs a page global, so it only needs injecting once — even across renderer rebuilds. */
const scriptLoads = new Map();
const loadScriptOnce = (src) => {
	if (!scriptLoads.has(src)) {
		scriptLoads.set(src, loadJS(src));
	}
	return scriptLoads.get(src);
};

/*
 * The renderer currently attached to a canvas, so `updateConfig` can tear it down and build a new
 * sketch on the same canvas (gallery item picks, screensaver mode switches).
 */
let activeSession = null;

function randomGlyph() {
	return MATHCODE_GLYPHS[Math.floor(Math.random() * MATHCODE_GLYPHS.length)] ?? "?";
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {import("../config.js").MatrixConfig} config
 */
const startP5Rain = async (canvas, config) => {
	await loadScriptOnce("lib/p5.min.js");
	const P5 = globalThis.p5;
	if (typeof P5 !== "function") {
		throw new Error("[p5-rain] global p5 not found after loading lib/p5.min.js");
	}

	canvas.style.display = "none";

	const numColumns = Math.max(12, Math.min(72, Number(config.numColumns) || 48));
	const dropsPerColumn = 28;
	const fallMul = (config.fallSpeed ?? 0.5) * 2.2;
	const res = config.resolution ?? 0.75;
	const glyphFlip = !!config.glyphRandomFlip;

	/** @type {{ ch: string, y: number, speed: number, flipX: number, flipY: number }[][]} */
	const columns = [];

	let cleanupFullscreen = () => {};

	function canvasCssSize() {
		const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
		// The app's primary Matrix canvas can be hidden in experimental p5 mode; do not
		// size off its client rect. Use viewport size so Playwright (and users) always
		// get a non-zero drawable surface.
		const w = Math.ceil(window.innerWidth * dpr * res);
		const h = Math.ceil(window.innerHeight * dpr * res);
		return { w, h };
	}

	function buildColumns(pW, pH) {
		const colW = pW / numColumns;
		columns.length = 0;
		for (let c = 0; c < numColumns; c++) {
			const col = [];
			for (let d = 0; d < dropsPerColumn; d++) {
				col.push({
					ch: randomGlyph(),
					y: (Math.random() * pH) / colW,
					speed: 0.4 + Math.random() * 1.2,
					flipX: glyphFlip && Math.random() < 0.5 ? -1 : 1,
					flipY: glyphFlip && Math.random() < 0.5 ? -1 : 1,
				});
			}
			columns.push(col);
		}
	}

	const sketch = (p) => {
		p.setup = () => {
			const { w, h } = canvasCssSize();
			p.createCanvas(w, h);
			p.pixelDensity(1);
			p.colorMode(p.HSL, 1);
			p.textAlign(p.CENTER, p.CENTER);
			p.noStroke();

			const cnv = p.canvas;
			cnv.style.position = "fixed";
			cnv.style.inset = "0";
			cnv.style.width = "100vw";
			cnv.style.height = "100vh";
			cnv.style.zIndex = "1";

			buildColumns(w, h);
			cleanupFullscreen = setupFullscreenToggle(cnv);
		};

		p.draw = () => {
			p.background(0.33, 0.85, 0.025);
			const w = p.width;
			const h = p.height;
			const colW = w / numColumns;
			const baseSize = colW * 0.82;

			for (let c = 0; c < numColumns; c++) {
				const x = (c + 0.5) * colW;
				for (const g of columns[c]) {
					g.y += g.speed * fallMul;
					const yPx = g.y * colW;
					if (yPx > h + colW) {
						g.y = -1;
						g.ch = randomGlyph();
						if (glyphFlip) {
							g.flipX = Math.random() < 0.5 ? -1 : 1;
							g.flipY = Math.random() < 0.5 ? -1 : 1;
						}
					}
					const t = (g.y * 0.12 + c * 0.03) % 1;
					p.fill(0.52 + t * 0.06, 0.95, 0.35 + t * 0.55);
					p.push();
					p.translate(x, yPx);
					p.scale(g.flipX, g.flipY);
					p.textSize(baseSize);
					p.text(g.ch, 0, 0);
					p.pop();
				}
			}
		};

		p.windowResized = () => {
			const { w, h } = canvasCssSize();
			p.resizeCanvas(w, h);
			buildColumns(w, h);
		};
	};

	const sketchInstance = new P5(sketch, document.body);

	const cycleMs = Math.max(200, Math.min(2500, (1 / (config.cycleSpeed ?? 0.05)) * 45));
	const cycleTimer = window.setInterval(() => {
		for (const col of columns) {
			for (const g of col) {
				if (Math.random() < 0.2) {
					g.ch = randomGlyph();
				}
			}
		}
	}, cycleMs);

	activeSession = {
		canvas,
		dispose: () => {
			window.clearInterval(cycleTimer);
			cleanupFullscreen();
			// Drops the sketch's canvas and draw loop so a rebuild does not stack two of them.
			sketchInstance.remove();
			if (activeSession?.canvas === canvas) {
				activeSession = null;
			}
		},
	};
};

export default startP5Rain;

/**
 * Rebuild the renderer with a new config on the same canvas.
 *
 * @param {import("../config.js").MatrixConfig} config
 * @returns {Promise<void>}
 */
export const updateConfig = (config) => {
	const session = activeSession;
	if (!session) {
		console.warn("[Matrix][p5-rain] updateConfig() called before the renderer started");
		return Promise.resolve();
	}
	session.dispose();
	return startP5Rain(session.canvas, config);
};
