import makeConfig from "./config.js";
import SpotifyIntegration from "./spotify.js";
import SpotifyUI from "./spotify-ui.js";
import ModeManager from "./mode-manager.js";
import ModeDisplay from "./mode-display.js";
import GalleryManager, { buildGalleryURL } from "./gallery.js";

/*
 * Matrix Digital Rain - Main Entry Point
 *
 * This is the primary application bootstrap that initializes the Matrix
 * digital rain effect. It handles renderer selection between WebGL and WebGPU,
 * detects software rendering fallbacks, and presents Matrix-themed warnings.
 */

/*
 * Dynamic CSS Styles for Matrix Warning Interface
 *
 * These styles are injected when the SwiftShader warning is displayed,
 * creating the iconic Matrix choice between blue pill and red pill.
 */
const matrixWarningStyles = `
	.notice {
		margin-top: 10em;
		animation: fadeInAnimation ease 3s;
		animation-iteration-count: 1;
		animation-fill-mode: forwards;
	}

	@keyframes fadeInAnimation {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}

	.pill {
		display: inline-block;
		background: gray;
		border: 0.3em solid lightgray;
		font-size: 1rem;
		font-family: monospace;
		color: white;
		padding: 0.5em 1em;
		border-radius: 2em;
		min-width: 6rem;
		margin: 3em;
		text-decoration: none;
		cursor: pointer;
		text-transform: uppercase;
		font-weight: bold;
	}

	.blue {
		background: linear-gradient(skyblue, blue, black, black, darkblue);
		border-color: darkblue;
		color: lightblue;
	}

	.blue:hover {
		border-color: blue;
		color: white;
	}

	.red {
		background: linear-gradient(lightpink, crimson, black, black, darkred);
		border-color: darkred;
		color: lightpink;
	}

	.red:hover {
		border-color: crimson;
		color: white;
	}
`;

/*
 * Inject Matrix Warning Styles
 *
 * Creates and injects the CSS styles needed for the Matrix choice interface.
 * This approach keeps the styles with the code that uses them.
 */
function injectMatrixWarningStyles() {
	const styleElement = document.createElement("style");
	styleElement.textContent = matrixWarningStyles;
	document.head.appendChild(styleElement);
}

/*
 * Initialize the main rendering canvas
 * Creates a full-screen canvas element that will display the Matrix effect
 */
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

/*
 * Prevent scrolling on touch devices during Matrix experience
 * Touch movements could interfere with the immersive digital rain effect
 */
document.addEventListener("touchmove", (e) => e.preventDefault(), {
	passive: false,
});

/*
 * WebGPU Capability Detection
 *
 * WebGPU is the next-generation graphics API that provides better performance
 * and more modern features compared to WebGL. This function checks if the
 * browser supports the required WebGPU interfaces for our Matrix rendering.
 *
 * @returns {Promise<boolean>} True if WebGPU is fully supported
 */
// Initialize Spotify integration
let spotifyIntegration = null;
let spotifyUI = null;
let matrixConfig = null;
let modeManager = null;
let modeDisplay = null;
let currentMatrixRenderer = null;
let galleryManager = null;

const supportsWebGPU = async () => {
	return window.GPUQueue != null && navigator.gpu != null && navigator.gpu.getPreferredCanvasFormat != null;
};

/*
 * SwiftShader Software Renderer Detection
 *
 * SwiftShader is Chrome's software fallback renderer used when hardware
 * acceleration is disabled. While it can run WebGL applications, performance
 * is significantly reduced. This detection helps us warn users about the
 * "blue pill" of disabled hardware acceleration versus the "red pill" of
 * optimal performance.
 *
 * @returns {boolean} True if running on SwiftShader software renderer
 */
const isRunningSwiftShader = () => {
	const gl = document.createElement("canvas").getContext("webgl");
	const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
	const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
	return renderer.toLowerCase().includes("swiftshader");
};

/*
 * Matrix Initialization Sequence
 *
 * Once the page loads, we begin the sequence to enter the Matrix. This involves:
 * 1. Parsing URL parameters for customization (like choosing red pill options)
 * 2. Determining the optimal rendering path (WebGPU vs WebGL)
 * 3. Checking for performance limitations (SwiftShader detection)
 * 4. Presenting the iconic choice between blue pill (accept limitations)
 *    and red pill (optimize for truth/performance)
 */
