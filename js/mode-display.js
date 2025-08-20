/**
 * Matrix Mode Display UI
 * 
 * Shows the current Matrix version and effect being displayed,
 * along with controls for the screensaver mode functionality.
 */

export default class ModeDisplay {
	constructor(config = {}) {
		this.config = {
			position: 'top-right',
			autoHide: true,
			autoHideDelay: 5000,
			showControls: true,
			...config
		};
		
		this.element = null;
		this.isVisible = false;
		this.hideTimer = null;
		this.modeManager = null;
		this.callbacks = {
			toggleScreensaver: [],
			toggleSpotifyControls: []
		};
		
		this.init();
	}

	/**
	 * Initialize the mode display
	 */
	init() {
		this.createElement();
		this.setupEventListeners();
		
		if (this.config.autoHide) {
			this.scheduleAutoHide();
		}
	}

	/**
	 * Set the mode manager instance
	 */
	setModeManager(modeManager) {
		this.modeManager = modeManager;
		this.updateModeInfo();
		
		// Listen for mode changes
		modeManager.on('modeChange', () => {
			this.updateModeInfo();
			this.show(); // Show briefly when mode changes
			if (this.config.autoHide) {
				this.scheduleAutoHide();
			}
		});
	}

	/**
	 * Create the UI element
	 */
	createElement() {
		this.element = document.createElement('div');
		this.element.className = 'mode-display';
		this.element.style.cssText = this.getBaseStyles();
		
		this.element.innerHTML = `
			<div class="mode-header" style="cursor: pointer; padding: 8px; border-bottom: 1px solid rgba(0, 255, 0, 0.2); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
				<span class="mode-title">Matrix Mode</span>
				<span class="toggle-icon">◐</span>
			</div>
			<div class="mode-content" style="display: none;">
				<div class="current-mode" style="margin-bottom: 10px; padding: 5px 0;">
					<div class="mode-version" style="font-weight: bold; margin-bottom: 2px;">Version: <span class="version-name">Classic</span></div>
					<div class="mode-effect" style="font-size: 10px; opacity: 0.8;">Effect: <span class="effect-name">Mirror</span></div>
				</div>
				
				<div class="mode-controls" style="border-top: 1px solid rgba(0, 255, 0, 0.2); padding-top: 8px;">
					<label style="display: block; margin-bottom: 5px; font-size: 10px;">
						<input type="checkbox" class="screensaver-toggle" style="margin-right: 5px;" />
						Auto Mode Switching (10min)
					</label>
					<label style="display: block; margin-bottom: 5px; font-size: 10px;">
						<input type="checkbox" class="spotify-controls-toggle" style="margin-right: 5px;" />
						Show Spotify Controls
					</label>
					<button class="switch-mode-btn" style="width: 100%; padding: 4px; background: rgba(0, 255, 0, 0.2); border: 1px solid rgba(0, 255, 0, 0.3); color: #00ff00; font-family: monospace; font-size: 9px; border-radius: 3px; cursor: pointer; margin-top: 5px;">
						Switch Mode Now
					</button>
				</div>
				
				<div class="mode-info" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0, 255, 0, 0.1); font-size: 8px; opacity: 0.6;">
					<div class="next-switch-time"></div>
				</div>
			</div>
		`;
		
		document.body.appendChild(this.element);
	}

	/**
	 * Get base CSS styles for the element
	 */
	getBaseStyles() {
		const position = this.getPosition();
		return `
			position: fixed;
			${position.top ? `top: ${position.top}px;` : ''}
			${position.bottom ? `bottom: ${position.bottom}px;` : ''}
			${position.left ? `left: ${position.left}px;` : ''}
			${position.right ? `right: ${position.right}px;` : ''}
			background: rgba(0, 0, 0, 0.9);
			border: 1px solid rgba(0, 255, 0, 0.3);
			border-radius: 8px;
			padding: 5px;
			font-family: monospace;
			color: #00ff00;
			font-size: 11px;
			z-index: 1000;
			min-width: 180px;
			max-width: 250px;
			backdrop-filter: blur(5px);
			transition: all 0.3s ease;
			transform: ${this.getHiddenTransform()};
			opacity: 0.9;
		`;
	}

	/**
	 * Get position coordinates based on config
	 */
	getPosition() {
		const margin = 20;
		switch (this.config.position) {
			case 'top-left':
				return { top: margin, left: margin };
			case 'top-right':
				return { top: margin, right: margin };
			case 'bottom-left':
				return { bottom: margin, left: margin };
			case 'bottom-right':
				return { bottom: margin, right: margin };
			default:
				return { top: margin, right: margin };
		}
	}

	/**
	 * Get transform for hidden state
	 */
	getHiddenTransform() {
		switch (this.config.position) {
			case 'top-left':
			case 'bottom-left':
				return 'translateX(-90%)';
			case 'top-right':
			case 'bottom-right':
			default:
				return 'translateX(90%)';
		}
	}

