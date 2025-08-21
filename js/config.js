/*
 * Matrix Configuration System
 *
 * This module defines all the configurable aspects of the Matrix digital rain effect.
 * Like the Architect's precise control over the simulation's parameters, this system
 * allows fine-tuning of every visual aspect from glyph fonts to color palettes.
 *
 * The configuration handles multiple Matrix "versions" representing different eras:
 * - Classic: The iconic green rain from the original trilogy
 * - Resurrections: Updated glyphs from the 2021 film
 * - Paradise/Nightmare: Speculative earlier Matrix versions
 * - Custom variants: Artistic interpretations and thematic variations
 */

/*
 * Random Version Selection Utility
 *
 * Sometimes the best way to experience the Matrix is to let the system
 * choose for you - like following the white rabbit down an unknown path.
 * This function selects a random Matrix version while excluding aliases
 * and deprecated version names.
 *
 * @param {Object} versions - Available version configurations
 * @returns {Object} Randomly selected version configuration
 */
/*
 * Version Exclusion List
 * These are aliases or deprecated version names that shouldn't
 * appear in random selection or available modes to avoid confusion or broken experiences
 */
const EXCLUDED_VERSIONS = ["excludeME"];

/*
 * Random Version Selection Utility
 *
 * Sometimes the best way to experience the Matrix is to let the system
 * choose for you - like following the white rabbit down an unknown path.
 * This function selects a random Matrix version while excluding aliases
 * and deprecated version names.
 *
 * @param {Object} versions - Available version configurations
 * @returns {Object} Randomly selected version configuration
 */
export function getRandomVersion(versions) {
	const keys = Object.keys(versions).filter((v) => !EXCLUDED_VERSIONS.includes(v));
	const randomKey = keys[Math.floor(Math.random() * keys.length)];
	return versions[randomKey];
}

/*
 * Get All Available Modes
 *
 * Returns a list of all available version keys, excluding aliases
 */
export function getAvailableModes() {
	return Object.keys(versions).filter(v => !EXCLUDED_VERSIONS.includes(v));
}

/*
 * Get Available Effects
 *
 * Returns a list of all available effect names
 */
export function getAvailableEffects() {
	return ["none", "plain", "palette", "customStripes", "stripes", "pride", "transPride", "trans", "image", "mirror"];
}

/*
 * Font Definitions - The Languages of the Matrix
 *
 * Each font represents different script systems used across Matrix versions.
 * The glyphs are stored as Multi-channel Signed Distance Fields (MSDF) which
 * preserve crisp vector-like quality at any scale - essential for the Matrix's
 * precise geometric appearance.
 *
 * Key properties:
 * - glyphMSDFURL: Path to the MSDF texture containing all glyphs
 * - glyphSequenceLength: Total number of unique glyphs in the font
 * - glyphTextureGridSize: [width, height] grid layout of glyphs in the texture
 * - glintMSDFURL: Optional separate texture for glyph highlights/glints
 */