document.body.onload = async () => {
	/*
	 * Configuration Parsing
	 * URL parameters allow users to customize their Matrix experience,
	 * from choosing different versions (classic, resurrections, etc.)
	 * to adjusting visual effects and performance settings
	 */
	const urlParams = new URLSearchParams(window.location.search);
	matrixConfig = makeConfig(Object.fromEntries(urlParams.entries()));

	/*
	 * Gallery Mode Detection
	 * If the effect is set to "gallery", initialize the gallery slideshow
	 * instead of the normal Matrix rendering
	 */
	if (matrixConfig.effect === "gallery") {
		await initializeGalleryMode();
		return;
	}

	/*
	 * Renderer Selection Logic
	 * Choose between WebGPU (cutting-edge) and WebGL (widely supported)
	 * WebGPU provides better performance and more advanced features,
	 * but WebGL ensures broader browser compatibility
	 */
	const useWebGPU = (await supportsWebGPU()) && ["webgpu"].includes(matrixConfig.renderer?.toLowerCase());
	const solution = import(`./${useWebGPU ? "webgpu" : "regl"}/main.js`);

	/*
	 * The Matrix Choice: Blue Pill vs Red Pill
	 *
	 * If hardware acceleration is disabled (SwiftShader detected), we present
	 * the user with a Matrix-themed choice:
	 * - Blue Pill: Accept the performance limitations and continue
	 * - Red Pill: Learn how to enable hardware acceleration for optimal experience
	 *
	 * This mirrors the film's central metaphor about choosing between
	 * comfortable ignorance and enlightening truth.
	 */
	// Initialize Spotify integration if enabled
	initializeSpotifyIntegration(matrixConfig);

	// Initialize mode management and display
	initializeModeManagement(matrixConfig);

	if (!matrixConfig.suppressWarnings && isRunningSwiftShader()) {
		// Inject the styles needed for the Matrix warning interface
		injectMatrixWarningStyles();

		const notice = document.createElement("notice");
		notice.innerHTML = `<div class="notice">
		<p>Wake up, Neo... you've got hardware acceleration disabled.</p>
		<p>This project will still run, incredibly, but at a noticeably low framerate.</p>
		<button class="blue pill">Plug me in</button>
		<a class="red pill" target="_blank" href="https://www.google.com/search?q=chrome+enable+hardware+acceleration">Free me</a>
		`;
		canvas.style.display = "none";
		document.body.appendChild(notice);

		/*
		 * Blue Pill Handler
		 * User chooses to continue with software rendering despite limitations.
		 * We suppress further warnings and proceed with the Matrix experience.
		 */
		document.querySelector(".blue.pill").addEventListener("click", async () => {
			matrixConfig.suppressWarnings = true;
			urlParams.set("suppressWarnings", true);
			history.replaceState({}, "", "?" + unescape(urlParams.toString()));
			currentMatrixRenderer = await solution;
			startMatrix(currentMatrixRenderer, canvas, matrixConfig);
			canvas.style.display = "unset";
			document.body.removeChild(notice);
		});
	} else {
		/*
		 * Direct Matrix Entry
		 * Hardware acceleration is available or warnings are suppressed.
		 * Initialize the chosen rendering solution immediately.
		 */
		currentMatrixRenderer = await solution;
		startMatrix(currentMatrixRenderer, canvas, matrixConfig);
	}
};

/**
 * Initialize mode management and display components
 */
function initializeModeManagement(config) {
	// Create mode manager
	modeManager = new ModeManager(config);

	// Create mode display
	modeDisplay = new ModeDisplay({
		position: "top-right",
		autoHide: true,
		autoHideDelay: 5000,
		showControls: true,
	});

	// Connect mode display to mode manager
	modeDisplay.setModeManager(modeManager);

	// Set initial toggle states
	modeDisplay.setToggleStates(config.screensaverMode || false, config.spotifyControlsVisible || false, config.modeSwitchInterval || 600000);

	// Set up event listeners
	setupModeManagementEvents(config);

	// Start screensaver mode if enabled in config
	if (config.screensaverMode) {
		modeManager.start();
	}
}

/**
 * Set up mode management event listeners
 */
function setupModeManagementEvents(config) {
	// Mode display events
	modeDisplay.on("toggleScreensaver", (enabled) => {
		config.screensaverMode = enabled;
		if (enabled) {
			modeManager.start();
		} else {
			modeManager.stop();
		}
	});

	modeDisplay.on("toggleSpotifyControls", (visible) => {
		config.spotifyControlsVisible = visible;
		if (spotifyUI) {
			if (visible) {
				spotifyUI.show();
			} else {
				spotifyUI.hide();
			}
		}
	});

	modeDisplay.on("changeSwitchInterval", (interval) => {
		config.modeSwitchInterval = interval;
		if (modeManager) {
			modeManager.updateInterval(interval);
		}
	});

	// Mode manager events
	modeManager.on("modeChange", (modeChangeData) => {
		// Update the URL parameters and reload the configuration
		const urlParams = new URLSearchParams(window.location.search);
		urlParams.set("version", modeChangeData.version);
		urlParams.set("effect", modeChangeData.effect);

		if (modeChangeData.isManual) {
			// For manual mode switches (via "Switch Mode Now" button), reload the page
			// to ensure the new configuration is fully applied
			window.location.search = urlParams.toString();
		} else {
			// For automatic mode switches (screensaver), update URL and try in-place update
			history.replaceState({}, "", "?" + urlParams.toString());

			// Update the configuration and restart the renderer
			const newConfig = makeConfig(Object.fromEntries(urlParams.entries()));
			restartMatrixWithNewConfig(newConfig);
		}
	});
}

