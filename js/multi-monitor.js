/**
 * Multi-Monitor Manager
 *
 * Manages fullscreen across multiple displays using the Window Management API.
 * Provides two modes:
 * - Multiple: Opens independent Matrix instances on each display
 * - Uniform: Opens synchronized Matrix instances with same config on each display
 *
 * Uses BroadcastChannel for cross-window communication to coordinate
 * fullscreen entry/exit events.
 */

export default class MultiMonitorManager {
	constructor() {
		this.mode = null; // 'multiple' or 'uniform'
		this.spawnedWindows = [];
		this.broadcastChannel = null;
		this.isCoordinator = false; // True if this is the main window
		this.hasPermission = false;
		this.callbacks = {
			permissionGranted: [],
			permissionDenied: [],
			windowsOpened: [],
			allWindowsClosed: [],
			error: [],
		};
	}

	/**
	 * Check if Window Management API is supported
	 */
	isSupported() {
		return "getScreenDetails" in window;
	}

	/**
	 * Request Window Management permission
	 */
	async requestPermission() {
		if (!this.isSupported()) {
			this.emit("error", {
				code: "NOT_SUPPORTED",
				message: "Window Management API is not supported in this browser",
			});
			return false;
		}

		try {
			const screenDetails = await window.getScreenDetails();
			this.hasPermission = true;
			this.emit("permissionGranted", { screens: screenDetails.screens.length });
			return true;
		} catch (error) {
			this.hasPermission = false;
			this.emit("permissionDenied", { error: error.message });
			return false;
		}
	}

	/**
	 * Set the multi-monitor mode
	 * @param {string} mode - 'multiple' or 'uniform' or null to disable
	 */
	setMode(mode) {
		if (mode !== null && mode !== "multiple" && mode !== "uniform") {
			throw new Error('Mode must be "multiple", "uniform", or null');
		}
		this.mode = mode;
	}

	/**
	 * Get the current mode
	 */
	getMode() {
		return this.mode;
	}

	/**
	 * Check if any multi-monitor mode is active
	 */
	isActive() {
		return this.mode !== null;
	}

	/**
	 * Spawn fullscreen windows on all available displays
	 * @param {Object} config - Matrix configuration object
	 * @returns {Promise<boolean>} - True if successful
	 */
	async spawnWindows(config) {
		if (!this.isActive()) {
			console.warn("No multi-monitor mode is active");
			return false;
		}

		if (!this.hasPermission) {
			const granted = await this.requestPermission();
			if (!granted) {
				return false;
			}
		}

		try {
			const screenDetails = await window.getScreenDetails();
			const screens = screenDetails.screens;

			if (screens.length < 2) {
				this.emit("error", {
					code: "INSUFFICIENT_SCREENS",
					message: "Only one display detected. Multi-monitor mode requires at least 2 displays.",
				});
				return false;
			}

			// Set this window as the coordinator
			this.isCoordinator = true;

			// Create broadcast channel for cross-window communication
			this.setupBroadcastChannel();

			// Close any existing spawned windows
			this.closeAllWindows();

			// Spawn a window on each screen
			for (let i = 0; i < screens.length; i++) {
				const screen = screens[i];
				const url = this.buildWindowURL(config, i);

				// Calculate window position and size for this screen
				const left = screen.left;
				const top = screen.top;
				const width = screen.width;
				const height = screen.height;

				const features = `left=${left},top=${top},width=${width},height=${height},popup=1`;

				const newWindow = window.open(url, `matrix-screen-${i}`, features);

				if (newWindow) {
					this.spawnedWindows.push({
						window: newWindow,
						screenIndex: i,
						screen: screen,
					});
				} else {
					console.error(`Failed to open window on screen ${i}`);
				}
			}

			// Set up window monitoring
			this.monitorWindows();

			this.emit("windowsOpened", { count: this.spawnedWindows.length });

			return true;
		} catch (error) {
			console.error("Error spawning windows:", error);
			this.emit("error", {
				code: "SPAWN_FAILED",
				message: error.message,
			});
			return false;
		}
	}

	/**
	 * Build URL for spawned window based on mode
	 * @param {Object} config - Matrix configuration
	 * @param {number} screenIndex - Screen index
	 */
	buildWindowURL(config, screenIndex) {
		const baseURL = window.location.origin + window.location.pathname;
		const params = new URLSearchParams();

		if (this.mode === "uniform") {
			// Serialize current config to URL parameters for uniform mode
			this.serializeConfig(config, params);
		} else {
			// For multiple mode, just use current URL params (each gets random seed)
			const currentParams = new URLSearchParams(window.location.search);
			currentParams.forEach((value, key) => {
				params.set(key, value);
			});
		}

		// Add screen index as metadata
		params.set("screenIndex", screenIndex);
		params.set("multiMonitorChild", "true");
		params.set("suppressWarnings", "true");

		return `${baseURL}?${params.toString()}`;
	}