const fonts = {
	coptic: {
		/*
		 * Coptic Script - Language of the Paradise Matrix
		 * The script the Gnostic codices were written in, representing
		 * the idealistic predecessor Matrix that was "too perfect"
		 */
		glyphMSDFURL: "assets/coptic_msdf.png",
		glyphSequenceLength: 32,
		glyphTextureGridSize: [8, 8],
	},
	gothic: {
		/*
		 * Gothic Script - Language of the Nightmare Matrix
		 * The script the Codex Argenteus was written in, representing
		 * the harsh, Hobbesian predecessor that was "too brutal"
		 */
		glyphMSDFURL: "assets/gothic_msdf.png",
		glyphSequenceLength: 27,
		glyphTextureGridSize: [8, 8],
	},
	matrixcode: {
		/*
		 * Classic Matrix Code - The Iconic Green Rain
		 * The authentic glyphs seen in the original film trilogy,
		 * derived from katakana and Susan Kare's Chicago typeface
		 */
		glyphMSDFURL: "assets/matrixcode_msdf.png",
		glyphSequenceLength: 57,
		glyphTextureGridSize: [8, 8],
	},
	megacity: {
		/*
		 * Megacity Variant - Revolutions Special Edition
		 * Includes the Megacity glyph as seen in the opening titles
		 * of The Matrix Revolutions
		 */
		glyphMSDFURL: "assets/megacity_msdf.png",
		glyphSequenceLength: 64,
		glyphTextureGridSize: [8, 8],
	},
	resurrections: {
		/*
		 * Resurrections Code - The Evolved Matrix
		 * Updated glyph set from The Matrix Resurrections (2021) featuring
		 * 135 symbols - the most comprehensive Matrix font ever created.
		 * Includes separate glint textures for enhanced visual effects.
		 */
		glyphMSDFURL: "assets/resurrections_msdf.png",
		glintMSDFURL: "assets/resurrections_glint_msdf.png",
		glyphSequenceLength: 135,
		glyphTextureGridSize: [13, 12],
	},
	huberfishA: {
		/*
		 * Huberfish Alpha - Futuristic Variant A
		 * Fictional alphabet designed for sci-fi aesthetics,
		 * representing code from a utopian spacefaring civilization
		 */
		glyphMSDFURL: "assets/huberfish_a_msdf.png",
		glyphSequenceLength: 34,
		glyphTextureGridSize: [6, 6],
	},
	huberfishD: {
		/*
		 * Huberfish Delta - Futuristic Variant D
		 * Alternative style of the Huberfish alphabet with
		 * different geometric characteristics and spacing
		 */
		glyphMSDFURL: "assets/huberfish_d_msdf.png",
		glyphSequenceLength: 34,
		glyphTextureGridSize: [6, 6],
	},
	gtarg_tenretniolleh: {
		/*
		 * Gtarg Tenretniolleh - Experimental Font
		 * Specialized glyph set for alternative Matrix interpretations
		 * Name appears to be "hellointernetgtag" reversed - a digital Easter egg
		 */
		glyphMSDFURL: "assets/gtarg_tenretniolleh_msdf.png",
		glyphSequenceLength: 36,
		glyphTextureGridSize: [6, 6],
	},
	gtarg_alientext: {
		/*
		 * Gtarg Alien Text - Xenolinguistic Matrix
		 * Represents communication from non-human intelligences
		 * within the Matrix simulation - the language of the machines themselves
		 */
		glyphMSDFURL: "assets/gtarg_alientext_msdf.png",
		glyphSequenceLength: 38,
		glyphTextureGridSize: [8, 5],
	},
	neomatrixology: {
		/*
		 * Neo-Matrixology - Minimalist Code
		 * Reduced glyph set focusing on essential symbols,
		 * representing the simplified truth Neo perceives after awakening
		 */
		glyphMSDFURL: "assets/neomatrixology_msdf.png",
		glyphSequenceLength: 12,
		glyphTextureGridSize: [4, 4],
	},
};

/*
 * Texture Assets - Surface Materials for the Digital World
 *
 * These textures can be applied to glyphs to create different surface
 * appearances, adding depth and variety to the Matrix's visual language.
 * Each texture represents a different aspect of digital reality.
 */
const textureURLs = {
	sand: "assets/sand.png", // Organic, natural texture - reality bleeding through
	pixels: "assets/pixel_grid.png", // Raw digital structure - the Matrix's true form
	mesh: "assets/mesh.png", // Network connections - the web of the simulation
	metal: "assets/metal.png", // Industrial reality - the machine world
};

/*
 * Color Space Constructors
 *
 * These utility functions create color specifications for different color spaces:
 * - HSL: Human-intuitive (Hue, Saturation, Lightness)
 * - RGB: Machine-native (Red, Green, Blue)
 *
 * HSL is often more convenient for creating pleasing color palettes,
 * while RGB maps directly to display hardware capabilities.
 */
