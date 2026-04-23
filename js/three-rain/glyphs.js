/**
 * Character sets aligned with `fonts.mathcode` / `fonts.alphabet` in config.js (glyph order in MSDF atlas).
 * The Three.js demo rasterizes these to a CPU atlas (not MSDF) for simplicity.
 */
export const MATHCODE_GLYPHS = [
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
];

export const ALPHABET_GLYPHS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"];

export const GLYPH_COUNT_MATH = MATHCODE_GLYPHS.length;
export const GLYPH_COUNT_ALPHA = ALPHABET_GLYPHS.length;
/** Alphabet glyphs follow math in the combined atlas and shader id space */
export const GLYPH_ID_ALPHA_START = GLYPH_COUNT_MATH;
