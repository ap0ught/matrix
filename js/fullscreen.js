/**
 * Fullscreen utility for cross-browser fullscreen support with proper event management
 *
 * This utility provides:
 * - Cross-browser compatibility (webkit, moz, ms prefixes)
 * - Proper event listener management with cleanup
 * - Event prevention to avoid conflicts
 * - Error handling for unsupported browsers
 * - Wake lock management during fullscreen mode
 * - Multi-monitor fullscreen support via Window Management API
 */

// Global wake lock reference
let currentWakeLock = null;

// Multi-monitor state tracking
let multiMonitorWindows = [];
let multiMonitorBroadcast = null;
let multiMonitorConfig = null;

/**
 * Request a screen wake lock to prevent the screen from turning off
 * @returns {Promise<WakeLockSentinel|null>} Wake lock sentinel or null if not supported
 */
async function requestWakeLock() {
	try {
		// Check if a wake lock already exists to prevent race conditions
		if (currentWakeLock && !currentWakeLock.released) {
			console.log("Screen Wake Lock already active");
			return currentWakeLock;
		}

		// Check if Wake Lock API is supported
		if ("wakeLock" in navigator) {
			currentWakeLock = await navigator.wakeLock.request("screen");
			console.log("Screen Wake Lock acquired:", currentWakeLock);

			// Listen for wake lock release (e.g., when tab becomes invisible)
			currentWakeLock.addEventListener("release", () => {
				console.log("Screen Wake Lock released automatically.");
				currentWakeLock = null;
			});

			return currentWakeLock;
		} else {
			console.warn("Wake Lock API not supported in this browser");
			return null;
		}
	} catch (err) {
		console.error("Failed to acquire Screen Wake Lock:", err);
		currentWakeLock = null;
		return null;
	}
}

/**
 * Release the current wake lock if one exists
 * @returns {Promise<void>}
 */
async function releaseWakeLock() {
	if (currentWakeLock) {
		try {
			await currentWakeLock.release();
			console.log("Screen Wake Lock released.");
		} catch (err) {
			console.error("Failed to release Screen Wake Lock:", err);
		} finally {
			currentWakeLock = null;
		}
	}
}

/**
 * Check if Window Management API is supported
 * @returns {boolean} True if Window Management API is available
 */
function isWindowManagementSupported() {
	return "getScreenDetails" in window;
}

/**
 * Request Window Management API permission
 * @returns {Promise<PermissionStatus|null>} Permission status or null if not supported
 */
async function requestWindowManagementPermission() {
	if (!isWindowManagementSupported()) {
		console.warn("Window Management API not supported");
		return null;
	}

	try {
		const permission = await navigator.permissions.query({ name: "window-management" });
		return permission;
	} catch (err) {
		console.error("Failed to query window-management permission:", err);
		return null;
	}
}

/**
 * Initialize BroadcastChannel for multi-monitor coordination
 */
function initMultiMonitorBroadcast() {
	if (!multiMonitorBroadcast) {
		multiMonitorBroadcast = new BroadcastChannel("matrix-multimonitor");
		multiMonitorBroadcast.onmessage = (event) => {
			if (event.data.type === "exit-fullscreen") {
				// Another window requested fullscreen exit
				exitMultiMonitorFullscreen();
			}
		};
	}
}

/**
 * Clean up multi-monitor windows and broadcast channel
 */
function cleanupMultiMonitor() {
	// Close all spawned windows
	multiMonitorWindows.forEach((win) => {
		if (win && !win.closed) {
			try {
				win.close();
			} catch (err) {
				console.error("Failed to close window:", err);
			}
		}
	});
	multiMonitorWindows = [];

	// Close broadcast channel
	if (multiMonitorBroadcast) {
		multiMonitorBroadcast.close();
		multiMonitorBroadcast = null;
	}
}

/**
 * Exit multi-monitor fullscreen mode
 */
async function exitMultiMonitorFullscreen() {
	// Exit fullscreen on current window
	if (document.fullscreenElement) {
		try {
			await document.exitFullscreen();
		} catch (err) {
			console.error("Failed to exit fullscreen:", err);
		}
	}

	// Broadcast exit message to other windows
	if (multiMonitorBroadcast) {
		multiMonitorBroadcast.postMessage({ type: "exit-fullscreen" });
	}

	// Clean up windows
	cleanupMultiMonitor();

	// Release wake lock
	await releaseWakeLock();
}

