/**
 * Spotify Web API Integration for Matrix Rain Visualization
 * Handles OAuth authentication, token management, and real-time music data
 */

export default class SpotifyIntegration {
	constructor() {
		this.clientId = ''; // Will be set by user configuration
		this.redirectUri = window.location.origin + window.location.pathname;
		this.scopes = 'user-read-currently-playing user-read-playback-state';
		this.accessToken = null;
		this.refreshToken = null;
		this.tokenExpiry = null;
		this.isAuthenticated = false;
		this.currentTrack = null;
		this.audioFeatures = null;
		this.pollInterval = null;
		this.pollIntervalMs = 5000; // Poll every 5 seconds
		this.callbacks = {
			onTrackChange: [],
			onAuthChange: [],
			onError: []
		};
		
		// Load stored tokens
		this.loadStoredTokens();
	}

	/**
	 * Initialize Spotify integration with client ID
	 */
	init(clientId) {
		if (!clientId) {
			this.emit('error', 'Spotify Client ID is required');
			return;
		}
		this.clientId = clientId;
		
		// Check if we're returning from OAuth redirect
		this.handleOAuthCallback();
	}

	/**
	 * Start OAuth authentication flow
	 */
	authenticate() {
		if (!this.clientId) {
			this.emit('error', 'Client ID not set');
			return;
		}

		const authUrl = new URL('https://accounts.spotify.com/authorize');
		authUrl.searchParams.set('client_id', this.clientId);
		authUrl.searchParams.set('response_type', 'code');
		authUrl.searchParams.set('redirect_uri', this.redirectUri);
		authUrl.searchParams.set('scope', this.scopes);
		authUrl.searchParams.set('state', 'matrix-spotify-auth');

		// Open popup for OAuth
		const popup = window.open(authUrl.toString(), 'spotify-auth', 'width=500,height=600');
		
		// Monitor popup for completion
		const checkPopup = setInterval(() => {
			try {
				if (popup.closed) {
					clearInterval(checkPopup);
					// Check if authentication was successful
					this.loadStoredTokens();
				}
			} catch (e) {
				// Cross-origin access blocked - popup is on Spotify domain
			}
		}, 1000);
	}

	/**
	 * Handle OAuth callback after user authorization
	 */
	async handleOAuthCallback() {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const state = urlParams.get('state');

		if (code && state === 'matrix-spotify-auth') {
			try {
				await this.exchangeCodeForTokens(code);
				// Clean up URL
				window.history.replaceState({}, document.title, window.location.pathname);
			} catch (error) {
				this.emit('error', 'Failed to exchange code for tokens: ' + error.message);
			}
		}
	}

	/**
	 * Exchange authorization code for access and refresh tokens
	 */
	async exchangeCodeForTokens(code) {
		const tokenUrl = 'https://accounts.spotify.com/api/token';
		const body = new URLSearchParams({
			grant_type: 'authorization_code',
			code: code,
			redirect_uri: this.redirectUri,
			client_id: this.clientId
		});

		const response = await fetch(tokenUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: body
		});

		if (!response.ok) {
			throw new Error(`Token exchange failed: ${response.status}`);
		}

		const data = await response.json();
		this.accessToken = data.access_token;
		this.refreshToken = data.refresh_token;
		this.tokenExpiry = Date.now() + (data.expires_in * 1000);
		this.isAuthenticated = true;

		// Store tokens securely
		this.storeTokens();
		this.emit('authChange', true);
		
