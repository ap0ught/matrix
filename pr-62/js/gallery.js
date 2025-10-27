/**
 * Matrix Gallery Manager
 *
 * "I can only show you the door. You're the one that has to walk through it."
 *
 * Handles automatic cycling through Matrix shader configurations with:
 * - Fortune cookie title screens
 * - Smart screenshot generation (12s capture if missing)
 * - Random playlist system
 * - Collapsible playlist menu with thumbnails
 * - 42 second intervals between shaders
 */

import { versions } from "./config.js";

/**
 * Matrix fortunes for title screens
 * "The Oracle" - mysterious prophetic messages
 */
const MATRIX_FORTUNES = [
	"Wake up, Neo...",
	"The Matrix has you",
	"Follow the white rabbit",
	"Knock, knock, Neo",
	"Free your mind",
	"There is no spoon",
	"I know kung fu",
	"Show me",
	"Welcome to the real world",
	"Dodge this",
	"What is real?",
	"Choice. The problem is choice",
	"Everything that has a beginning has an end",
	"I can only show you the door",
	"The answer is out there, Neo",
	"Fate, it seems, is not without a sense of irony",
	"This is your last chance",
	"You take the blue pill, the story ends",
	"You take the red pill, you stay in Wonderland",
	"The Matrix is everywhere",
	"The desert of the real",
	"Guns. Lots of guns",
	"Do not try and bend the spoon",
	"Unfortunately, no one can be told what the Matrix is",
	"You've been living in a dream world, Neo",
	"The Matrix is a system, Neo",
];

/**
 * Gallery configuration - defines all the shader variations to showcase
 * Each entry specifies a unique combination of version, effect, and parameters
 * The filename must match the screenshots in the gallery/ directory
 */
export const galleryItems = [
	{
		title: "Classic Matrix",
		description: "The iconic green code rain from the original trilogy",
		filename: "classic-matrix.png",
		config: {
			version: "classic",
			effect: "palette",
		},
	},
	{
		title: "Matrix Resurrections",
		description: "Updated glyphs from the 2021 film",
		filename: "resurrections.png",
		config: {
			version: "resurrections",
			effect: "palette",
		},
	},
	{
		title: "3D Volumetric Mode",
		description: "Glyphs falling through three-dimensional space",
		filename: "3d-volumetric.png",
		config: {
			version: "3d",
			effect: "palette",
		},
	},
	{
		title: "Operator Console",
		description: "Flat, crowded Matrix code as seen on operators' screens",
		filename: "operator.png",
		config: {
			version: "operator",
			effect: "palette",
		},
	},
	{
		title: "Nightmare Matrix",
		description: "The harsh, Hobbesian predecessor Matrix",
		filename: "nightmare.png",
		config: {
			version: "nightmare",
			effect: "palette",
		},
	},
	{
		title: "Paradise Matrix",
		description: "The idyllic but flawed predecessor",
		filename: "paradise.png",
		config: {
			version: "paradise",
			effect: "palette",
		},
	},
	{
		title: "Rainbow Spectrum",
		description: "Colorful variation with rainbow gradients",
		filename: "rainbow.png",
		config: {
			version: "classic",
			effect: "rainbow",
		},
	},
	{
		title: "Light Spectrum",
		description: "Physics-inspired color gradients",
		filename: "spectrum.png",
		config: {
			version: "classic",
			effect: "spectrum",
		},
	},
	{
		title: "Custom Stripes (RGB)",
		description: "Red, orange, yellow, and green vertical bands",
		filename: "stripes-rgb.png",
		config: {
			version: "classic",
			effect: "stripes",
			stripeColors: "1,0,0,1,1,0,0,1,0",
		},
	},
	{
		title: "Trinity Mode",
		description: "Dedicated to the One who believed",
		filename: "trinity.png",
		config: {
			version: "trinity",
			effect: "palette",
		},
	},
	{
		title: "Morpheus Mode",
		description: "What if I told you... this was another Matrix variant",
		filename: "morpheus.png",
		config: {
			version: "morpheus",
			effect: "palette",
		},
	},
	{
		title: "Megacity",
		description: "As seen in the opening of Revolutions",
		filename: "megacity.png",
		config: {
			version: "megacity",
			effect: "palette",
		},
	},
	{
		title: "Palimpsest",
		description: "Custom variant inspired by Rob Dougan's Furious Angels",
		filename: "palimpsest.png",
		config: {
			version: "palimpsest",
			effect: "palette",
		},
	},
	{
		title: "Twilight",
		description: "A mysterious custom variant",
		filename: "twilight.png",
		config: {
			version: "twilight",
			effect: "palette",
		},
	},
	{
		title: "Debug View",
		description: "Behind-the-scenes computational visualization",
		filename: "debug.png",
		config: {
			version: "classic",
			effect: "none",
		},
	},
];

