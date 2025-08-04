import makeConfig from "./config.js";
import SpotifyIntegration from "./spotify.js";
import MusicVisualizer from "./visualizer.js";
import SpotifyUI from "./spotify-ui.js";
import MusicIntegration from "./music-integration.js";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
document.addEventListener("touchmove", (e) => e.preventDefault(), {
	passive: false,
});

// Initialize Spotify integration
let spotifyIntegration = null;
let musicVisualizer = null;
let spotifyUI = null;
let musicIntegration = null;

const supportsWebGPU = async () => {
	return window.GPUQueue != null && navigator.gpu != null && navigator.gpu.getPreferredCanvasFormat != null;
};

const isRunningSwiftShader = () => {
	const gl = document.createElement("canvas").getContext("webgl");
	const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
	const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
	return renderer.toLowerCase().includes("swiftshader");
};

document.body.onload = async () => {
	const urlParams = new URLSearchParams(window.location.search);
	const config = makeConfig(Object.fromEntries(urlParams.entries()));
	const useWebGPU = (await supportsWebGPU()) && ["webgpu"].includes(config.renderer?.toLowerCase());
	const solution = import(`./${useWebGPU ? "webgpu" : "regl"}/main.js`);

	// Initialize Spotify integration if enabled
	initializeSpotifyIntegration(config);

	if (isRunningSwiftShader() && !config.suppressWarnings) {
		const notice = document.createElement("notice");
		notice.innerHTML = `<div class="notice">
		<p>Wake up, Neo... you've got hardware acceleration disabled.</p>
		<p>This project will still run, incredibly, but at a noticeably low framerate.</p>
		<button class="blue pill">Plug me in</button>
		<a class="red pill" target="_blank" href="https://www.google.com/search?q=chrome+enable+hardware+acceleration">Free me</a>
		`;
		canvas.style.display = "none";
		document.body.appendChild(notice);
		document.querySelector(".blue.pill").addEventListener("click", async () => {
			config.suppressWarnings = true;
			urlParams.set("suppressWarnings", true);
			history.replaceState({}, "", "?" + unescape(urlParams.toString()));
			const matrixRenderer = await solution;
			startMatrix(matrixRenderer, canvas, config);
			canvas.style.display = "unset";
			document.body.removeChild(notice);
		});
	} else {
		const matrixRenderer = await solution;
		startMatrix(matrixRenderer, canvas, config);
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
	
	// Initialize with saved settings
	const uiConfig = spotifyUI.getConfig();
	if (uiConfig.musicSyncEnabled) {
		musicIntegration.activate();
	}
	if (!uiConfig.visualizerEnabled) {
		musicVisualizer.hide();
	}
}

/**
 * Set up Spotify event listeners
 */
function setupSpotifyEventListeners(config) {
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
			} else {
				musicIntegration.deactivate();
			}
		}
	});
	
	spotifyUI.on('visualizerToggle', (enabled) => {
		// Handled by SpotifyUI directly
	});
}

/**
 * Start the Matrix renderer with music integration
 */
function startMatrix(matrixRenderer, canvas, config) {
	// Create a wrapper that can provide modified config based on music
	const getConfig = () => {
		if (musicIntegration && musicIntegration.isActive) {
			return musicIntegration.getModifiedConfig();
		}
		return config;
	};
	
	// Start the Matrix renderer
	matrixRenderer.default(canvas, getConfig());
}
