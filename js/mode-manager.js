/**
 * Matrix Screensaver Mode Manager
 * 
 * Handles automatic switching between different Matrix versions and effects
 * to create a screensaver-like experience with rotating visual modes.
 */

import { getRandomVersion, getAvailableModes, getAvailableEffects, versions } from './config.js';

export default class ModeManager {
	constructor(config = {}) {
		this.config = config;
		this.isActive = false;
		this.currentMode = {
			version: config.version || 'classic',
			effect: config.effect || 'mirror'
		};
		this.switchTimer = null;
		this.callbacks = {
			modeChange: []
		};
		
		// Get available modes
		this.availableModes = getAvailableModes();
		this.availableEffects = getAvailableEffects();
	}

	/**
	 * Start automatic mode switching
	 */
	start() {
		if (this.isActive || !this.config.screensaverMode) {
			return;
		}

		this.isActive = true;
		this.scheduleNextSwitch();
		console.log('Matrix screensaver mode started');
	}

	/**
	 * Stop automatic mode switching
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
		console.log('Matrix screensaver mode stopped');
	}

	/**
	 * Schedule the next mode switch
	 */
	scheduleNextSwitch() {
		if (!this.isActive) {
			return;
		}

		const interval = this.config.modeSwitchInterval || 600000; // Default 10 minutes
		this.switchTimer = setTimeout(() => {
			this.switchToRandomMode();
			this.scheduleNextSwitch();
		}, interval);
	}

	/**
	 * Switch to a random mode
	 */
	switchToRandomMode() {
		const randomVersion = this.getRandomVersionName();
		const randomEffect = this.getRandomEffect();
		
		const newMode = {
			version: randomVersion,
			effect: randomEffect
		};

		// Avoid switching to the same combination
		if (newMode.version === this.currentMode.version && 
			newMode.effect === this.currentMode.effect) {
			// Try again with a different combination
			return this.switchToRandomMode();
		}

		const MAX_RETRIES = 10;
		let attempt = 0;
		let newMode;
		do {
			const randomVersion = this.getRandomVersionName();
			const randomEffect = this.getRandomEffect();
			newMode = {
				version: randomVersion,
				effect: randomEffect
			};
			attempt++;
		} while (
			newMode.version === this.currentMode.version &&
			newMode.effect === this.currentMode.effect &&
			attempt < MAX_RETRIES
		);

		// Only switch if a new mode was found
		if (
			newMode.version !== this.currentMode.version ||
			newMode.effect !== this.currentMode.effect
		) {
			this.setMode(newMode);
		} else {
			console.warn('Could not find a different mode to switch to after maximum retries.');
		}
	}

	/**
	 * Get a random version name
	 */
	getRandomVersionName() {
		const availableModes = this.config.availableModes || this.availableModes;
		return availableModes[Math.floor(Math.random() * availableModes.length)];
	}

	/**
	 * Get a random effect name
	 */
	getRandomEffect() {
		return this.availableEffects[Math.floor(Math.random() * this.availableEffects.length)];
	}

	/**
	 * Set the current mode
	 */
	setMode(mode) {
		this.currentMode = { ...mode };
		this.emit('modeChange', this.currentMode);
		console.log(`Matrix mode switched to: ${mode.version} + ${mode.effect}`);
	}

	/**
	 * Get the current mode
	 */
	getCurrentMode() {
		return { ...this.currentMode };
	}

	/**
	 * Get mode display information
	 */
	getModeInfo() {
		const versionConfig = versions[this.currentMode.version] || {};
		const versionName = this.formatModeName(this.currentMode.version);
		const effectName = this.formatModeName(this.currentMode.effect);
		
		return {
			version: this.currentMode.version,
			versionName,
			effect: this.currentMode.effect,
			effectName,
			displayText: `${versionName} / ${effectName}`
		};
	}

	/**
	 * Format mode name for display
	 */
	formatModeName(name) {
		return name
			.split(/(?=[A-Z])|[_-]/) // Split on camelCase, underscores, and hyphens
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}

	/**
	 * Get available modes for configuration
	 */
	getAvailableModes() {
		return {
			versions: this.availableModes,
			effects: this.availableEffects
		};
	}

	/**
	 * Update configuration
	 */
	updateConfig(newConfig) {
		const wasActive = this.isActive;
		
		if (wasActive) {
			this.stop();
		}

		this.config = { ...this.config, ...newConfig };

		if (wasActive && this.config.screensaverMode) {
			this.start();
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
	 * Emit event to listeners
	 */
	emit(event, data) {
		if (this.callbacks[event]) {
			this.callbacks[event].forEach(callback => {
				try {
					callback(data);
				} catch (error) {
					console.error('Error in mode manager event callback:', error);
				}
			});
		}
	}

	/**
	 * Cleanup
	 */
	destroy() {
		this.stop();
		this.callbacks = {};
	}
}