		// Start polling for current track
		this.startPolling();
	}

	/**
	 * Refresh access token using refresh token
	 */
	async refreshAccessToken() {
		if (!this.refreshToken) {
			throw new Error('No refresh token available');
		}

		const tokenUrl = 'https://accounts.spotify.com/api/token';
		const body = new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: this.refreshToken,
			client_id: this.clientId
		});

		const response = await fetch(tokenUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: body
		});

		if (!response.ok) {
			throw new Error(`Token refresh failed: ${response.status}`);
		}

		const data = await response.json();
		this.accessToken = data.access_token;
		this.tokenExpiry = Date.now() + (data.expires_in * 1000);
		
		// Update refresh token if provided
		if (data.refresh_token) {
			this.refreshToken = data.refresh_token;
		}

		this.storeTokens();
	}

	/**
	 * Get current playing track information
	 */
	async getCurrentTrack() {
		await this.ensureValidToken();
		
		const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
			headers: {
				'Authorization': `Bearer ${this.accessToken}`
			}
		});

		if (response.status === 204) {
			// No content - nothing playing
			return null;
		}

		if (!response.ok) {
			if (response.status === 401) {
				await this.refreshAccessToken();
				return this.getCurrentTrack();
			}
			throw new Error(`Failed to get current track: ${response.status}`);
		}

		return await response.json();
	}

	/**
	 * Get audio features for a track
	 */
	async getAudioFeatures(trackId) {
		await this.ensureValidToken();
		
		const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
			headers: {
				'Authorization': `Bearer ${this.accessToken}`
			}
		});

		if (!response.ok) {
			if (response.status === 401) {
				await this.refreshAccessToken();
				return this.getAudioFeatures(trackId);
			}
			throw new Error(`Failed to get audio features: ${response.status}`);
		}

		return await response.json();
	}

	/**
	 * Start polling for current track and audio features
	 */
	startPolling() {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
		}

		this.pollInterval = setInterval(async () => {
			try {
				const track = await this.getCurrentTrack();
				
				if (track && track.item) {
					const trackId = track.item.id;
					
					// Check if track changed
					if (!this.currentTrack || this.currentTrack.item.id !== trackId) {
						this.currentTrack = track;
						
						// Fetch audio features for new track
						try {
							this.audioFeatures = await this.getAudioFeatures(trackId);
						} catch (error) {
							console.warn('Failed to get audio features:', error);
							this.audioFeatures = null;
						}
						
						this.emit('trackChange', {
							track: this.currentTrack,
							audioFeatures: this.audioFeatures
						});
					} else {
						// Update playback info (position, etc.)
						this.currentTrack = track;
					}
				} else if (this.currentTrack) {
					// Track stopped playing
					this.currentTrack = null;
					this.audioFeatures = null;
					this.emit('trackChange', null);
				}
			} catch (error) {
				this.emit('error', 'Polling error: ' + error.message);
			}
		}, this.pollIntervalMs);
	}

	/**
	 * Stop polling
	 */
	stopPolling() {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
		}
	}

	/**
	 * Disconnect from Spotify
	 */
	disconnect() {
		this.stopPolling();
		this.accessToken = null;
		this.refreshToken = null;
		this.tokenExpiry = null;
		this.isAuthenticated = false;
		this.currentTrack = null;
		this.audioFeatures = null;
		
		// Clear stored tokens
		localStorage.removeItem('spotify_access_token');
		localStorage.removeItem('spotify_refresh_token');
		localStorage.removeItem('spotify_token_expiry');
		
		this.emit('authChange', false);
	}

	/**
	 * Ensure we have a valid access token
	 */
	async ensureValidToken() {
		if (!this.accessToken) {
			throw new Error('Not authenticated');
		}

		// Check if token is about to expire (with 5 minute buffer)
		if (this.tokenExpiry && Date.now() > (this.tokenExpiry - 300000)) {
			await this.refreshAccessToken();
		}
	}

	/**
	 * Store tokens in localStorage
	 */
	storeTokens() {
		if (this.accessToken) {
			localStorage.setItem('spotify_access_token', this.accessToken);
		}
		if (this.refreshToken) {
			localStorage.setItem('spotify_refresh_token', this.refreshToken);
		}
		if (this.tokenExpiry) {
			localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
		}
	}

	/**
	 * Load stored tokens from localStorage
	 */
	loadStoredTokens() {
		this.accessToken = localStorage.getItem('spotify_access_token');
		this.refreshToken = localStorage.getItem('spotify_refresh_token');
		const expiry = localStorage.getItem('spotify_token_expiry');
		this.tokenExpiry = expiry ? parseInt(expiry) : null;
		
		if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
			this.isAuthenticated = true;
			this.emit('authChange', true);
			this.startPolling();
		} else if (this.refreshToken) {
			// Try to refresh the token
			this.refreshAccessToken().catch(error => {
				console.warn('Failed to refresh token on load:', error);
				this.disconnect();
			});
		}
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
	 * Remove event listener
	 */
	off(event, callback) {
		if (this.callbacks[event]) {
			const index = this.callbacks[event].indexOf(callback);
			if (index > -1) {
				this.callbacks[event].splice(index, 1);
			}
		}
	}

	/**
	 * Emit event to listeners
	 */
	emit(event, data) {
		if (this.callbacks[event]) {
			this.callbacks[event].forEach(callback => {
				try {
					callback(data);
				} catch (error) {
					console.error('Error in event callback:', error);
				}
			});
		}
	}

	/**
	 * Get current track info for external use
	 */
	getCurrentTrackInfo() {
		return this.currentTrack;
	}

	/**
	 * Get current audio features for external use
	 */
	getCurrentAudioFeatures() {
		return this.audioFeatures;
	}

	/**
	 * Get connection status
	 */
	getConnectionStatus() {
		return {
			isAuthenticated: this.isAuthenticated,
			hasCurrentTrack: !!this.currentTrack,
			hasAudioFeatures: !!this.audioFeatures
		};
	}
}