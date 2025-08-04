/**
 * Fullscreen utility for cross-browser fullscreen support with proper event management
 * 
 * This utility provides:
 * - Cross-browser compatibility (webkit, moz, ms prefixes)
 * - Proper event listener management with cleanup
 * - Event prevention to avoid conflicts
 * - Error handling for unsupported browsers
 */

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
		
		if (fullscreenElement === null) {
			// Not in fullscreen, request it
			requestFullscreen(element);
		} else {
			// In fullscreen, exit it
			exitFullscreen();
		}
	};

	// Add event listener using addEventListener for proper event management
	window.addEventListener('dblclick', handleDoubleClick);

	// Return cleanup function to remove the event listener
	return () => {
		window.removeEventListener('dblclick', handleDoubleClick);
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