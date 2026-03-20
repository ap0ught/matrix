/**
 * Dynamic Favicon Generator for Matrix Digital Rain
 *
 * Generates a favicon by drawing a random glyph from the current mode's character set
 * onto a green background with black strokes — styled after the Matrix digital rain.
 *
 * "You take the blue pill — the story ends. You take the red pill — and the favicon changes."
 */

/*
 * Character sets for each Matrix font.
 * Each array contains Unicode characters that correspond to that font's glyph set.
 * These are used to pick a random glyph when generating the favicon.
 */
const FONT_CHARS = {
	// Classic Matrix Code — katakana and symbols from the iconic green rain
	matrixcode: [...'モエヤキオカケサスzヨタワネヌナヒホアウセミラリツテニハソコシマムメ7z¦:"▪—<>|+*꞊╌'],

	// Megacity variant — same base as matrixcode plus digits
	megacity: [...'モエヤキオカ7ケサスz152ヨタワ4ネヌナ98ヒ0ホア3ウセ¦:"꞊ミラリ╌ツテニハソ▪—<>|+*コシマムメ'],

	// Resurrections — updated glyph set from The Matrix Resurrections
	resurrections: [..."モエヤキオカケサスzヨタワネヌナヒホアウセミラリツテニハソコシマムメ꞊╌▪—"],

	// Nightmare / Gothic — Wulfila Gothic script characters
	gothic: [..."𐌰𐌱𐌲𐌳𐌴𐌵𐌶𐌷𐌸𐌹𐌺𐌻𐌼𐌽𐌾𐌿𐍀𐍂𐍃𐍄𐍅𐍆𐍇𐍈𐍉"],

	// Paradise / Coptic — Coptic alphabet characters
	coptic: [..."ϢϣϤϥϦϧϨϩϪϫϬϭϮϯⲀⲁⲂⲃⲄⲅⲆⲇⲈⲉⲊⲋⲌⲍⲎⲏⲐⲑⲒⲓ"],

	// Mathcode — mathematical symbols, Greek letters, set notation, arrows, stars
	mathcode: [
		"∑",
		"∆",
		"∇",
		"∞",
		"≠",
		"≈",
		"∈",
		"∉",
		"←",
		"→",
		"↑",
		"↓",
		"↔",
		"↕",
		"⇒",
		"⇔",
		"ඞ",
		"∫",
		"π",
		"τ",
		"ψ",
		"φ",
		"Ω",
		"Φ",
		"ε",
		"β",
		"α",
		"Σ",
		"♬",
		"☆",
		"✮",
		"★",
		"✯",
		"✫",
		"₊",
		"˚",
		"˙",
		"⁂",
		"◇",
		"⋄",
		"⁺",
		"𝝿",
	],

	// Neomatrixology — minimalist, reduced symbol set
	neomatrixology: [..."∑∆∇∞≠≈∈∉←→↑↓"],

	// Huberfish A & D — futuristic fictional alphabet; use geometric fallback symbols
	huberfishA: [..."△▽◁▷◈◉◊○●◦◆◇⬡⬢⬟⬠"],
	huberfishD: [..."△▽◁▷◈◉◊○●◦◆◇⬡⬢⬟⬠"],

	// Gtarg fonts — xenolinguistic; use a mix of geometric shapes and symbols
	gtarg_tenretniolleh: [..."◇⋄△▽⬡⬢○●◉◎⊕⊗⊙⊚⊛"],
	gtarg_alientext: [..."◇⋄△▽⬡⬢○●◉◎⊕⊗⊙⊚⊛☽☾★☆"],
};

// Fallback character set when the font is unknown
const DEFAULT_CHARS = FONT_CHARS.matrixcode;

// Matrix green — the iconic colour of the digital rain
const FAVICON_BG_COLOR = "#00cc44";
const FAVICON_FG_COLOR = "#000000";

// Glyph rendering constants
const GLYPH_SIZE_RATIO = 0.68; // Fraction of canvas height used for the glyph font size
const GLYPH_VERTICAL_OFFSET = 2; // Pixel nudge to better centre glyphs within their metrics box

/** @type {HTMLCanvasElement|null} */
let faviconCanvas = null;

/**
 * Lazily create a reusable canvas for favicon generation.
 * @returns {HTMLCanvasElement}
 */
function getFaviconCanvas() {
	if (!faviconCanvas) {
		faviconCanvas = document.createElement("canvas");
		faviconCanvas.width = 64;
		faviconCanvas.height = 64;
	}
	return faviconCanvas;
}

/**
 * Render a single character onto a green background and return a data URL.
 *
 * @param {string[]} chars - Array of candidate characters to choose from.
 * @returns {string} PNG data URL for the favicon.
 */
function generateFaviconDataURL(chars) {
	const size = 64;
	const canvas = getFaviconCanvas();
	const ctx = canvas.getContext("2d");

	// Green background
	ctx.fillStyle = FAVICON_BG_COLOR;
	ctx.fillRect(0, 0, size, size);

	// Pick a random glyph
	const char = chars[Math.floor(Math.random() * chars.length)];

	// Draw the glyph in black — bold for visibility at small sizes
	ctx.fillStyle = FAVICON_FG_COLOR;
	ctx.font = `bold ${Math.floor(size * GLYPH_SIZE_RATIO)}px sans-serif`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(char, size / 2, size / 2 + GLYPH_VERTICAL_OFFSET);

	return canvas.toDataURL("image/png");
}

/**
 * Update all favicon link elements with a freshly generated glyph icon
 * matching the current Matrix mode.
 *
 * Call this on page load and whenever the mode changes in-place (e.g. screensaver).
 *
 * @param {object} config - The current Matrix configuration object.
 * @param {string} [config.font] - Font name for the current mode.
 */
export function updateFavicon(config) {
	const font = config.font || "matrixcode";
	const chars = FONT_CHARS[font] || DEFAULT_CHARS;

	const dataURL = generateFaviconDataURL(chars);

	// Update every <link rel="icon"> element in the document
	const links = document.querySelectorAll('link[rel="icon"]');
	links.forEach((link) => {
		link.href = dataURL;
	});

	// Also update apple-touch-icon if present
	const appleLink = document.querySelector('link[rel="apple-touch-icon"]');
	if (appleLink) {
		appleLink.href = dataURL;
	}
}
