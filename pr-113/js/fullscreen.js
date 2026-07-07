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

// Multi-monitor manager reference (set externally)
let multiMonitorManager = null;

// Matrix config reference (set externally)
let matrixConfig = null;

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
 * Set the multi-monitor manager reference
 * @param {Object} manager - MultiMonitorManager instance
 */
export function setMultiMonitorManager(manager) {
	multiMonitorManager = manager;
}

/**
 * Set the matrix config reference
 * @param {Object} config - Matrix configuration object
 */
export function setMatrixConfig(config) {
	matrixConfig = config;
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
			// Not in fullscreen, check for multi-monitor mode
			if (multiMonitorManager && multiMonitorManager.isActive() && matrixConfig) {
				// Multi-monitor mode is active - spawn windows across all displays
				console.log("Initiating multi-monitor fullscreen mode:", multiMonitorManager.getMode());
				const success = await multiMonitorManager.spawnWindows(matrixConfig);

				if (success) {
					// Notify child windows (they must enter fullscreen manually via double-click)
					await multiMonitorManager.requestFullscreenAll();
					console.log("Multi-monitor windows opened. Double-click each window to enter fullscreen.");

					// Request fullscreen on main window
					try {
						const result = requestFullscreen(element);
						if (result && result.catch) {
							result.catch((error) => {
								console.error("Fullscreen request failed:", error.message);
							});
						}
					} catch (error) {
						console.error("Fullscreen request failed:", error.message);
					}
				} else {
					// Fall back to single-screen fullscreen
					console.warn("Multi-monitor fullscreen failed, falling back to single screen");
					try {
						const result = requestFullscreen(element);
						if (result && result.catch) {
							result.catch((error) => {
								console.error("Fullscreen request failed:", error.message);
							});
						}
					} catch (error) {
						console.error("Fullscreen request failed:", error.message);
					}
				}
			} else {
				// Normal single-screen fullscreen
				try {
					const result = requestFullscreen(element);
					if (result && result.catch) {
						result.catch((error) => {
							console.error("Fullscreen request failed:", error.message);
						});
					}
				} catch (error) {
					console.error("Fullscreen request failed:", error.message);
				}
			}
		} else {
			// In fullscreen, exit it
			if (multiMonitorManager && multiMonitorManager.isCoordinator) {
				// Exit fullscreen on all displays
				multiMonitorManager.exitFullscreenAll();
			}
			exitFullscreen(fullscreenElement);
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

	// Return cleanup function to remove the event listeners
	return () => {
		element.removeEventListener("dblclick", handleDoubleClick);
		document.removeEventListener("fullscreenchange", handleFullscreenChange);
		document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
		document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
		document.removeEventListener("MSFullscreenChange", handleFullscreenChange);

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