const hsl = (...values) => ({ space: "hsl", values });
const rgb = (...values) => ({ space: "rgb", values });

/*
 * Default Configuration Values - The Matrix's Base Parameters
 *
 * These settings define the fundamental characteristics of the digital rain effect.
 * Like the Architect's carefully balanced equations, each parameter influences
 * the overall behavior and appearance of the simulation.
 *
 * Categories:
 * - Visual: Colors, fonts, effects, and appearance
 * - Animation: Speeds, timing, and movement parameters
 * - Rendering: Performance, quality, and technical settings
 * - Interaction: Camera, input, and user interface options
 */
const defaults = {
	/* === Font and Glyph Settings === */
	font: "matrixcode", // Default to classic Matrix typography

	/* === Visual Effects === */
	effect: "mirror", // Post-processing effect to apply (mirror, palette, etc.)
	baseTexture: null, // Optional texture applied to the glyph base layer
	glintTexture: null, // Optional texture applied to glyph highlights

	/* === Camera and Interaction === */
	useCamera: false, // Enable webcam input for interactive effects

	/* === Color Configuration === */
	backgroundColor: hsl(0, 0, 0), // The void behind the glyphs - pure black

	/* === Cursor (Raindrop Leader) Settings === */
	isolateCursor: true, // Whether cursor has distinct appearance from other glyphs
	cursorColor: hsl(0.242, 1, 0.73), // Cyan-green cursor color (classic Matrix accent)
	cursorIntensity: 2, // Brightness multiplier for a cursor glow

	/* === Glint (Highlight) Settings === */
	isolateGlint: false, // Whether to render special glyph highlights
	glintColor: hsl(0, 0, 1), // Pure white glint color for maximum contrast
	glintIntensity: 1, // Brightness multiplier for glint effects

	/* === 3D and Perspective === */
	volumetric: false, // Enable 3D mode with depth and perspective
	forwardSpeed: 0.25, // Speed that 3D raindrops approach the viewer

	/* === Animation and Timing === */
	animationSpeed: 1, // Global multiplier for all animation speeds
	fps: 60, // Target frame rate for smooth motion
	cycleSpeed: 0.03, // Rate at which glyphs change their symbols
	cycleFrameSkip: 1, // Minimum frames between glyph symbol changes
	baseBrightness: -0.5, // The brightness of the glyphs, before any effects are applied
	baseContrast: 1.1, // The contrast of the glyphs, before any effects are applied
	glintBrightness: -1.5, // The brightness of the glints, before any effects are applied
	glintContrast: 2.5, // The contrast of the glints, before any effects are applied
	brightnessOverride: 0.0, // A global override to the brightness of displayed glyphs. Only used if it is > 0.
	brightnessThreshold: 0, // The minimum brightness for a glyph to still be considered visible
	brightnessDecay: 1.0, // The rate at which glyphs light up and dim
	ditherMagnitude: 0.05, // The magnitude of the random per-pixel dimming
	fallSpeed: 0.3, // The speed the raindrops progress downwards
	glyphEdgeCrop: 0.0, // The border around a glyph in a font texture that should be cropped out
	glyphHeightToWidth: 1, // The aspect ratio of glyphs
	glyphVerticalSpacing: 1, // The ratio of the vertical distance between glyphs to their height
	glyphFlip: false, // Whether to horizontally reflect the glyphs
	glyphRotation: 0, // An angle to rotate the glyphs. Currently limited to 90° increments
	hasThunder: false, // An effect that adds dramatic lightning flashes
	isPolar: false, // Whether the glyphs arc across the screen or sit in a standard grid
	rippleTypeName: null, // The variety of the ripple effect
	rippleThickness: 0.2, // The thickness of the ripple effect
	rippleScale: 30, // The size of the ripple effect
	rippleSpeed: 0.2, // The rate at which the ripple effect progresses
	numColumns: 80, // The maximum dimension of the glyph grid
	density: 1, // In volumetric mode, the number of actual columns compared to the grid
	palette: [
		// The color palette that glyph brightness is color mapped to
		{ color: hsl(0.3, 0.9, 0.0), at: 0.0 },
		{ color: hsl(0.3, 0.9, 0.2), at: 0.2 },
		{ color: hsl(0.3, 0.9, 0.7), at: 0.7 },
		{ color: hsl(0.3, 0.9, 0.8), at: 0.8 },
	],
	raindropLength: 0.75, // Adjusts the frequency of raindrops (and their length) in a column
	slant: 0, // The angle at which rain falls; the orientation of the glyph grid
	resolution: 0.75, // An overall scale multiplier
	useHalfFloat: false,
	renderer: "regl", // The preferred web graphics API
	suppressWarnings: false, // Whether to show warnings to visitors on a load
	isometric: false,
	useHoloplay: false,
	loops: false,
	skipIntro: false,
	testFix: null,
	// Spotify integration settings
	spotifyEnabled: false, // Whether Spotify integration is active
	spotifyClientId: null, // Spotify application client ID
	spotifyControlsVisible: false, // Whether Spotify controls UI is visible by default
	musicSyncEnabled: false, // Whether Matrix reacts to music
	musicInfluenceColors: true, // Whether music affects the color palette
	musicInfluenceSpeed: true, // Whether music affects animation speed
	musicInfluenceBrightness: true, // Whether music affects brightness
	musicSensitivity: 1.0, // Multiplier for music influence strength (0.1 to 3.0)
	visualizerEnabled: true, // Whether to show the music visualizer minimap
	visualizerPosition: "bottom-right", // Position of the visualizer

	// Screensaver mode settings
	screensaverMode: false, // Whether to enable automatic mode switching
	modeDisplayEnabled: true, // Whether to show current mode information
	modeSwitchInterval: 600000, // Time between mode switches in milliseconds (10 minutes)
	availableModes: null, // Array of modes to cycle through (null = all modes)
	showModeInfo: true, // Whether to display the current version and effect info
};