/**
 * Open fullscreen windows on all available displays
 * @param {Object} config - Configuration object with multiMonitorMode setting
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function openMultiMonitorFullscreen(config) {
	try {
		// Check if Window Management API is supported
		if (!isWindowManagementSupported()) {
			console.warn("Window Management API not supported - falling back to single screen");
			return false;
		}

		// Get screen details
		const screenDetails = await window.getScreenDetails();
		const screens = screenDetails.screens;

		if (screens.length <= 1) {
			console.log("Only one screen detected - falling back to single screen fullscreen");
			return false;
		}

		console.log(`Detected ${screens.length} screens - opening fullscreen on all`);

		// Initialize broadcast channel for coordination
		initMultiMonitorBroadcast();

		// Store config for later use
		multiMonitorConfig = config;

		// Determine URL for child windows
		const baseURL = window.location.origin + window.location.pathname;
		let windowURL;

		if (config.multiMonitorMode === "uniform") {
			// Import serializeConfig function
			const { serializeConfig } = await import("./config.js");
			const params = serializeConfig(config);
			windowURL = `${baseURL}?${params}&suppressWarnings=true`;
		} else {
			// Multiple mode - just use current URL (each gets random seed)
			const params = new URLSearchParams(window.location.search);
			params.set("suppressWarnings", "true");
			windowURL = `${baseURL}?${params.toString()}`;
		}

		// Open a window on each screen (except the current one)
		for (let i = 0; i < screens.length; i++) {
			const screen = screens[i];

			// Skip the current screen (we'll fullscreen this window instead)
			// Handle both window.screenLeft/Top (Chrome) and window.screen.left/top (standard)
			const currentScreenLeft = window.screenLeft ?? window.screen?.left ?? 0;
			const currentScreenTop = window.screenTop ?? window.screen?.top ?? 0;
			if (screen.left === currentScreenLeft && screen.top === currentScreenTop) {
				continue;
			}

			try {
				// Open window positioned on this screen with minimal chrome
				const features = `left=${screen.left},top=${screen.top},width=${screen.width},height=${screen.height},resizable=no,scrollbars=no,menubar=no,toolbar=no,status=no`;
				const newWindow = window.open(windowURL, `_blank`, features);

				if (newWindow) {
					multiMonitorWindows.push(newWindow);

					// Request fullscreen on the new window after it loads
					// Use readyState check for more reliable timing
					const requestFullscreenWhenReady = () => {
						if (newWindow.document.readyState === "complete") {
							// Additional small delay to ensure renderer is ready
							setTimeout(() => {
								if (newWindow.document.documentElement.requestFullscreen) {
									newWindow.document.documentElement.requestFullscreen().catch((err) => {
										console.error("Failed to request fullscreen on child window:", err);
									});
								}
							}, 100);
						} else {
							newWindow.addEventListener("load", requestFullscreenWhenReady);
						}
					};
					requestFullscreenWhenReady();
				}
			} catch (err) {
				console.error(`Failed to open window on screen ${i}:`, err);
			}
		}

		return true;
	} catch (err) {
		console.error("Failed to open multi-monitor fullscreen:", err);
		cleanupMultiMonitor();
		return false;
	}
}

/**
 * Set multi-monitor configuration
 * Called from main.js to pass config to fullscreen module
 * @param {Object} config - Configuration object
 */
export function setMultiMonitorConfig(config) {
	multiMonitorConfig = config;
}

/**
 * Sets up fullscreen toggle functionality on double-click
 * @param {HTMLElement} element - The element to make fullscreen (typically a canvas)
 * @returns {Function} cleanup - Function to remove the event listener
 */
