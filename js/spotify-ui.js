/**
 * Spotify UI Controls for Matrix Rain
 * Handles user interface for connecting/disconnecting Spotify and configuring music features
 */

export default class SpotifyUI {
	/**
	 * Show the Spotify controls
	 */
	show() {
		this.isVisible = true;
		this.element.style.display = "block";
	}

	/**
	 * Hide the Spotify controls
	 */
	hide() {
		this.isVisible = false;
		this.element.style.display = "none";
		// Also collapse the panel when hiding
		this.isExpanded = false;
		const content = this.element.querySelector(".controls-content");
		const icon = this.element.querySelector(".toggle-icon");
		if (content) content.style.display = "none";
		if (icon) icon.textContent = "♪";
		this.element.style.transform = "translateX(-95%)";
	}

	/**
	 * Toggle visibility of the Spotify controls
	 */
	toggleVisibility() {
		if (this.isVisible) {
			this.hide();
		} else {
			this.show();
		}
	}

	/**
	 * Enable the visualizer toggle when Spotify connects
	 */
	enableVisualizerToggle() {
		const visualizerToggle = this.element.querySelector(".visualizer-toggle");
		if (visualizerToggle) {
			visualizerToggle.disabled = false;

			// Restore saved state if available
			const savedState = localStorage.getItem("visualizer_enabled");
			if (savedState === "true" && this.visualizer) {
				visualizerToggle.checked = true;
				this.visualizer.show();
			}
		}
	}

	/**
	 * Disable the visualizer toggle when Spotify disconnects
	 */
	disableVisualizerToggle() {
		const visualizerToggle = this.element.querySelector(".visualizer-toggle");
		if (visualizerToggle) {
			visualizerToggle.disabled = true;
			visualizerToggle.checked = false;

			// Hide visualizer
			if (this.visualizer) {
				this.visualizer.hide();
			}
		}
	}
	constructor(config = {}) {
		this.config = {
			position: "top-left",
			clientId: "", // Must be set by user
			visible: true, // Whether the controls are visible by default
			...config,
		};

		this.element = null;
		this.spotify = null;
		this.visualizer = null;
		this.isExpanded = false;
		this.isVisible = this.config.visible;
		this.callbacks = {
			onClientIdChange: [],
			onToggleMusicSync: [],
			onVisualizerToggle: [],
		};

		this.init();
	}

	/**
	 * Initialize the UI controls
	 */
	init() {
		this.createElement();
		this.setupEventListeners();
	}

	/**
	 * Set Spotify integration instance
	 */
	setSpotifyIntegration(spotify) {
		this.spotify = spotify;
		this.updateConnectionStatus();

		// Listen for auth changes
		spotify.on("authChange", () => {
			this.updateConnectionStatus();
		});

		spotify.on("error", (error) => {
			this.showError(error);
		});
	}

	/**
	 * Set visualizer instance
	 */
	setVisualizer(visualizer) {
		this.visualizer = visualizer;
	}

