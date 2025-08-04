/**
 * Music Visualizer Minimap for Matrix Rain
 * Creates a corner overlay that visualizes audio features and track information
 */

export default class MusicVisualizer {
	constructor(container, config = {}) {
		this.container = container;
		this.config = {
			position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
			width: 300,
			height: 200,
			margin: 20,
			backgroundColor: 'rgba(0, 0, 0, 0.8)',
			borderColor: 'rgba(0, 255, 0, 0.3)',
			textColor: '#00ff00',
			barColor: '#00ff00',
			...config
		};
		
		this.element = null;
		this.canvas = null;
		this.ctx = null;
		this.trackInfo = null;
		this.audioFeatures = null;
		this.isVisible = false;
		this.animationId = null;
		
		// Animation state
		this.bars = [];
		this.beatPulse = 0;
		this.energyLevel = 0;
		this.lastUpdate = Date.now();
		
		this.init();
	}

	/**
	 * Initialize the visualizer UI
	 */
	init() {
		this.createElement();
		this.setupCanvas();
		this.hide(); // Start hidden
	}

	/**
	 * Create the main visualizer element
	 */
	createElement() {
		this.element = document.createElement('div');
		this.element.className = 'music-visualizer';
		this.element.style.cssText = `
			position: fixed;
			width: ${this.config.width}px;
			height: ${this.config.height}px;
			background: ${this.config.backgroundColor};
			border: 1px solid ${this.config.borderColor};
			border-radius: 8px;
			z-index: 1000;
			display: flex;
			flex-direction: column;
			font-family: monospace;
			color: ${this.config.textColor};
			box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
			backdrop-filter: blur(5px);
			transition: opacity 0.3s ease;
		`;
		
		this.setPosition(this.config.position);
		
		// Track info container
		const trackInfo = document.createElement('div');
		trackInfo.className = 'track-info';
		trackInfo.style.cssText = `
			padding: 10px;
			border-bottom: 1px solid ${this.config.borderColor};
			min-height: 60px;
			display: flex;
			align-items: center;
			gap: 10px;
		`;
		
		// Album art
		const albumArt = document.createElement('img');
		albumArt.className = 'album-art';
		albumArt.style.cssText = `
			width: 40px;
			height: 40px;
			border-radius: 4px;
			object-fit: cover;
			display: none;
		`;
		
		// Track details
		const trackDetails = document.createElement('div');
		trackDetails.className = 'track-details';
		trackDetails.style.cssText = `
			flex: 1;
			overflow: hidden;
		`;
		
		const trackTitle = document.createElement('div');
		trackTitle.className = 'track-title';
		trackTitle.style.cssText = `
			font-size: 12px;
			font-weight: bold;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		`;
		
		const trackArtist = document.createElement('div');
		trackArtist.className = 'track-artist';
		trackArtist.style.cssText = `
			font-size: 10px;
			opacity: 0.7;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		`;
		
		trackDetails.appendChild(trackTitle);
		trackDetails.appendChild(trackArtist);
		trackInfo.appendChild(albumArt);
		trackInfo.appendChild(trackDetails);
		
		// Canvas for visualizations
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.config.width;
		this.canvas.height = this.config.height - 60; // Account for track info height
		this.canvas.style.cssText = `
			width: 100%;
			height: 100%;
			display: block;
		`;
		
		this.element.appendChild(trackInfo);
		this.element.appendChild(this.canvas);
		this.container.appendChild(this.element);
	}

	/**
	 * Setup canvas context
	 */
	setupCanvas() {
		this.ctx = this.canvas.getContext('2d');
		this.initializeBars();
	}

	/**
	 * Initialize visualization bars
	 */
	initializeBars() {
		const barCount = 16;
		this.bars = [];
		
		for (let i = 0; i < barCount; i++) {
			this.bars.push({
				height: 0,
				targetHeight: 0,
				x: (this.canvas.width / barCount) * i,
				width: (this.canvas.width / barCount) - 2
			});
		}
	}

	/**
	 * Set visualizer position
	 */
	setPosition(position) {
		const { margin } = this.config;
		
		switch (position) {
			case 'top-left':
				this.element.style.top = `${margin}px`;
				this.element.style.left = `${margin}px`;
				break;
			case 'top-right':
				this.element.style.top = `${margin}px`;
				this.element.style.right = `${margin}px`;
				break;
			case 'bottom-left':
				this.element.style.bottom = `${margin}px`;
				this.element.style.left = `${margin}px`;
				break;
			case 'bottom-right':
			default:
				this.element.style.bottom = `${margin}px`;
				this.element.style.right = `${margin}px`;
				break;
		}
		
		this.config.position = position;
	}

	/**
	 * Update track information
	 */
	updateTrackInfo(trackData) {
		this.trackInfo = trackData;
		
		if (!trackData || !trackData.item) {
			this.hide();
			return;
		}
		
		const track = trackData.item;
		const albumArt = this.element.querySelector('.album-art');
		const trackTitle = this.element.querySelector('.track-title');
		const trackArtist = this.element.querySelector('.track-artist');
		
		// Update track details
		trackTitle.textContent = track.name;
		trackArtist.textContent = track.artists.map(artist => artist.name).join(', ');
		
		// Update album art
		if (track.album.images && track.album.images.length > 0) {
			albumArt.src = track.album.images[track.album.images.length - 1].url; // Smallest image
			albumArt.style.display = 'block';
		} else {
			albumArt.style.display = 'none';
		}
		
		this.show();
	}

