/**
 * Music Integration for Matrix Rain
 * Applies music data to Matrix visualization parameters
 */

export default class MusicIntegration {
	constructor(config = {}) {
		this.config = {
			influenceColors: true,
			influenceSpeed: true,
			influenceBrightness: true,
			sensitivity: 1.0,
			...config
		};
		
		this.audioFeatures = null;
		this.trackInfo = null;
		this.baseConfig = null; // Original Matrix config without music modifications
		this.isActive = false;
		
		// Smoothing for parameter changes
		this.smoothedEnergy = 0;
		this.smoothedTempo = 120;
		this.smoothedDanceability = 0.5;
		this.smoothedValence = 0.5;
		
		// Smoothing factors
		this.smoothingFactor = 0.1;
		
		// Beat detection
		this.lastBeatTime = 0;
		this.beatThreshold = 0.7;
	}

	/**
	 * Set the base Matrix configuration
	 */
	setBaseConfig(config) {
		this.baseConfig = { ...config };
	}

	/**
	 * Update configuration
	 */
	updateConfig(newConfig) {
		this.config = { ...this.config, ...newConfig };
	}

	/**
	 * Update audio features from Spotify
	 */
	updateAudioFeatures(features) {
		this.audioFeatures = features;
		
		if (features) {
			// Smooth the values to avoid jarring changes
			this.smoothedEnergy = this.lerp(this.smoothedEnergy, features.energy || 0, this.smoothingFactor);
			this.smoothedTempo = this.lerp(this.smoothedTempo, features.tempo || 120, this.smoothingFactor);
			this.smoothedDanceability = this.lerp(this.smoothedDanceability, features.danceability || 0.5, this.smoothingFactor);
			this.smoothedValence = this.lerp(this.smoothedValence, features.valence || 0.5, this.smoothingFactor);
		}
	}

	/**
	 * Update track information
	 */
	updateTrackInfo(trackInfo) {
		this.trackInfo = trackInfo;
	}

	/**
	 * Activate music integration
	 */
	activate() {
		this.isActive = true;
	}

	/**
	 * Deactivate music integration
	 */
	deactivate() {
		this.isActive = false;
	}

	/**
	 * Get modified Matrix configuration based on music data
	 */
	getModifiedConfig() {
		if (!this.isActive || !this.audioFeatures || !this.baseConfig) {
			return this.baseConfig;
		}

		const modifiedConfig = { ...this.baseConfig };
		const sensitivity = this.config.sensitivity;

		// Influence animation speed based on tempo and energy
		if (this.config.influenceSpeed) {
			const tempoFactor = Math.max(0.3, Math.min(2.0, this.smoothedTempo / 120)); // Normalize to 120 BPM
			const energyFactor = 0.5 + (this.smoothedEnergy * 1.5); // 0.5 to 2.0 range
			
			modifiedConfig.animationSpeed = this.baseConfig.animationSpeed * 
				this.lerp(1.0, tempoFactor * energyFactor * sensitivity, 0.7);
			
			modifiedConfig.fallSpeed = this.baseConfig.fallSpeed * 
				this.lerp(1.0, energyFactor * sensitivity, 0.5);
			
			modifiedConfig.cycleSpeed = this.baseConfig.cycleSpeed * 
				this.lerp(1.0, (1 + this.smoothedEnergy) * sensitivity, 0.6);
		}

		// Influence brightness based on energy and valence
		if (this.config.influenceBrightness) {
			const brightnessMultiplier = 1 + (this.smoothedEnergy * 0.5 + this.smoothedValence * 0.3) * sensitivity;
			modifiedConfig.baseBrightness = this.baseConfig.baseBrightness * brightnessMultiplier;
			modifiedConfig.cursorIntensity = this.baseConfig.cursorIntensity * 
				this.lerp(1.0, brightnessMultiplier, 0.4);
		}

		// Influence colors based on audio features
		if (this.config.influenceColors) {
			modifiedConfig.palette = this.generateMusicInfluencedPalette();
			
			// Modify cursor color based on valence (mood)
			const hueShift = this.smoothedValence * 60 * sensitivity; // 0-60 degree shift
			modifiedConfig.cursorColor = this.shiftHue(this.baseConfig.cursorColor, hueShift);
		}

		// Beat-reactive effects
		const beatPulse = this.getBeatPulse();
		if (beatPulse > 0) {
			// Enhance bloom on beat
			modifiedConfig.bloomStrength = this.baseConfig.bloomStrength * (1 + beatPulse * 0.3 * sensitivity);
			
			// Brief brightness boost on beat
			modifiedConfig.baseBrightness = modifiedConfig.baseBrightness * (1 + beatPulse * 0.2 * sensitivity);
		}

		// Danceability affects raindrop characteristics
		const danceInfluence = this.smoothedDanceability * sensitivity;
		modifiedConfig.raindropLength = this.baseConfig.raindropLength * 
			this.lerp(1.0, 1 + danceInfluence * 0.5, 0.3);

		return modifiedConfig;
	}