export const versions = {
	classic: {},
	megacity: {
		font: "megacity",
		animationSpeed: 0.5,
		numColumns: 40,
	},
	neomatrixology: {
		font: "neomatrixology",
		animationSpeed: 0.8,
		numColumns: 40,
		palette: [
			{ color: hsl(0.15, 0.9, 0.0), at: 0.0 },
			{ color: hsl(0.15, 0.9, 0.2), at: 0.2 },
			{ color: hsl(0.15, 0.9, 0.7), at: 0.7 },
			{ color: hsl(0.15, 0.9, 0.8), at: 0.8 },
		],
		cursorColor: hsl(0.167, 1, 0.75),
		cursorIntensity: 2,
	},
	operator: {
		cursorColor: hsl(0.375, 1, 0.66),
		cursorIntensity: 3,
		bloomSize: 0.6,
		bloomStrength: 0.75,
		highPassThreshold: 0.0,
		cycleSpeed: 0.01,
		cycleFrameSkip: 8,
		brightnessOverride: 0.22,
		brightnessThreshold: 0,
		fallSpeed: 0.6,
		glyphEdgeCrop: 0.15,
		glyphHeightToWidth: 1.35,
		rippleTypeName: "box",
		numColumns: 108,
		palette: [
			{ color: hsl(0.4, 0.8, 0.0), at: 0.0 },
			{ color: hsl(0.4, 0.8, 0.5), at: 0.5 },
			{ color: hsl(0.4, 0.8, 1.0), at: 1.0 },
		],
		raindropLength: 1.5,
	},
	nightmare: {
		font: "gothic",
		isolateCursor: false,
		highPassThreshold: 0.7,
		baseBrightness: -0.8,
		brightnessDecay: 0.75,
		fallSpeed: 1.2,
		hasThunder: true,
		numColumns: 60,
		cycleSpeed: 0.35,
		palette: [
			{ color: hsl(0.0, 1.0, 0.0), at: 0.0 },
			{ color: hsl(0.0, 1.0, 0.2), at: 0.2 },
			{ color: hsl(0.0, 1.0, 0.4), at: 0.4 },
			{ color: hsl(0.1, 1.0, 0.7), at: 0.7 },
			{ color: hsl(0.2, 1.0, 1.0), at: 1.0 },
		],
		raindropLength: 0.5,
		slant: (22.5 * Math.PI) / 180,
	},
	paradise: {
		font: "coptic",
		isolateCursor: false,
		bloomStrength: 1,
		highPassThreshold: 0,
		cycleSpeed: 0.005,
		baseBrightness: -1.3,
		baseContrast: 2,
		brightnessDecay: 0.05,
		fallSpeed: 0.02,
		isPolar: true,
		rippleTypeName: "circle",
		rippleSpeed: 0.1,
		numColumns: 40,
		palette: [
			{ color: hsl(0.0, 0.0, 0.0), at: 0.0 },
			{ color: hsl(0.0, 0.8, 0.3), at: 0.3 },
			{ color: hsl(0.1, 0.8, 0.5), at: 0.5 },
			{ color: hsl(0.1, 1.0, 0.6), at: 0.6 },
			{ color: hsl(0.1, 1.0, 0.9), at: 0.9 },
		],
		raindropLength: 0.4,
	},
	resurrections: {
		font: "resurrections",
		glyphEdgeCrop: 0.1,
		cursorColor: hsl(0.292, 1, 0.8),
		cursorIntensity: 2,
		baseBrightness: -0.7,
		baseContrast: 1.17,
		highPassThreshold: 0,
		numColumns: 70,
		cycleSpeed: 0.03,
		bloomStrength: 0.7,
		fallSpeed: 0.3,
		palette: [
			{ color: hsl(0.375, 0.9, 0.0), at: 0.0 },
			{ color: hsl(0.375, 1.0, 0.6), at: 0.92 },
			{ color: hsl(0.375, 1.0, 1.0), at: 1.0 },
		],
	},
	trinity: {
		font: "resurrections",
		glintTexture: "metal",
		baseTexture: "pixels",
		glyphEdgeCrop: 0.1,
		cursorColor: hsl(0.292, 1, 0.8),
		cursorIntensity: 2,
		isolateGlint: true,
		glintColor: hsl(0.131, 1, 0.6),
		glintIntensity: 3,
		glintBrightness: -0.5,
		glintContrast: 1.5,
		baseBrightness: -0.4,
		baseContrast: 1.5,
		highPassThreshold: 0,
		numColumns: 60,
		cycleSpeed: 0.03,
		bloomStrength: 0.7,
		fallSpeed: 0.3,
		palette: [
			{ color: hsl(0.37, 0.6, 0.0), at: 0.0 },
			{ color: hsl(0.37, 0.6, 0.5), at: 1.0 },
		],
 		volumetric: true,
		forwardSpeed: 0.2,
		raindropLength: 0.3,
		density: 0.75,
	},
	morpheus: {
		font: "resurrections",
		glintTexture: "mesh",
		baseTexture: "metal",
		glyphEdgeCrop: 0.1,
		cursorColor: hsl(0.333, 1, 0.85),
		cursorIntensity: 2,
		isolateGlint: true,
		glintColor: hsl(0.4, 1, 0.5),
		glintIntensity: 2,
		glintBrightness: -1.5,
		glintContrast: 3,
		baseBrightness: -0.3,
		baseContrast: 1.5,
		highPassThreshold: 0,
		numColumns: 60,
 		bloomStrength: 0.7,
		fallSpeed: 0.3,
		palette: [
			{ color: hsl(0.97, 0.6, 0.0), at: 0.0 },
			{ color: hsl(0.97, 0.6, 0.5), at: 1.0 },
		],
		cycleSpeed: 0.015,
		volumetric: true,
		forwardSpeed: 0.1,
		raindropLength: 0.4,
		density: 0.75,
	},
	bugs: {
		font: "resurrections",
		glintTexture: "sand",
		baseTexture: "metal",
		glyphEdgeCrop: 0.1,
		cursorColor: hsl(0.619, 1, 0.65),
		cursorIntensity: 2,
		isolateGlint: true,
		glintColor: hsl(0.625, 1, 0.6),
		glintIntensity: 3,
		glintBrightness: -1,
		glintContrast: 3,
		baseBrightness: -0.3,
		baseContrast: 1.5,
		highPassThreshold: 0,
		numColumns: 60,
 		bloomStrength: 0.7,
		fallSpeed: 0.3,
		palette: [
			{ color: hsl(0.12, 0.6, 0.0), at: 0.0 },
			{ color: hsl(0.14, 0.6, 0.5), at: 1.0 },
		],
		cycleSpeed: 0.01,
		volumetric: true,
		forwardSpeed: 0.4,
		raindropLength: 0.3,
		density: 0.75,
	},
	palimpsest: {
		font: "huberfishA",
		isolateCursor: false,
		bloomStrength: 0.2,
		numColumns: 40,
		raindropLength: 1.2,
		cycleFrameSkip: 3,
		fallSpeed: 0.5,
		slant: Math.PI * -0.0625,
		palette: [
			{ color: hsl(0.15, 0.25, 0.9), at: 0.0 },
			{ color: hsl(0.6, 0.8, 0.1), at: 0.4 },
		],
	},
	twilight: {
		font: "huberfishD",
		cursorColor: hsl(0.167, 1, 0.8),
		cursorIntensity: 1.5,
		bloomStrength: 0.1,
		numColumns: 50,
		raindropLength: 0.9,
		fallSpeed: 0.1,
		highPassThreshold: 0.0,
		palette: [
			{ color: hsl(0.6, 1.0, 0.05), at: 0.0 },
			{ color: hsl(0.6, 0.8, 0.1), at: 0.1 },
			{ color: hsl(0.88, 0.8, 0.5), at: 0.5 },
			{ color: hsl(0.15, 1.0, 0.6), at: 0.8 },
			// { color: hsl(0.1, 1.0, 0.9), at: 1.0 },
		],
	},

	holoplay: {
		font: "resurrections",
		glintTexture: "metal",
		glyphEdgeCrop: 0.1,
		cursorColor: hsl(0.292, 1, 0.8),
		cursorIntensity: 2,
		isolateGlint: true,
		glintColor: hsl(0.131, 1, 0.6),
		glintIntensity: 3,
		glintBrightness: -0.5,
		glintContrast: 1.5,
		baseBrightness: -0.4,
		baseContrast: 1.5,
		highPassThreshold: 0,
		cycleSpeed: 0.03,
		bloomStrength: 0.7,
		fallSpeed: 0.3,
		palette: [
			{ color: hsl(0.37, 0.6, 0.0), at: 0.0 },
			{ color: hsl(0.37, 0.6, 0.5), at: 1.0 },
		],
 		raindropLength: 0.3,

		renderer: "regl",
		numColumns: 20,
		ditherMagnitude: 0,
 		volumetric: true,
		forwardSpeed: 0,
		density: 3,
		useHoloplay: true,
	},

	["3d"]: {
		volumetric: true,
		fallSpeed: 0.5,
		cycleSpeed: 0.03,
		baseBrightness: -0.9,
		baseContrast: 1.5,
		raindropLength: 0.3,
	},
};
versions.throwback = versions.operator;
versions.updated = versions.resurrections;
versions["1999"] = versions.operator;
versions["2003"] = versions.classic;
versions["2021"] = versions.resurrections;