export function setupFullscreenToggle(element) {
	// Check for fullscreen API support with various prefixes
	const isFullscreenSupported = document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled;

	if (!isFullscreenSupported) {
		console.warn("Fullscreen API not supported in this browser");
		return () => {}; // Return empty cleanup function
	}

	/**
	 * Cross-browser fullscreen request
	 * @param {HTMLElement} elem - Element to request fullscreen for
	 */
	const requestFullscreen = (elem) => {
		try {
			if (elem.requestFullscreen) {
				return elem.requestFullscreen();
			} else if (elem.webkitRequestFullscreen) {
				return elem.webkitRequestFullscreen();
			} else if (elem.mozRequestFullScreen) {
				return elem.mozRequestFullScreen();
			} else if (elem.msRequestFullscreen) {
				return elem.msRequestFullscreen();
			}
		} catch (error) {
			console.error("Failed to request fullscreen:", error);
		}
	};

	/**
	 * Cross-browser fullscreen exit
	 * @param {Element|null} currentFullscreenElement - The current fullscreen element (optional, will be checked if not provided)
	 */
	const exitFullscreen = (currentFullscreenElement = null) => {
		try {
			// Check if document is active and we're actually in fullscreen
			// This prevents "Document not active" errors
			if (document.visibilityState !== "visible") {
				console.warn("Cannot exit fullscreen: document not active");
				return;
			}

			// Check that we're actually in fullscreen mode
			// Use provided element or get current one
			const fullscreenElement = currentFullscreenElement || getFullscreenElement();
			if (!fullscreenElement) {
				console.warn("Cannot exit fullscreen: not currently in fullscreen mode");
				return;
			}

			if (document.exitFullscreen) {
				return document.exitFullscreen();
			} else if (document.webkitExitFullscreen) {
				return document.webkitExitFullscreen();
			} else if (document.mozCancelFullScreen) {
				return document.mozCancelFullScreen();
			} else if (document.msExitFullscreen) {
				return document.msExitFullscreen();
			}
		} catch (error) {
			console.error("Failed to exit fullscreen:", error);
		}
	};

	/**
	 * Cross-browser check for fullscreen element
	 */
	const getFullscreenElement = () => {
		return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
	};

	/**
	 * Double-click event handler for fullscreen toggle
	 * @param {Event} event - Double-click event
	 */
	const handleDoubleClick = async (event) => {
		// Prevent default behavior and stop event propagation
		event.preventDefault();
		event.stopPropagation();

		// Get fullscreen element once to avoid duplicate DOM queries
		const fullscreenElement = getFullscreenElement();

		if (!fullscreenElement) {
			// Not in fullscreen, check if multi-monitor mode is enabled
			if (multiMonitorConfig && multiMonitorConfig.multiMonitorMode !== "none") {
				// Try multi-monitor fullscreen
				const success = await openMultiMonitorFullscreen(multiMonitorConfig);

				// If multi-monitor succeeded, also fullscreen current window
				if (success) {
					requestFullscreen(element);
				} else {
					// Fallback to single screen fullscreen
					requestFullscreen(element);
				}
			} else {
				// Normal single screen fullscreen
				requestFullscreen(element);
			}
		} else {
			// In fullscreen, exit it
			if (multiMonitorWindows.length > 0) {
				// Multi-monitor mode active - exit all
				await exitMultiMonitorFullscreen();
			} else {
				// Single screen mode - just exit normally
				exitFullscreen(fullscreenElement);
			}
		}
	};

	/**
	 * Fullscreen change event handler for wake lock management
	 */
	const handleFullscreenChange = () => {
		const fullscreenElement = getFullscreenElement();

		if (fullscreenElement) {
			// Entering fullscreen - request wake lock
			requestWakeLock();
		} else {
			// Exiting fullscreen - release wake lock
			releaseWakeLock();
		}
	};

	// Add event listener using addEventListener for proper event management
	element.addEventListener("dblclick", handleDoubleClick);

	// Add fullscreen change listener for wake lock management
	// Use multiple event names for cross-browser compatibility
	document.addEventListener("fullscreenchange", handleFullscreenChange);
	document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
	document.addEventListener("mozfullscreenchange", handleFullscreenChange);
	document.addEventListener("MSFullscreenChange", handleFullscreenChange);

	// Set up BroadcastChannel listener for multi-monitor coordination (for child windows)
	if (window.opener) {
		// This is a child window - listen for exit messages
		initMultiMonitorBroadcast();
	}

	// Return cleanup function to remove the event listeners
	return () => {
		element.removeEventListener("dblclick", handleDoubleClick);
		document.removeEventListener("fullscreenchange", handleFullscreenChange);
		document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
		document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
		document.removeEventListener("MSFullscreenChange", handleFullscreenChange);

		// Clean up multi-monitor resources
		cleanupMultiMonitor();

		// Release wake lock on cleanup
		releaseWakeLock();
	};
}

/**
 * Utility function to check if currently in fullscreen mode
 * @returns {boolean} - True if currently in fullscreen
 */
export function isFullscreen() {
	const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;

	return fullscreenElement !== null;
}

/**
 * Utility function to check if fullscreen is supported
 * @returns {boolean} - True if fullscreen API is supported
 */
export function isFullscreenSupported() {
	return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled);
}