	/**
	 * Generate color palette influenced by music
	 */
	generateMusicInfluencedPalette() {
		if (!this.baseConfig.palette) {
			return this.baseConfig.palette;
		}

		const basePalette = this.baseConfig.palette;
		const modifiedPalette = basePalette.map((colorStop, index) => {
			let hueShift = 0;
			let saturationMultiplier = 1;
			let lightnessMultiplier = 1;

			// Valence affects hue (mood -> color warmth)
			hueShift += (this.smoothedValence - 0.5) * 30 * this.config.sensitivity;

			// Energy affects saturation and lightness
			saturationMultiplier = 1 + (this.smoothedEnergy - 0.5) * 0.4 * this.config.sensitivity;
			lightnessMultiplier = 1 + (this.smoothedEnergy - 0.5) * 0.3 * this.config.sensitivity;

			// Danceability adds some color variation
			if (index % 2 === 0) {
				hueShift += this.smoothedDanceability * 15 * this.config.sensitivity;
			}

			return {
				...colorStop,
				color: this.modifyColor(colorStop.color, hueShift, saturationMultiplier, lightnessMultiplier)
			};
		});

		return modifiedPalette;
	}

	/**
	 * Get beat pulse value (0-1) based on tempo
	 */
	getBeatPulse() {
		if (!this.audioFeatures || !this.audioFeatures.tempo) {
			return 0;
		}

		const now = Date.now() / 1000;
		const beatsPerSecond = this.smoothedTempo / 60;
		const beatPhase = (now * beatsPerSecond) % 1;
		
		// Create a pulse that peaks at each beat
		const pulse = Math.max(0, 1 - (beatPhase * 4)); // Sharp peak, quick decay
		
		// Only return pulse if energy is high enough
		return this.smoothedEnergy > this.beatThreshold ? pulse : 0;
	}

	/**
	 * Modify a color with hue shift and multipliers
	 */
	modifyColor(color, hueShift, saturationMultiplier, lightnessMultiplier) {
		if (color.space === 'hsl') {
			return {
				space: 'hsl',
				values: [
					(color.values[0] + hueShift / 360) % 1, // Hue (normalized 0-1)
					Math.max(0, Math.min(1, color.values[1] * saturationMultiplier)), // Saturation
					Math.max(0, Math.min(1, color.values[2] * lightnessMultiplier))  // Lightness
				]
			};
		} else if (color.space === 'rgb') {
			// Convert RGB to HSL, modify, then convert back
			const hsl = this.rgbToHsl(color.values);
			const modifiedHsl = [
				(hsl[0] + hueShift) % 360,
				Math.max(0, Math.min(100, hsl[1] * saturationMultiplier)),
				Math.max(0, Math.min(100, hsl[2] * lightnessMultiplier))
			];
			const rgb = this.hslToRgb(modifiedHsl);
			
			return {
				space: 'rgb',
				values: rgb
			};
		}

		return color;
	}

	/**
	 * Shift hue of a color
	 */
	shiftHue(color, hueShift) {
		return this.modifyColor(color, hueShift, 1, 1);
	}

	/**
	 * Linear interpolation
	 */
	lerp(a, b, t) {
		return a + (b - a) * t;
	}

	/**
	 * Convert RGB to HSL
	 */
	rgbToHsl(rgb) {
		let [r, g, b] = rgb.map(x => x / 255);
		
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		let h, s, l = (max + min) / 2;

		if (max === min) {
			h = s = 0; // achromatic
		} else {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			
			switch (max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}

		return [h * 360, s * 100, l * 100];
	}

	/**
	 * Convert HSL to RGB
	 */
	hslToRgb(hsl) {
		let [h, s, l] = [hsl[0] / 360, hsl[1] / 100, hsl[2] / 100];

		const hue2rgb = (p, q, t) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1/6) return p + (q - p) * 6 * t;
			if (t < 1/2) return q;
			if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		};

		let r, g, b;

		if (s === 0) {
			r = g = b = l; // achromatic
		} else {
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		}

		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}

	/**
	 * Get current music influence data for debugging
	 */
	getInfluenceData() {
		if (!this.isActive || !this.audioFeatures) {
			return null;
		}

		return {
			energy: this.smoothedEnergy,
			tempo: this.smoothedTempo,
			danceability: this.smoothedDanceability,
			valence: this.smoothedValence,
			beatPulse: this.getBeatPulse(),
			isActive: this.isActive
		};
	}
}