/**
 * Gallery Manager
 * Handles automatic cycling through Matrix shader configurations
 * Following the ModeManager pattern for consistency
 */
export default class GalleryManager {
	constructor(config = {}) {
		this.config = config;
		this.isActive = false;
		this.currentPlaylist = [];
		this.currentIndex = 0;
		this.switchTimer = null;
		this.screenshotTimer = null;
		this.isCapturingScreenshot = false;
		this.showingFortune = false;
		this.callbacks = {
			itemChange: [],
			screenshotCapture: [],
			playlistComplete: [],
		};

		// UI elements
		this.fortuneOverlay = null;
		this.playlistMenu = null;
		this.infoOverlay = null;

		// Timing constants (in milliseconds), configurable via URL parameters
		this.FORTUNE_DURATION = typeof config.fortuneDuration === "number" ? config.fortuneDuration : 3000; // 3 seconds, override with ?fortuneDuration=5000
		this.SHADER_DISPLAY_DURATION = typeof config.shaderDisplayDuration === "number" ? config.shaderDisplayDuration : 42000; // 42 seconds, override with ?shaderDisplayDuration=60000
		this.SCREENSHOT_CAPTURE_DURATION = typeof config.screenshotCaptureDuration === "number" ? config.screenshotCaptureDuration : 12000; // 12 seconds, override with ?screenshotCaptureDuration=15000
	}

	/**
	 * Start the gallery
	 */
	start() {
		if (this.isActive) {
			return;
		}

		this.isActive = true;
		this.generateNewPlaylist();
		this.createUI();
		this.showFortune(() => {
			this.showNextItem();
		});
		console.log("Matrix gallery mode started");
	}

	/**
	 * Stop the gallery
	 */
	stop() {
		if (!this.isActive) {
			return;
		}

		this.isActive = false;
		if (this.switchTimer) {
			clearTimeout(this.switchTimer);
			this.switchTimer = null;
		}
		if (this.screenshotTimer) {
			clearTimeout(this.screenshotTimer);
			this.screenshotTimer = null;
		}
		this.removeUI();
		console.log("Matrix gallery mode stopped");
	}

	/**
	 * Generate a new random playlist
	 */
	generateNewPlaylist() {
		// Create a shuffled copy of gallery items
		this.currentPlaylist = [...galleryItems]
			.map((item) => ({ item, sort: Math.random() }))
			.sort((a, b) => a.sort - b.sort)
			.map(({ item }) => item);

		this.currentIndex = 0;
		console.log("New playlist generated with", this.currentPlaylist.length, "items");
		this.updatePlaylistUI();
	}