const range = (f, min = -Infinity, max = Infinity) => Math.max(min, Math.min(max, f));
const nullNaN = (f) => (isNaN(f) ? null : f);
const isTrue = (s) => s.toLowerCase().includes("true");

const parseColor = (isHSL) => (s) => ({
	space: isHSL ? "hsl" : "rgb",
	values: s.split(",").map(parseFloat),
});

const parseColors = (isHSL) => (s) => {
	const values = s.split(",").map(parseFloat);
	const space = isHSL ? "hsl" : "rgb";
	return Array(Math.floor(values.length / 3))
		.fill(undefined, undefined, undefined)
		.map((_, index) => ({
			space,
			values: values.slice(index * 3, (index + 1) * 3),
		}));
};

const parsePalette = (isHSL) => (s) => {
	const values = s.split(",").map(parseFloat);
	const space = isHSL ? "hsl" : "rgb";
	return Array(Math.floor(values.length / 4))
		.fill(undefined, undefined, undefined)
		.map((_, index) => {
			const colorValues = values.slice(index * 4, (index + 1) * 4);
			return {
				color: {
					space,
					values: colorValues.slice(0, 3),
				},
				at: colorValues[3],
			};
		});
};

const paramMapping = {
	testFix: { key: "testFix", parser: (s) => s },
	version: { key: "version", parser: (s) => s },
	font: { key: "font", parser: (s) => s },
	effect: { key: "effect", parser: (s) => s },
	camera: { key: "useCamera", parser: isTrue },
	numColumns: { key: "numColumns", parser: (s) => nullNaN(parseInt(s)) },
	density: { key: "density", parser: (s) => nullNaN(range(parseFloat(s), 0)) },
	resolution: { key: "resolution", parser: (s) => nullNaN(parseFloat(s)) },
	animationSpeed: {
		key: "animationSpeed",
		parser: (s) => nullNaN(parseFloat(s)),
	},
	forwardSpeed: {
		key: "forwardSpeed",
		parser: (s) => nullNaN(parseFloat(s)),
	},
	cycleSpeed: { key: "cycleSpeed", parser: (s) => nullNaN(parseFloat(s)) },
	fallSpeed: { key: "fallSpeed", parser: (s) => nullNaN(parseFloat(s)) },
	raindropLength: {
		key: "raindropLength",
		parser: (s) => nullNaN(parseFloat(s)),
	},
	slant: {
		key: "slant",
		parser: (s) => nullNaN((parseFloat(s) * Math.PI) / 180),
	},
	bloomSize: {
		key: "bloomSize",
		parser: (s) => nullNaN(range(parseFloat(s), 0, 1)),
	},
	bloomStrength: {
		key: "bloomStrength",
		parser: (s) => nullNaN(range(parseFloat(s), 0, 1)),
	},
	ditherMagnitude: {
		key: "ditherMagnitude",
		parser: (s) => nullNaN(range(parseFloat(s), 0, 1)),
	},
	url: { key: "bgURL", parser: (s) => s },
	palette: { key: "palette", parser: parsePalette(false) },
	stripeColors: { key: "stripeColors", parser: parseColors(false) },
	backgroundColor: { key: "backgroundColor", parser: parseColor(false) },
	cursorColor: { key: "cursorColor", parser: parseColor(false) },
	glintColor: { key: "glintColor", parser: parseColor(false) },

	paletteHSL: { key: "palette", parser: parsePalette(true) },
	stripeHSL: { key: "stripeColors", parser: parseColors(true) },
	backgroundHSL: { key: "backgroundColor", parser: parseColor(true) },
	cursorHSL: { key: "cursorColor", parser: parseColor(true) },
	glintHSL: { key: "glintColor", parser: parseColor(true) },

	cursorIntensity: {
		key: "cursorIntensity",
		parser: (s) => nullNaN(range(parseFloat(s), 0, Infinity)),
	},

	glyphIntensity: {
		key: "glyphIntensity",
		parser: (s) => nullNaN(range(parseFloat(s), 0, Infinity)),
	},

	volumetric: { key: "volumetric", parser: isTrue },
	glyphFlip: { key: "glyphFlip", parser: isTrue },
	glyphRotation: {
		key: "glyphRotation",
		parser: (s) => nullNaN(range(parseFloat(s), 0, Infinity)),
	},
	loops: { key: "loops", parser: isTrue },
	fps: { key: "fps", parser: (s) => nullNaN(range(parseFloat(s), 0, 60)) },
	skipIntro: { key: "skipIntro", parser: isTrue },
	renderer: { key: "renderer", parser: (s) => s },
	suppressWarnings: { key: "suppressWarnings", parser: isTrue },
	once: { key: "once", parser: isTrue },
	isometric: { key: "isometric", parser: isTrue },
	// Spotify integration parameters
	spotifyEnabled: { key: "spotifyEnabled", parser: isTrue },
	spotifyClientId: { key: "spotifyClientId", parser: (s) => s },
	spotifyControls: { key: "spotifyControlsVisible", parser: isTrue },
	musicSync: { key: "musicSyncEnabled", parser: isTrue },
	musicColors: { key: "musicInfluenceColors", parser: isTrue },
	musicSpeed: { key: "musicInfluenceSpeed", parser: isTrue },
	musicBrightness: { key: "musicInfluenceBrightness", parser: isTrue },
	musicSensitivity: { key: "musicSensitivity", parser: (s) => nullNaN(range(parseFloat(s), 0.1, 3.0)) },
	visualizer: { key: "visualizerEnabled", parser: isTrue },
	visualizerPos: { key: "visualizerPosition", parser: (s) => s },

	// Screensaver mode parameters
	screensaver: { key: "screensaverMode", parser: isTrue },
	modeDisplay: { key: "modeDisplayEnabled", parser: isTrue },
	switchInterval: { key: "modeSwitchInterval", parser: (s) => nullNaN(Math.max(60000, parseInt(s))) }, // Minimum 1 minute
	showModeInfo: { key: "showModeInfo", parser: isTrue },
};