	/**
	 * Create the UI element
	 */
	createElement() {
		this.element = document.createElement("div");
		this.element.className = "spotify-controls";
		this.element.style.cssText = `
			position: fixed;
			top: 20px;
			left: 20px;
			background: rgba(0, 0, 0, 0.9);
			border: 1px solid rgba(0, 255, 0, 0.3);
			border-radius: 8px;
			padding: 10px;
			font-family: monospace;
			color: #00ff00;
			font-size: 12px;
			z-index: 1001;
			min-width: 200px;
			backdrop-filter: blur(5px);
			transition: all 0.3s ease;
			transform: translateX(-95%);
			display: ${this.isVisible ? "block" : "none"};
		`;

		this.element.innerHTML = `
			<div class="controls-header" style="cursor: pointer; padding: 5px; border-bottom: 1px solid rgba(0, 255, 0, 0.2); margin-bottom: 10px;">
				<span class="toggle-icon">♪</span> Spotify
			</div>
			<div class="controls-content" style="display: none;">
				<div class="connection-status" style="margin-bottom: 10px;">
					<div class="status-indicator" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ff0000; margin-right: 5px;"></div>
					<span class="status-text">Disconnected</span>
				</div>
				
				<div class="client-id-section" style="margin-bottom: 10px;">
					<label style="display: block; margin-bottom: 5px; font-size: 10px;">Client ID:</label>
					<input type="text" class="client-id-input" placeholder="Enter Spotify Client ID" 
						   style="width: 100%; padding: 4px; background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(0, 255, 0, 0.3); color: #00ff00; font-family: monospace; font-size: 10px; border-radius: 3px;" />
					<div class="client-id-help" style="font-size: 9px; opacity: 0.7; margin-top: 2px;">
						<a href="https://developer.spotify.com/dashboard" target="_blank" style="color: #00ff00;">Get Client ID</a>
					</div>
				</div>
				
				<div class="connection-controls" style="margin-bottom: 10px;">
					<button class="connect-btn" style="padding: 6px 12px; background: rgba(0, 255, 0, 0.2); border: 1px solid #00ff00; color: #00ff00; font-family: monospace; font-size: 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">
						Connect
					</button>
					<button class="disconnect-btn" style="padding: 6px 12px; background: rgba(255, 0, 0, 0.2); border: 1px solid #ff0000; color: #ff0000; font-family: monospace; font-size: 10px; border-radius: 3px; cursor: pointer; display: none;">
						Disconnect
					</button>
				</div>
				
				<div class="feature-controls" style="margin-bottom: 10px;">
					<label style="display: block; margin-bottom: 5px;">
						<input type="checkbox" class="music-sync-toggle" style="margin-right: 5px;" />
						Sync Matrix with Music
					</label>
					<label style="display: block; margin-bottom: 5px;">
						<input type="checkbox" class="visualizer-toggle" style="margin-right: 5px;" />
						Show Visualizer
					</label>
				</div>
				
				<div class="visualizer-config" style="margin-bottom: 10px;">
					<label style="display: block; margin-bottom: 5px; font-size: 10px;">Visualizer Position:</label>
					<select class="visualizer-position" style="width: 100%; padding: 4px; background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(0, 255, 0, 0.3); color: #00ff00; font-family: monospace; font-size: 10px; border-radius: 3px;">
						<option value="bottom-right">Bottom Right</option>
						<option value="bottom-left">Bottom Left</option>
						<option value="top-right">Top Right</option>
						<option value="top-left">Top Left</option>
					</select>
				</div>
				
				<div class="current-track" style="font-size: 10px; opacity: 0.8; padding-top: 5px; border-top: 1px solid rgba(0, 255, 0, 0.2); display: none;">
					<div class="track-name"></div>
					<div class="track-artist"></div>
				</div>
				
				<div class="error-message" style="color: #ff0000; font-size: 10px; margin-top: 5px; display: none;"></div>
			</div>
		`;

		document.body.appendChild(this.element);
	}

	/**
	 * Setup event listeners
	 */
	setupEventListeners() {
		// Toggle panel expansion
		const header = this.element.querySelector(".controls-header");
		header.addEventListener("click", () => {
			this.toggleExpanded();
		});

		// Client ID input
		const clientIdInput = this.element.querySelector(".client-id-input");
		clientIdInput.addEventListener("change", (e) => {
			this.config.clientId = e.target.value.trim();
			this.emit("clientIdChange", this.config.clientId);
			localStorage.setItem("spotify_client_id", this.config.clientId);
		});

		// Load saved client ID
		const savedClientId = localStorage.getItem("spotify_client_id");
		if (savedClientId) {
			clientIdInput.value = savedClientId;
			this.config.clientId = savedClientId;
		}

		// Connect button
		const connectBtn = this.element.querySelector(".connect-btn");
		connectBtn.addEventListener("click", () => {
			if (this.spotify && this.config.clientId) {
				this.spotify.init(this.config.clientId);
				this.spotify.authenticate();
			} else {
				this.showError("Please enter a valid Spotify Client ID");
			}
		});

		// Disconnect button
		const disconnectBtn = this.element.querySelector(".disconnect-btn");
		disconnectBtn.addEventListener("click", () => {
			if (this.spotify) {
				this.spotify.disconnect();
			}
		});

		// Music sync toggle
		const musicSyncToggle = this.element.querySelector(".music-sync-toggle");
		musicSyncToggle.addEventListener("change", (e) => {
			this.emit("toggleMusicSync", e.target.checked);
			localStorage.setItem("music_sync_enabled", e.target.checked);
		});

		// Load saved music sync setting
		const savedMusicSync = localStorage.getItem("music_sync_enabled");
		if (savedMusicSync !== null) {
			musicSyncToggle.checked = savedMusicSync === "true";
		}

		// Visualizer toggle
		const visualizerToggle = this.element.querySelector(".visualizer-toggle");
		visualizerToggle.checked = false; // Start unchecked
		visualizerToggle.disabled = true; // Disabled until connected (FIXED)

		visualizerToggle.addEventListener("change", (e) => {
			this.emit("visualizerToggle", e.target.checked);
			if (this.visualizer) {
				if (e.target.checked) {
					this.visualizer.show();
				} else {
					this.visualizer.hide();
				}
			}
			localStorage.setItem("visualizer_enabled", e.target.checked);
		});

		// Visualizer position
		const visualizerPosition = this.element.querySelector(".visualizer-position");
		visualizerPosition.addEventListener("change", (e) => {
			if (this.visualizer) {
				this.visualizer.setPosition(e.target.value);
			}
			localStorage.setItem("visualizer_position", e.target.value);
		});

		// Load saved visualizer position
		const savedPosition = localStorage.getItem("visualizer_position");
		if (savedPosition) {
			visualizerPosition.value = savedPosition;
		}

		// Button hover effects
		this.element.addEventListener("mouseover", (e) => {
			if (e.target.tagName === "BUTTON") {
				e.target.style.opacity = "0.8";
			}
		});

		this.element.addEventListener("mouseout", (e) => {
			if (e.target.tagName === "BUTTON") {
				e.target.style.opacity = "1";
			}
		});
	}