	/**
	 * Show a fortune cookie screen
	 */
	showFortune(callback) {
		this.showingFortune = true;
		const fortune = MATRIX_FORTUNES[Math.floor(Math.random() * MATRIX_FORTUNES.length)];

		if (!this.fortuneOverlay) {
			this.fortuneOverlay = document.createElement("div");
			this.fortuneOverlay.id = "gallery-fortune";
			this.fortuneOverlay.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0, 0, 0, 0.95);
				color: #00ff41;
				display: flex;
				align-items: center;
				justify-content: center;
				font-family: 'Courier New', monospace;
				font-size: 32px;
				text-align: center;
				z-index: 20000;
				padding: 40px;
				animation: fadeIn 0.5s ease-in;
			`;
			document.body.appendChild(this.fortuneOverlay);
		}

		this.fortuneOverlay.textContent = fortune;
		this.fortuneOverlay.style.display = "flex";

		setTimeout(() => {
			if (this.fortuneOverlay) {
				this.fortuneOverlay.style.display = "none";
			}
			this.showingFortune = false;
			if (callback) callback();
		}, this.FORTUNE_DURATION);
	}

	/**
	 * Show the next item in the playlist
	 */
	async showNextItem() {
		if (!this.isActive) return;

		// Check if playlist is complete
		if (this.currentIndex >= this.currentPlaylist.length) {
			this.emit("playlistComplete");
			this.generateNewPlaylist();
			this.showFortune(() => {
				this.showNextItem();
			});
			return;
		}

		const item = this.currentPlaylist[this.currentIndex];
		const screenshotPath = this.getScreenshotPath(item);

		// Check if screenshot exists
		const exists = await this.checkScreenshotExists(screenshotPath);
		if (!exists) {
			// Need to capture screenshot
			this.captureScreenshot(item, () => {
				this.scheduleNextItem();
			});
		} else {
			// Screenshot exists, just display
			this.displayItem(item);
			this.scheduleNextItem();
		}
	}

	/**
	 * Display a gallery item
	 */
	displayItem(item) {
		this.emit("itemChange", { item, index: this.currentIndex });
		this.updateInfoOverlay(item);
		this.updatePlaylistUI();
	}

	/**
	 * Capture screenshot for an item
	 */
	captureScreenshot(item, callback) {
		this.isCapturingScreenshot = true;
		this.emit("screenshotCapture", { item, duration: this.SCREENSHOT_CAPTURE_DURATION });

		// Display the shader
		this.displayItem(item);

		// Wait for screenshot duration, then capture
		this.screenshotTimer = setTimeout(() => {
			console.log("Screenshot captured for:", item.title);
			this.isCapturingScreenshot = false;
			if (callback) callback();
		}, this.SCREENSHOT_CAPTURE_DURATION);
	}

	/**
	 * Schedule the next item
	 */
	scheduleNextItem() {
		if (!this.isActive) return;

		this.switchTimer = setTimeout(() => {
			this.currentIndex++;
			this.showNextItem();
		}, this.SHADER_DISPLAY_DURATION);
	}

	/**
	 * Get screenshot path for an item
	 */
	getScreenshotPath(item) {
		// Use the explicit filename from the item config to match pre-generated screenshots
		return `gallery/${item.filename}`;
	}

	/**
	 * Check if screenshot exists
	 */
	checkScreenshotExists(path) {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => resolve(true);
			img.onerror = () => resolve(false);
			img.src = path;
		});
	}

	/**
	 * Create UI elements
	 */
	createUI() {
		this.createPlaylistMenu();
		this.createInfoOverlay();
		this.injectStyles();
	}

	/**
	 * Remove UI elements
	 */
	removeUI() {
		if (this.fortuneOverlay) {
			this.fortuneOverlay.remove();
			this.fortuneOverlay = null;
		}
		if (this.playlistMenu) {
			this.playlistMenu.remove();
			this.playlistMenu = null;
		}
		if (this.infoOverlay) {
			this.infoOverlay.remove();
			this.infoOverlay = null;
		}
	}

	/**
	 * Create collapsible playlist menu
	 */
	createPlaylistMenu() {
		if (this.playlistMenu) return;

		this.playlistMenu = document.createElement("div");
		this.playlistMenu.id = "gallery-playlist";
		this.playlistMenu.className = "collapsed";
		this.playlistMenu.innerHTML = `
			<div class="playlist-toggle" id="playlist-toggle">
				📋 Playlist
			</div>
			<div class="playlist-content" id="playlist-content">
				<div class="playlist-header">
					<h3>Gallery Playlist</h3>
					<button class="close-btn" id="playlist-close">×</button>
				</div>
				<div class="playlist-items" id="playlist-items"></div>
			</div>
		`;
		document.body.appendChild(this.playlistMenu);

		// Event listeners
		document.getElementById("playlist-toggle").addEventListener("click", () => {
			this.playlistMenu.classList.toggle("collapsed");
		});
		document.getElementById("playlist-close").addEventListener("click", () => {
			this.playlistMenu.classList.add("collapsed");
		});

		this.updatePlaylistUI();
	}

	/**
	 * Update playlist UI with thumbnails
	 */
	updatePlaylistUI() {
		const container = document.getElementById("playlist-items");
		if (!container) return;

		container.innerHTML = "";
		this.currentPlaylist.forEach((item, index) => {
			const itemEl = document.createElement("div");
			itemEl.className = `playlist-item${index === this.currentIndex ? " active" : ""}`;

			const screenshotPath = this.getScreenshotPath(item);

			itemEl.innerHTML = `
				<div class="thumbnail">
					<img src="${screenshotPath}" 
						 alt="${item.title}"
						 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
					<div class="thumbnail-placeholder">?</div>
				</div>
				<div class="item-info">
					<div class="item-title">${item.title}</div>
					<div class="item-description">${item.description}</div>
				</div>
			`;

			itemEl.addEventListener("click", () => {
				this.jumpToItem(index);
			});

			container.appendChild(itemEl);
		});
	}

	/**
	 * Create info overlay
	 */
	createInfoOverlay() {
		if (this.infoOverlay) return;

		this.infoOverlay = document.createElement("div");
		this.infoOverlay.id = "gallery-info";
		this.infoOverlay.innerHTML = `
			<div class="info-content">
				<h2 id="gallery-title"></h2>
				<p id="gallery-description"></p>
				<div class="info-footer">
					<span id="gallery-counter"></span>
					<span id="gallery-status"></span>
				</div>
			</div>
		`;
		document.body.appendChild(this.infoOverlay);
	}

	/**
	 * Update info overlay
	 */
	updateInfoOverlay(item) {
		document.getElementById("gallery-title").textContent = item.title;
		document.getElementById("gallery-description").textContent = item.description;
		document.getElementById("gallery-counter").textContent = `${this.currentIndex + 1} / ${this.currentPlaylist.length}`;
		document.getElementById("gallery-status").textContent = this.isCapturingScreenshot ? "📸 Capturing..." : "";
	}

	/**
	 * Jump to a specific item
	 */
	jumpToItem(index) {
		if (index < 0 || index >= this.currentPlaylist.length) return;

		// Clear existing timers
		if (this.switchTimer) {
			clearTimeout(this.switchTimer);
			this.switchTimer = null;
		}
		if (this.screenshotTimer) {
			clearTimeout(this.screenshotTimer);
			this.screenshotTimer = null;
		}

		this.currentIndex = index;
		this.showNextItem();
	}

	/**
	 * Inject CSS styles
	 */
	injectStyles() {
		if (document.getElementById("gallery-styles")) return;

		const style = document.createElement("style");
		style.id = "gallery-styles";
		style.textContent = `
			@keyframes fadeIn {
				from { opacity: 0; }
				to { opacity: 1; }
			}

			#gallery-playlist {
				position: fixed;
				top: 20px;
				right: 20px;
				z-index: 15000;
				font-family: 'Courier New', monospace;
				max-width: 400px;
			}

