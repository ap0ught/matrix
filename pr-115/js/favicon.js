/**
 * Dynamic Favicon Generator for Matrix Digital Rain
 *
 * Generates a favicon by drawing a random glyph from the current mode's character set
 * onto a green background with black-stroked fill — styled after the Matrix digital rain.
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

	// Latin A–Za–z (matches `fonts.alphabet` / alphabet version)
	alphabet: [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"],

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

	// Ensure we always have a non-empty character set to choose from
	const effectiveChars = Array.isArray(chars) && chars.length > 0 ? chars : DEFAULT_CHARS;

	// Pick a random glyph (fallback if index yields undefined, e.g. sparse arrays)
	const char = effectiveChars[Math.floor(Math.random() * effectiveChars.length)] ?? DEFAULT_CHARS[0];

	// Draw the glyph with a black stroke and fill — matches the Matrix "black strokes on green" aesthetic
	ctx.font = `bold ${Math.floor(size * GLYPH_SIZE_RATIO)}px sans-serif`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.strokeStyle = FAVICON_FG_COLOR;
	ctx.lineWidth = 2;
	ctx.strokeText(char, size / 2, size / 2 + GLYPH_VERTICAL_OFFSET);
	ctx.fillStyle = FAVICON_FG_COLOR;
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
	let chars = FONT_CHARS[font] || DEFAULT_CHARS;
	if (config.version === "mathcode_alphabet_three") {
		chars = [...FONT_CHARS.mathcode, ...FONT_CHARS.alphabet];
	}

	const dataURL = generateFaviconDataURL(chars);

	// Update every <link> whose rel token list contains "icon"
	const links = document.querySelectorAll('link[rel~="icon"]');
	links.forEach((link) => {
		link.href = dataURL;
	});

	// Also update all apple-touch-icon links if present (may be multiple sizes/variants)
	const appleLinks = document.querySelectorAll('link[rel~="apple-touch-icon"]');
	appleLinks.forEach((appleLink) => {
		appleLink.href = dataURL;
	});
}