	/**
	 * Toggle expanded state
	 */
	toggleExpanded() {
		this.isExpanded = !this.isExpanded;
		const content = this.element.querySelector(".controls-content");
		const icon = this.element.querySelector(".toggle-icon");

		if (this.isExpanded) {
			this.element.style.transform = "translateX(0)";
			content.style.display = "block";
			icon.textContent = "♫";
		} else {
			this.element.style.transform = "translateX(-95%)";
			content.style.display = "none";
			icon.textContent = "♪";
		}
	}

	/**
	 * Update connection status display
	 */
	updateConnectionStatus() {
		const indicator = this.element.querySelector(".status-indicator");
		const statusText = this.element.querySelector(".status-text");
		const connectBtn = this.element.querySelector(".connect-btn");
		const disconnectBtn = this.element.querySelector(".disconnect-btn");
		const currentTrack = this.element.querySelector(".current-track");
		const visualizerToggle = this.element.querySelector(".visualizer-toggle");

		if (this.spotify && this.spotify.getConnectionStatus().isAuthenticated) {
			indicator.style.background = "#00ff00";
			statusText.textContent = "Connected";
			connectBtn.style.display = "none";
			disconnectBtn.style.display = "inline-block";

			// Enable visualizer toggle first
			visualizerToggle.disabled = true;

			// Then apply saved state
			const savedVisualizer = localStorage.getItem("visualizer_enabled");
			if (savedVisualizer === "true") {
				visualizerToggle.checked = true;
				if (this.visualizer) this.visualizer.show();
			}

			// Show current track if available
			const trackInfo = this.spotify.getCurrentTrackInfo();
			if (trackInfo && trackInfo.item) {
				const trackName = this.element.querySelector(".track-name");
				const trackArtist = this.element.querySelector(".track-artist");
				trackName.textContent = trackInfo.item.name;
				/**
				 * @param {Object} trackInfo - Spotify track info
				 * @param {Object} trackInfo.item - Track item
				 * @param {Array<{name: string}>} trackInfo.item.artists - Track artists
				 */
				// Then your original code should work without warnings
				trackArtist.textContent = trackInfo?.item?.artists?.map((a) => a.name).join(", ") || "Unknown Artist";
				currentTrack.style.display = "block";
			} else {
				currentTrack.style.display = "none";
			}
		} else {
			indicator.style.background = "#ff0000";
			statusText.textContent = "Disconnected";
			connectBtn.style.display = "inline-block";
			disconnectBtn.style.display = "none";
			visualizerToggle.checked = false;
			visualizerToggle.disabled = true;
			if (this.visualizer) this.visualizer.hide();
			currentTrack.style.display = "none";
		}
	}

	/**
	 * Show error message
	 */
	showError(message) {
		const errorElement = this.element.querySelector(".error-message");
		errorElement.textContent = message;
		errorElement.style.display = "block";

		// Hide error after 5 seconds
		setTimeout(() => {
			errorElement.style.display = "none";
		}, 5000);
	}

	/**
	 * Update current track display
	 */
	updateCurrentTrack() {
		this.updateConnectionStatus();
	}

	/**
	 * Get current configuration
	 */
	getConfig() {
		return {
			clientId: this.config.clientId,
			musicSyncEnabled: this.element.querySelector(".music-sync-toggle").checked,
			visualizerEnabled: this.element.querySelector(".visualizer-toggle").checked,
			visualizerPosition: this.element.querySelector(".visualizer-position").value,
		};
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
					console.error("Error in UI event callback:", error);
				}
			});
		}
	}

	/**
	 * Cleanup
	 */
	destroy() {
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
	}
}