			#gallery-playlist.collapsed .playlist-content {
				display: none;
			}

			.playlist-toggle {
				background: rgba(0, 20, 0, 0.95);
				color: #00ff41;
				padding: 10px 20px;
				border: 1px solid #00ff41;
				cursor: pointer;
				text-align: center;
				box-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
			}

			.playlist-toggle:hover {
				background: rgba(0, 40, 0, 0.95);
			}

			.playlist-content {
				background: rgba(0, 20, 0, 0.98);
				border: 1px solid #00ff41;
				margin-top: 5px;
				max-height: 80vh;
				overflow-y: auto;
				box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
			}

			.playlist-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 10px 15px;
				border-bottom: 1px solid #00ff41;
			}

			.playlist-header h3 {
				margin: 0;
				color: #00ff41;
				font-size: 16px;
			}

			.close-btn {
				background: none;
				border: none;
				color: #00ff41;
				font-size: 24px;
				cursor: pointer;
				padding: 0;
				width: 30px;
				height: 30px;
			}

			.close-btn:hover {
				color: #00ff00;
			}

			.playlist-items {
				padding: 10px;
			}

			.playlist-item {
				display: flex;
				gap: 10px;
				padding: 10px;
				margin-bottom: 10px;
				border: 1px solid #003300;
				cursor: pointer;
				transition: all 0.3s;
			}

			.playlist-item:hover {
				border-color: #00ff41;
				background: rgba(0, 255, 65, 0.1);
			}

			.playlist-item.active {
				border-color: #00ff41;
				background: rgba(0, 255, 65, 0.2);
			}

			.thumbnail {
				width: 80px;
				height: 60px;
				position: relative;
				flex-shrink: 0;
			}

			.thumbnail img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				border: 1px solid #00ff41;
			}

			.thumbnail-placeholder {
				display: none;
				width: 100%;
				height: 100%;
				background: rgba(0, 50, 0, 0.5);
				border: 1px solid #00ff41;
				align-items: center;
				justify-content: center;
				color: #00ff41;
				font-size: 32px;
			}

			.item-info {
				flex: 1;
				min-width: 0;
			}

			.item-title {
				color: #00ff41;
				font-weight: bold;
				margin-bottom: 5px;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.item-description {
				color: #88ff88;
				font-size: 12px;
				line-height: 1.4;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
			}

			#gallery-info {
				position: fixed;
				bottom: 20px;
				left: 20px;
				right: 20px;
				max-width: 600px;
				margin: 0 auto;
				background: rgba(0, 0, 0, 0.9);
				color: #00ff41;
				padding: 20px;
				border: 1px solid #00ff41;
				font-family: 'Courier New', monospace;
				z-index: 15000;
				box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
			}

			#gallery-info h2 {
				margin: 0 0 10px 0;
				color: #00ff41;
				font-size: 18px;
			}

			#gallery-info p {
				margin: 0 0 15px 0;
				color: #88ff88;
				font-size: 14px;
			}

			.info-footer {
				display: flex;
				justify-content: space-between;
				font-size: 14px;
				color: #00ff41;
			}
		`;
		document.head.appendChild(style);
	}

	/**
	 * Event system
	 */
	on(event, callback) {
		if (this.callbacks[event]) {
			this.callbacks[event].push(callback);
		}
	}

	emit(event, data) {
		if (this.callbacks[event]) {
			this.callbacks[event].forEach((callback) => callback(data));
		}
	}
}

/**
 * Build a URL with the configuration parameters for a gallery item
 * @param {Object} item - Gallery item configuration
 * @returns {string} URL query string
 */
export function buildGalleryURL(item) {
	const params = new URLSearchParams();
	Object.entries(item.config).forEach(([key, value]) => {
		params.set(key, value);
	});
	params.set("suppressWarnings", "true");
	return `?${params.toString()}`;
}
