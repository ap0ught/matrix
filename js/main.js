import makeConfig from "./config.js";
import SpotifyIntegration from "./spotify.js";
import MusicVisualizer from "./visualizer.js";
import SpotifyUI from "./spotify-ui.js";
import MusicIntegration from "./music-integration.js";

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
	const styleElement = document.createElement('style');
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
let musicVisualizer = null;
let spotifyUI = null;
let musicIntegration = null;
let matrixConfig = null;

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

	if (isRunningSwiftShader() && !matrixConfig.suppressWarnings) {
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
			const matrixRenderer = await solution;
			startMatrix(matrixRenderer, canvas, matrixConfig);
			canvas.style.display = "unset";
			document.body.removeChild(notice);
		});
	} else {
		/*
		 * Direct Matrix Entry
		 * Hardware acceleration is available or warnings are suppressed.
		 * Initialize the chosen rendering solution immediately.
		 */
		const matrixRenderer = await solution;
		startMatrix(matrixRenderer, canvas, matrixConfig);
	}
};

/**
 * Initialize Spotify integration components
 */
function initializeSpotifyIntegration(config) {
	// Create Spotify integration instance
	spotifyIntegration = new SpotifyIntegration();

	// Create music integration for modifying Matrix parameters
	musicIntegration = new MusicIntegration({
		influenceColors: config.musicInfluenceColors,
		influenceSpeed: config.musicInfluenceSpeed,
		influenceBrightness: config.musicInfluenceBrightness,
		sensitivity: config.musicSensitivity
	});
	musicIntegration.setBaseConfig(config);

	// Create music visualizer
	musicVisualizer = new MusicVisualizer(document.body, {
		position: config.visualizerPosition
	});

	// Create UI controls
	spotifyUI = new SpotifyUI({
		clientId: config.spotifyClientId
	});
	spotifyUI.setSpotifyIntegration(spotifyIntegration);
	spotifyUI.setVisualizer(musicVisualizer);

	// Set up event listeners
	setupSpotifyEventListeners(config);

	// Initialize Spotify with client ID if available
	if (config.spotifyClientId) {
		spotifyIntegration.init(config.spotifyClientId);
	}

	// Initialize with saved settings
	const uiConfig = spotifyUI.getConfig();
	if (uiConfig.musicSyncEnabled) {
		musicIntegration.activate();
	}
	if (!uiConfig.visualizerEnabled) {
		musicVisualizer.hide();
	}

	// Set up regular config updates based on music (only if music sync is enabled)
	if (uiConfig.musicSyncEnabled) {
		window.musicUpdateInterval = setInterval(updateMatrixConfigFromMusic, 100); // Update 10 times per second
	}
}
/**
 * Set up Spotify event listeners
 */
/**
 * Set up Spotify event listeners
 */
function setupSpotifyEventListeners() {
	// Track changes
	spotifyIntegration.on('trackChange', (data) => {
		if (data) {
			musicVisualizer.updateTrackInfo(data.track);
			musicVisualizer.updateAudioFeatures(data.audioFeatures);
			musicIntegration.updateTrackInfo(data.track);
			musicIntegration.updateAudioFeatures(data.audioFeatures);
			spotifyUI.updateCurrentTrack(data.track);
		} else {
			musicVisualizer.hide();
			musicIntegration.updateTrackInfo(null);
			musicIntegration.updateAudioFeatures(null);
		}
	});

	// Authentication changes
	spotifyIntegration.on('authChange', (isAuthenticated) => {
		console.log('Spotify authentication changed:', isAuthenticated);

		// Enable/disable visualizer toggle based on authentication
		if (isAuthenticated) {
			spotifyUI.enableVisualizerToggle();
		} else {
			spotifyUI.disableVisualizerToggle();
		}
	});

	// Errors
	spotifyIntegration.on('error', (error) => {
		console.error('Spotify error:', error);
	});

	// UI events
	spotifyUI.on('clientIdChange', (clientId) => {
		if (spotifyIntegration) {
			spotifyIntegration.init(clientId);
		}
	});

	spotifyUI.on('toggleMusicSync', (enabled) => {
		if (musicIntegration) {
			if (enabled) {
				musicIntegration.activate();
				// Start updating config based on music
				if (!window.musicUpdateInterval) {
					window.musicUpdateInterval = setInterval(updateMatrixConfigFromMusic, 100);
				}
			} else {
				musicIntegration.deactivate();
				// Stop updating config
				if (window.musicUpdateInterval) {
					clearInterval(window.musicUpdateInterval);
					window.musicUpdateInterval = null;
				}
			}
		}
	});

	spotifyUI.on('visualizerToggle', (enabled) => {
		if (musicVisualizer) {
			if (enabled) {
				musicVisualizer.show();
			} else {
				musicVisualizer.hide();
			}
		}
	});
}
/**
 * Update Matrix configuration based on music data
 */
function updateMatrixConfigFromMusic() {
	if (!musicIntegration || !musicIntegration.isActive || !matrixConfig) {
		return;
	}

	const modifiedConfig = musicIntegration.getModifiedConfig();

	// Update only the properties that can change dynamically
	const dynamicProperties = [
		'animationSpeed', 'fallSpeed', 'cycleSpeed',
		'baseBrightness', 'cursorIntensity', 'bloomStrength',
		'palette', 'cursorColor', 'raindropLength'
	];

	dynamicProperties.forEach(prop => {
		if (modifiedConfig[prop] !== undefined) {
			matrixConfig[prop] = modifiedConfig[prop];
		}
	});
}

/**
 * Start the Matrix renderer with music integration
 */
function startMatrix(matrixRenderer, canvas, config) {
	// Start the Matrix renderer
	matrixRenderer.default(canvas, config);
}