/**
 * Restart the Matrix renderer with new configuration
 */
async function restartMatrixWithNewConfig(newConfig) {
	if (!currentMatrixRenderer) return;

	// Update the global config
	Object.assign(matrixConfig, newConfig);

	// The Matrix renderer should automatically pick up the config changes
	// Most Matrix implementations are designed to be reactive to config changes
	// Try to update the renderer's config directly, if supported
	if (typeof currentMatrixRenderer.updateConfig === "function") {
		currentMatrixRenderer.updateConfig(newConfig);
	}
	// Note: Fallback path removed as Matrix renderers are reactive to config changes
	// Note: Fallback path removed as Matrix renderers are reactive to config changes.
	// If the renderer does not support updateConfig(), it is assumed to automatically
	// pick up changes from the global config object (matrixConfig). If this is not the case,
	// you may need to implement additional logic to handle config updates for such renderers.

	console.log(`Matrix restarted with: ${newConfig.version || "default"} + ${newConfig.effect || "default"}`);
}

/**
 * Initialize Spotify integration components
 */
function initializeSpotifyIntegration(config) {
	// Create Spotify integration instance
	spotifyIntegration = new SpotifyIntegration();

	// Create UI controls
	spotifyUI = new SpotifyUI({
		clientId: config.spotifyClientId,
		visible: config.spotifyControlsVisible,
	});
	spotifyUI.setSpotifyIntegration(spotifyIntegration);

	// Set up event listeners
	setupSpotifyEventListeners(config);

	// Initialize Spotify with client ID if available
	if (config.spotifyClientId) {
		spotifyIntegration.init(config.spotifyClientId);
	}
}
/**
 * Set up Spotify event listeners
 */
function setupSpotifyEventListeners() {
	// Track changes
	spotifyIntegration.on("trackChange", (data) => {
		if (data) {
			spotifyUI.updateCurrentTrack(data.track);
		}
	});

	// Authentication changes
	spotifyIntegration.on("authChange", (isAuthenticated) => {
		console.log("Spotify authentication changed:", isAuthenticated);
	});

	// Errors
	spotifyIntegration.on("error", (error) => {
		console.error("Spotify error:", error);
	});

	// UI events
	spotifyUI.on("clientIdChange", (clientId) => {
		if (spotifyIntegration) {
			spotifyIntegration.init(clientId);
		}
	});
}

/**
 * Start the Matrix renderer
 */
function startMatrix(matrixRenderer, canvas, config) {
	// Start the Matrix renderer
	matrixRenderer.default(canvas, config);
}

/**
 * Initialize Gallery Mode
 * Creates a slideshow of different Matrix shader configurations
 * Following the new architecture with fortune screens and smart screenshot generation
 */
async function initializeGalleryMode() {
	// Create gallery manager with configuration
	galleryManager = new GalleryManager(matrixConfig);

	// Set up event listeners
	galleryManager.on("itemChange", async ({ item, index }) => {
		// Update URL without reloading
		const url = buildGalleryURL(item);
		const params = new URLSearchParams(url.substring(1)); // Remove leading ?
		// Note: We don't set effect=gallery here because gallery state is managed by galleryManager
		// Setting it would override the actual effect (rainbow, palette, etc.) from the gallery item
		history.replaceState({}, "", "?" + params.toString());

		// Update configuration and restart renderer
		const newConfig = makeConfig(Object.fromEntries(params.entries()));

		// Initialize renderer if not yet started
		if (!currentMatrixRenderer) {
			const useWebGPU = (await supportsWebGPU()) && ["webgpu"].includes(newConfig.renderer?.toLowerCase());
			const solution = await import(`./${useWebGPU ? "webgpu" : "regl"}/main.js`);
			currentMatrixRenderer = solution;
			startMatrix(currentMatrixRenderer, canvas, newConfig);
		} else {
			await restartMatrixWithNewConfig(newConfig);
		}
	});

	galleryManager.on("screenshotCapture", ({ item, duration }) => {
		console.log(`Capturing screenshot for ${item.title} (${duration}ms)`);
	});

	galleryManager.on("playlistComplete", () => {
		console.log("Playlist complete - generating new playlist");
	});

	// Start the gallery
	galleryManager.start();
}