	/**
	 * Update audio features for visualization
	 */
	updateAudioFeatures(features) {
		this.audioFeatures = features;
		
		if (features) {
			// Update energy level for visualizations
			this.energyLevel = features.energy || 0;
			
			// Create bar heights based on audio features
			const tempo = features.tempo || 120;
			const energy = features.energy || 0.5;
			const danceability = features.danceability || 0.5;
			const valence = features.valence || 0.5;
			
			// Generate pseudo-spectrum based on audio features
			for (let i = 0; i < this.bars.length; i++) {
				const frequencyFactor = i / this.bars.length;
				let barHeight = 0;
				
				// Low frequencies influenced by energy and danceability
				if (frequencyFactor < 0.3) {
					barHeight = (energy * 0.7 + danceability * 0.3) * 0.8;
				}
				// Mid frequencies influenced by tempo and energy
				else if (frequencyFactor < 0.7) {
					barHeight = (tempo / 200 * 0.5 + energy * 0.5) * 0.6;
				}
				// High frequencies influenced by valence and energy
				else {
					barHeight = (valence * 0.6 + energy * 0.4) * 0.7;
				}
				
				// Add some randomness for animation
				barHeight += (Math.random() - 0.5) * 0.2;
				barHeight = Math.max(0, Math.min(1, barHeight));
				
				this.bars[i].targetHeight = barHeight * (this.canvas.height - 20);
			}
		}
	}

	/**
	 * Start animation loop
	 */
	startAnimation() {
		if (this.animationId) {
			return;
		}
		
		const animate = () => {
			this.update();
			this.render();
			this.animationId = requestAnimationFrame(animate);
		};
		
		animate();
	}

	/**
	 * Stop animation loop
	 */
	stopAnimation() {
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
	}

	/**
	 * Update animation state
	 */
	update() {
		const now = Date.now();
		const deltaTime = (now - this.lastUpdate) / 1000;
		this.lastUpdate = now;
		
		// Smooth bar transitions
		for (let bar of this.bars) {
			const diff = bar.targetHeight - bar.height;
			bar.height += diff * 0.1; // Smooth transition
		}
		
		// Beat pulse effect based on tempo
		if (this.audioFeatures && this.audioFeatures.tempo) {
			const beatsPerSecond = this.audioFeatures.tempo / 60;
			this.beatPulse = Math.sin(now / 1000 * beatsPerSecond * Math.PI * 2) * 0.5 + 0.5;
		}
	}

	/**
	 * Render the visualization
	 */
	render() {
		if (!this.ctx) return;
		
		// Clear canvas
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		
		// Draw bars
		this.ctx.fillStyle = this.config.barColor;
		
		for (let bar of this.bars) {
			const height = bar.height;
			const alpha = 0.6 + (this.beatPulse * 0.4); // Pulse with beat
			
			this.ctx.globalAlpha = alpha;
			this.ctx.fillRect(
				bar.x,
				this.canvas.height - height,
				bar.width,
				height
			);
		}
		
		// Draw audio features info
		if (this.audioFeatures) {
			this.ctx.globalAlpha = 0.8;
			this.ctx.fillStyle = this.config.textColor;
			this.ctx.font = '10px monospace';
			
			const features = [
				`Energy: ${(this.audioFeatures.energy * 100).toFixed(0)}%`,
				`Tempo: ${this.audioFeatures.tempo.toFixed(0)} BPM`,
				`Dance: ${(this.audioFeatures.danceability * 100).toFixed(0)}%`,
				`Mood: ${(this.audioFeatures.valence * 100).toFixed(0)}%`
			];
			
			features.forEach((text, index) => {
				this.ctx.fillText(text, 5, this.canvas.height - 45 + (index * 12));
			});
		}
		
		// Reset alpha
		this.ctx.globalAlpha = 1;
	}

	/**
	 * Show the visualizer
	 */
	show() {
		if (!this.isVisible) {
			this.isVisible = true;
			this.element.style.opacity = '1';
			this.element.style.pointerEvents = 'auto';
			this.startAnimation();
		}
	}

	/**
	 * Hide the visualizer
	 */
	hide() {
		if (this.isVisible) {
			this.isVisible = false;
			this.element.style.opacity = '0';
			this.element.style.pointerEvents = 'none';
			this.stopAnimation();
		}
	}

	/**
	 * Toggle visibility
	 */
	toggle() {
		if (this.isVisible) {
			this.hide();
		} else {
			this.show();
		}
	}

	/**
	 * Update visualizer configuration
	 */
	updateConfig(newConfig) {
		this.config = { ...this.config, ...newConfig };
		
		// Apply position change if specified
		if (newConfig.position) {
			this.setPosition(newConfig.position);
		}
		
		// Apply size changes if specified
		if (newConfig.width || newConfig.height) {
			this.element.style.width = `${this.config.width}px`;
			this.element.style.height = `${this.config.height}px`;
			this.canvas.width = this.config.width;
			this.canvas.height = this.config.height - 60;
			this.initializeBars();
		}
	}

	/**
	 * Get current visualization data for Matrix integration
	 */
	getVisualizationData() {
		if (!this.audioFeatures) {
			return null;
		}
		
		return {
			energy: this.audioFeatures.energy,
			tempo: this.audioFeatures.tempo,
			danceability: this.audioFeatures.danceability,
			valence: this.audioFeatures.valence,
			beatPulse: this.beatPulse,
			bars: this.bars.map(bar => bar.height / (this.canvas.height - 20))
		};
	}

	/**
	 * Cleanup
	 */
	destroy() {
		this.stopAnimation();
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
	}
}