	/**
	 * Serialize config to URL parameters
	 * @param {Object} config - Matrix configuration
	 * @param {URLSearchParams} params - URL params object to populate
	 */
	serializeConfig(config, params) {
		// Core settings
		if (config.version) params.set("version", config.version);
		if (config.effect) params.set("effect", config.effect);
		if (config.font) params.set("font", config.font);

		// Visual parameters
		if (config.numColumns) params.set("numColumns", config.numColumns);
		if (config.resolution) params.set("resolution", config.resolution);
		if (config.animationSpeed) params.set("animationSpeed", config.animationSpeed);
		if (config.cycleSpeed) params.set("cycleSpeed", config.cycleSpeed);
		if (config.fallSpeed) params.set("fallSpeed", config.fallSpeed);
		if (config.raindropLength) params.set("raindropLength", config.raindropLength);
		if (config.slant) params.set("slant", (config.slant * 180) / Math.PI);

		// Color parameters
		if (config.stripeColors && Array.isArray(config.stripeColors)) {
			const colorValues = config.stripeColors.flatMap((c) => c.values).join(",");
			params.set("stripeColors", colorValues);
		}

		// Bloom parameters
		if (config.bloomSize) params.set("bloomSize", config.bloomSize);
		if (config.bloomStrength) params.set("bloomStrength", config.bloomStrength);

		// 3D parameters
		if (config.volumetric) params.set("volumetric", config.volumetric);
		if (config.forwardSpeed) params.set("forwardSpeed", config.forwardSpeed);

		// Other settings
		if (config.fps) params.set("fps", config.fps);
		if (config.renderer) params.set("renderer", config.renderer);
	}

	/**
	 * Setup broadcast channel for cross-window communication
	 */
	setupBroadcastChannel() {
		if (this.broadcastChannel) {
			this.broadcastChannel.close();
		}

		this.broadcastChannel = new BroadcastChannel("matrix-multi-monitor");

		this.broadcastChannel.addEventListener("message", (event) => {
			if (event.data.type === "exitFullscreen") {
				// Exit fullscreen on all windows
				this.exitFullscreenAll();
			} else if (event.data.type === "windowClosed") {
				// A child window was closed
				console.log("Child window closed:", event.data.screenIndex);
			}
		});
	}

	/**
	 * Monitor spawned windows for manual closure
	 */
	monitorWindows() {
		const checkInterval = setInterval(() => {
			let allClosed = true;

			this.spawnedWindows = this.spawnedWindows.filter((item) => {
				if (item.window.closed) {
					console.log(`Window on screen ${item.screenIndex} was closed`);
					return false;
				}
				allClosed = false;
				return true;
			});

			if (allClosed && this.spawnedWindows.length === 0) {
				clearInterval(checkInterval);
				this.emit("allWindowsClosed");
				this.cleanup();
			}
		}, 500);

		// Store interval ID for cleanup
		this.monitorInterval = checkInterval;
	}

	/**
	 * Close all spawned windows
	 */
	closeAllWindows() {
		this.spawnedWindows.forEach((item) => {
			if (!item.window.closed) {
				item.window.close();
			}
		});
		this.spawnedWindows = [];
	}

	/**
	 * Exit fullscreen on all windows (called by coordinator)
	 */
	exitFullscreenAll() {
		if (this.broadcastChannel) {
			this.broadcastChannel.postMessage({ type: "exitFullscreen" });
		}
		this.closeAllWindows();
	}

	/**
	 * Request fullscreen on all spawned windows
	 */
	async requestFullscreenAll() {
		// Use broadcast channel to tell all child windows to enter fullscreen
		if (this.broadcastChannel) {
			this.broadcastChannel.postMessage({ type: "requestFullscreen" });
		}

		// Child windows will handle their own fullscreen requests
		return true;
	}

	/**
	 * Handle fullscreen request from child window
	 * This is called by child windows when they receive the broadcast
	 */
	static handleChildFullscreenRequest(canvas) {
		const channel = new BroadcastChannel("matrix-multi-monitor");

		channel.addEventListener("message", (event) => {
			if (event.data.type === "requestFullscreen") {
				// Request fullscreen on this child window
				if (canvas.requestFullscreen) {
					canvas.requestFullscreen().catch((err) => {
						console.error("Fullscreen request failed:", err);
					});
				}
			} else if (event.data.type === "exitFullscreen") {
				// Exit fullscreen on this child window
				if (document.fullscreenElement) {
					document.exitFullscreen().catch((err) => {
						console.error("Exit fullscreen failed:", err);
					});
				}
				// Also close the window
				setTimeout(() => {
					window.close();
				}, 100);
			}
		});

		// Listen for fullscreen change on this window
		const handleFullscreenChange = () => {
			if (!document.fullscreenElement) {
				// Exited fullscreen - notify coordinator
				channel.postMessage({
					type: "childExitedFullscreen",
					screenIndex: new URLSearchParams(window.location.search).get("screenIndex"),
				});
			}
		};

		document.addEventListener("fullscreenchange", handleFullscreenChange);
		document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
		document.addEventListener("mozfullscreenchange", handleFullscreenChange);
		document.addEventListener("MSFullscreenChange", handleFullscreenChange);

		return channel;
	}

	/**
	 * Cleanup resources
	 */
	cleanup() {
		if (this.monitorInterval) {
			clearInterval(this.monitorInterval);
			this.monitorInterval = null;
		}

		if (this.broadcastChannel) {
			this.broadcastChannel.close();
			this.broadcastChannel = null;
		}

		this.isCoordinator = false;
	}

	/**
	 * Add event listener
	 */
	on(event, callback) {
		if (this.callbacks[event]) {
			this.callbacks[event].push(callback);
		}
	}

	/**
	 * Emit event to listeners
	 */
	emit(event, data) {
		if (this.callbacks[event]) {
			this.callbacks[event].forEach((callback) => {
				try {
					callback(data);
				} catch (error) {
					console.error(`Error in multi-monitor callback for ${event}:`, error);
				}
			});
		}
	}

	/**
	 * Destroy the manager
	 */
	destroy() {
		this.closeAllWindows();
		this.cleanup();
		this.callbacks = {};
	}
}