	/**
	 * Setup event listeners
	 */
	setupEventListeners() {
		// Toggle panel expansion
		const header = this.element.querySelector('.mode-header');
		header.addEventListener('click', () => {
			this.toggleExpanded();
		});
		
		// Screensaver toggle
		const screensaverToggle = this.element.querySelector('.screensaver-toggle');
		screensaverToggle.addEventListener('change', (e) => {
			this.emit('toggleScreensaver', e.target.checked);
			if (this.modeManager) {
				if (e.target.checked) {
					this.modeManager.start();
				} else {
					this.modeManager.stop();
				}
			}
			this.updateNextSwitchTime();
		});
		
		// Spotify controls toggle
		const spotifyToggle = this.element.querySelector('.spotify-controls-toggle');
		spotifyToggle.addEventListener('change', (e) => {
			this.emit('toggleSpotifyControls', e.target.checked);
		});
		
		// Switch mode button
		const switchBtn = this.element.querySelector('.switch-mode-btn');
		switchBtn.addEventListener('click', () => {
			if (this.modeManager) {
				this.modeManager.switchToRandomMode();
			}
		});
		
		// Auto-hide on mouse leave
		this.element.addEventListener('mouseleave', () => {
			if (this.config.autoHide && this.isVisible) {
				this.scheduleAutoHide();
			}
		});
		
		// Cancel auto-hide on mouse enter
		this.element.addEventListener('mouseenter', () => {
			this.cancelAutoHide();
		});
		
		// Button hover effects
		this.element.addEventListener('mouseover', (e) => {
			if (e.target.tagName === 'BUTTON') {
				e.target.style.opacity = '0.8';
			}
		});
		
		this.element.addEventListener('mouseout', (e) => {
			if (e.target.tagName === 'BUTTON') {
				e.target.style.opacity = '1';
			}
		});
	}

	/**
	 * Toggle expanded state
	 */
	toggleExpanded() {
		const content = this.element.querySelector('.mode-content');
		const icon = this.element.querySelector('.toggle-icon');
		
		if (content.style.display === 'none') {
			this.show();
			content.style.display = 'block';
			icon.textContent = '◑';
			this.cancelAutoHide(); // Don't auto-hide when expanded
		} else {
			content.style.display = 'none';
			icon.textContent = '◐';
			if (this.config.autoHide) {
				this.scheduleAutoHide();
			}
		}
	}

	/**
	 * Show the mode display
	 */
	show() {
		this.isVisible = true;
		this.element.style.transform = 'translateX(0)';
		this.element.style.opacity = '0.9';
	}

	/**
	 * Hide the mode display
	 */
	hide() {
		this.isVisible = false;
		this.element.style.transform = this.getHiddenTransform();
		this.element.style.opacity = '0.7';
		
		// Collapse content when hiding
		const content = this.element.querySelector('.mode-content');
		const icon = this.element.querySelector('.toggle-icon');
		content.style.display = 'none';
		icon.textContent = '◐';
	}

	/**
	 * Schedule auto-hide
	 */
	scheduleAutoHide() {
		this.cancelAutoHide();
		if (this.config.autoHide) {
			this.hideTimer = setTimeout(() => {
				this.hide();
			}, this.config.autoHideDelay);
		}
	}

	/**
	 * Cancel auto-hide
	 */
	cancelAutoHide() {
		if (this.hideTimer) {
			clearTimeout(this.hideTimer);
			this.hideTimer = null;
		}
	}

	/**
	 * Update mode information display
	 */
	updateModeInfo() {
		if (!this.modeManager) return;
		
		const modeInfo = this.modeManager.getModeInfo();
		const versionElement = this.element.querySelector('.version-name');
		const effectElement = this.element.querySelector('.effect-name');
		
		if (versionElement) {
			versionElement.textContent = modeInfo.versionName;
		}
		if (effectElement) {
			effectElement.textContent = modeInfo.effectName;
		}
		
		this.updateNextSwitchTime();
	}

	/**
	 * Update next switch time display
	 */
	updateNextSwitchTime() {
		const nextSwitchElement = this.element.querySelector('.next-switch-time');
		const screensaverToggle = this.element.querySelector('.screensaver-toggle');
		
		if (!nextSwitchElement) return;
		
		if (screensaverToggle.checked && this.modeManager && this.modeManager.isActive) {
			const interval = this.modeManager.config.modeSwitchInterval || 600000;
			const minutes = Math.floor(interval / 60000);
			nextSwitchElement.textContent = `Next switch: ${minutes}min`;
		} else {
			nextSwitchElement.textContent = '';
		}
	}

	/**
	 * Set toggle states
	 */
	setToggleStates(screensaverEnabled, spotifyControlsVisible) {
		const screensaverToggle = this.element.querySelector('.screensaver-toggle');
		const spotifyToggle = this.element.querySelector('.spotify-controls-toggle');
		
		if (screensaverToggle) {
			screensaverToggle.checked = screensaverEnabled;
		}
		if (spotifyToggle) {
			spotifyToggle.checked = spotifyControlsVisible;
		}
		
		this.updateNextSwitchTime();
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
					console.error('Error in mode display event callback:', error);
				}
			});
		}
	}

	/**
	 * Cleanup
	 */
	destroy() {
		this.cancelAutoHide();
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
		this.callbacks = {};
	}
}