paramMapping.paletteRGB = paramMapping.palette;
paramMapping.stripeRGB = paramMapping.stripeColors;
paramMapping.backgroundRGB = paramMapping.backgroundColor;
paramMapping.cursorRGB = paramMapping.cursorColor;
paramMapping.glintRGB = paramMapping.glintColor;

paramMapping.width = paramMapping.numColumns;
paramMapping.dropLength = paramMapping.raindropLength;
paramMapping.angle = paramMapping.slant;
paramMapping.colors = paramMapping.stripeColors;

export default (urlParams) => {
	const validParams = Object.fromEntries(
		Object.entries(urlParams)
			.filter(([key]) => key in paramMapping)
			.map(([key, value]) => [paramMapping[key].key, paramMapping[key].parser(value)])
			.filter(([_, value]) => value != null),
	);

	if (validParams.effect != null) {
		if (validParams.cursorColor == null) {
			validParams.cursorColor = hsl(0, 0, 1);
		}

		if (validParams.cursorIntensity == null) {
			validParams.cursorIntensity = 2;
		}

		if (validParams.glintColor == null) {
			validParams.glintColor = hsl(0, 0, 1);
		}

		if (validParams.glyphIntensity == null) {
			validParams.glyphIntensity = 1;
		}
	}

	const version = validParams.version in versions ? versions[validParams.version] : versions.updated;
	const fontName = [validParams.font, version.font, defaults.font].find((name) => name in fonts);
	const font = fonts[fontName];

	const baseTextureURL = textureURLs[[version.baseTexture, defaults.baseTexture].find((name) => name in textureURLs)];
	const hasBaseTexture = baseTextureURL != null;
	const glintTextureURL = textureURLs[[version.glintTexture, defaults.glintTexture].find((name) => name in textureURLs)];
	const hasGlintTexture = glintTextureURL != null;

	const config = {
		...defaults,
		...version,
		...font,
		...validParams,
		baseTextureURL,
		glintTextureURL,
		hasBaseTexture,
		hasGlintTexture,
	};

	if (config.bloomSize <= 0) {
		config.bloomStrength = 0;
	}

	return config;
};
