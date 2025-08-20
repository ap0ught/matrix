/**
 * Fullscreen utility for cross-browser fullscreen support with proper event management
 * 
 * This utility provides:
 * - Cross-browser compatibility (webkit, moz, ms prefixes)
 * - Proper event listener management with cleanup
 * - Event prevention to avoid conflicts
 * - Error handling for unsupported browsers
 * - Wake lock management during fullscreen mode
 */

// Global wake lock reference
let currentWakeLock = null;

/**
 * Request a screen wake lock to prevent the screen from turning off
 * @returns {Promise<WakeLockSentinel|null>} Wake lock sentinel or null if not supported
 */
async function requestWakeLock() {
	try {
		// Check if a wake lock already exists to prevent race conditions
		if (currentWakeLock && !currentWakeLock.released) {
			console.log('Screen Wake Lock already active');
			return currentWakeLock;
		}
		
		// Check if Wake Lock API is supported
		if ('wakeLock' in navigator) {
			currentWakeLock = await navigator.wakeLock.request('screen');
			console.log('Screen Wake Lock acquired:', currentWakeLock);
			
			// Listen for wake lock release (e.g., when tab becomes invisible)
			currentWakeLock.addEventListener('release', () => {
				console.log('Screen Wake Lock released automatically.');
				currentWakeLock = null;
			});
			
			return currentWakeLock;
		} else {
			console.warn('Wake Lock API not supported in this browser');
			return null;
		}
	} catch (err) {
		console.error('Failed to acquire Screen Wake Lock:', err);
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
			console.log('Screen Wake Lock released.');
		} catch (err) {
			console.error('Failed to release Screen Wake Lock:', err);
		} finally {
			currentWakeLock = null;
		}
	}
}

/**
 * Sets up fullscreen toggle functionality on double-click
 * @param {HTMLElement} element - The element to make fullscreen (typically a canvas)
 * @returns {Function} cleanup - Function to remove the event listener
 */
export function setupFullscreenToggle(element) {
	// Check for fullscreen API support with various prefixes
	const isFullscreenSupported = 
		document.fullscreenEnabled ||
		document.webkitFullscreenEnabled ||
		document.mozFullScreenEnabled ||
		document.msFullscreenEnabled;

	if (!isFullscreenSupported) {
		console.warn('Fullscreen API not supported in this browser');
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
			console.error('Failed to request fullscreen:', error);
		}
	};

	/**
	 * Cross-browser fullscreen exit
	 */
	const exitFullscreen = () => {
		try {
			// Check if document is active and we're actually in fullscreen
			// This prevents "Document not active" errors
			if (document.visibilityState !== 'visible') {
				console.warn('Cannot exit fullscreen: document not active');
				return;
			}
			
			// Double-check that we're actually in fullscreen mode
			const fullscreenElement = getFullscreenElement();
			if (!fullscreenElement) {
				console.warn('Cannot exit fullscreen: not currently in fullscreen mode');
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
			console.error('Failed to exit fullscreen:', error);
		}
	};

	/**
	 * Cross-browser check for fullscreen element
	 */
	const getFullscreenElement = () => {
		return (
			document.fullscreenElement ||
			document.webkitFullscreenElement ||
			document.mozFullScreenElement ||
			document.msFullscreenElement
		);
	};

	/**
	 * Double-click event handler for fullscreen toggle
	 * @param {Event} event - Double-click event
	 */
	const handleDoubleClick = (event) => {
		// Prevent default behavior and stop event propagation
		event.preventDefault();
		event.stopPropagation();

		const fullscreenElement = getFullscreenElement();
		
		if (!fullscreenElement) {
			// Not in fullscreen, request it
			requestFullscreen(element);
		} else {
			// In fullscreen, exit it
			exitFullscreen();
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
	element.addEventListener('dblclick', handleDoubleClick);
	
	// Add fullscreen change listener for wake lock management
	// Use multiple event names for cross-browser compatibility
	document.addEventListener('fullscreenchange', handleFullscreenChange);
	document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
	document.addEventListener('mozfullscreenchange', handleFullscreenChange);
	document.addEventListener('MSFullscreenChange', handleFullscreenChange);

	// Return cleanup function to remove the event listeners
	return () => {
		element.removeEventListener('dblclick', handleDoubleClick);
		document.removeEventListener('fullscreenchange', handleFullscreenChange);
		document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
		document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
		document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
		
		// Release wake lock on cleanup
		releaseWakeLock();
	};
}

/**
 * Utility function to check if currently in fullscreen mode
 * @returns {boolean} - True if currently in fullscreen
 */
export function isFullscreen() {
	const fullscreenElement = 
		document.fullscreenElement ||
		document.webkitFullscreenElement ||
		document.mozFullScreenElement ||
		document.msFullscreenElement;
	
	return fullscreenElement !== null;
}

/**
 * Utility function to check if fullscreen is supported
 * @returns {boolean} - True if fullscreen API is supported
 */
export function isFullscreenSupported() {
	return !!(
		document.fullscreenEnabled ||
		document.webkitFullscreenEnabled ||
		document.mozFullScreenEnabled ||
		document.msFullscreenEnabled
	);
}