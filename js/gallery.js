/*
 * Matrix Gallery System
 *
 * "I can only show you the door. You're the one that has to walk through it."
 * 
 * This module provides a slideshow gallery of different Matrix shader effects,
 * automatically cycling through various configurations to showcase the full
 * range of visual possibilities.
 */

/**
 * Gallery configuration - defines all the shader variations to showcase
 * Each entry specifies a unique combination of version, effect, and parameters
 */
export const galleryItems = [
	{
		title: "Classic Matrix",
		description: "The iconic green code rain from the original trilogy",
		config: {
			version: "classic",
			effect: "palette",
		},
	},
	{
		title: "Matrix Resurrections",
		description: "Updated glyphs from the 2021 film",
		config: {
			version: "resurrections",
			effect: "palette",
		},
	},
	{
		title: "3D Volumetric Mode",
		description: "Glyphs falling through three-dimensional space",
		config: {
			version: "3d",
			effect: "palette",
		},
	},
	{
		title: "Operator Console",
		description: "Flat, crowded Matrix code as seen on operators' screens",
		config: {
			version: "operator",
			effect: "palette",
		},
	},
	{
		title: "Nightmare Matrix",
		description: "The harsh, Hobbesian predecessor Matrix",
		config: {
			version: "nightmare",
			effect: "palette",
		},
	},
	{
		title: "Paradise Matrix",
		description: "The idyllic but flawed predecessor",
		config: {
			version: "paradise",
			effect: "palette",
		},
	},
	{
		title: "Rainbow Spectrum",
		description: "Colorful variation with rainbow gradients",
		config: {
			version: "classic",
			effect: "rainbow",
		},
	},
	{
		title: "Light Spectrum",
		description: "Physics-inspired color gradients",
		config: {
			version: "classic",
			effect: "spectrum",
		},
	},
	{
		title: "Custom Stripes (RGB)",
		description: "Red, orange, yellow, and green vertical bands",
		config: {
			version: "classic",
			effect: "stripes",
			stripeColors: "1,0,0,1,1,0,0,1,0",
		},
	},
	{
		title: "Trinity Mode",
		description: "Dedicated to the One who believed",
		config: {
			version: "trinity",
			effect: "palette",
		},
	},
	{
		title: "Morpheus Mode",
		description: "What if I told you... this was another Matrix variant",
		config: {
			version: "morpheus",
			effect: "palette",
		},
	},
	{
		title: "Megacity",
		description: "As seen in the opening of Revolutions",
		config: {
			version: "megacity",
			effect: "palette",
		},
	},
	{
		title: "Palimpsest",
		description: "Custom variant inspired by Rob Dougan's Furious Angels",
		config: {
			version: "palimpsest",
			effect: "palette",
		},
	},
	{
		title: "Twilight",
		description: "A mysterious custom variant",
		config: {
			version: "twilight",
			effect: "palette",
		},
	},
	{
		title: "Debug View",
		description: "Behind-the-scenes computational visualization",
		config: {
			version: "classic",
			effect: "none",
		},
	},
];

/**
 * Gallery State Manager
 * Handles slideshow progression and timing
 */
export class GalleryManager {
	constructor(slideDuration = 8000) {
		this.currentIndex = 0;
		this.slideDuration = slideDuration;
		this.intervalId = null;
		this.isPaused = false;
		this.overlayElement = null;
	}

	/**
	 * Start the gallery slideshow
	 * @param {Function} onSlideChange - Callback when slide changes
	 */
	start(onSlideChange) {
		this.onSlideChange = onSlideChange;
		this.createOverlay();
		this.showCurrentSlide();
		
		// Auto-advance every slideDuration milliseconds
		this.intervalId = setInterval(() => {
			if (!this.isPaused) {
				this.next();
			}
		}, this.slideDuration);
	}

	/**
	 * Stop the gallery slideshow
	 */
	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.removeOverlay();
	}

	/**
	 * Move to the next slide
	 */
	next() {
		this.currentIndex = (this.currentIndex + 1) % galleryItems.length;
		this.showCurrentSlide();
	}

	/**
	 * Move to the previous slide
	 */
	previous() {
		this.currentIndex = (this.currentIndex - 1 + galleryItems.length) % galleryItems.length;
		this.showCurrentSlide();
	}

	/**
	 * Display the current slide
	 */
	showCurrentSlide() {
		const item = galleryItems[this.currentIndex];
		if (this.onSlideChange) {
			this.onSlideChange(item, this.currentIndex);
		}
		this.updateOverlay(item, this.currentIndex);
	}

	/**
	 * Create the gallery information overlay
	 */
	createOverlay() {
		if (this.overlayElement) return;

		const overlay = document.createElement("div");
		overlay.id = "gallery-overlay";
		overlay.style.cssText = `
			position: fixed;
			bottom: 20px;
			left: 20px;
			right: 20px;
			background: rgba(0, 0, 0, 0.85);
			color: #00ff41;
			padding: 20px;
			border: 1px solid #00ff41;
			font-family: 'Courier New', monospace;
			font-size: 14px;
			z-index: 10000;
			box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
			max-width: 600px;
			margin: 0 auto;
		`;

		overlay.innerHTML = `
			<div id="gallery-info">
				<h2 style="margin: 0 0 10px 0; color: #00ff41; font-size: 18px;"></h2>
				<p style="margin: 0 0 10px 0; color: #88ff88;"></p>
				<div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
					<span id="gallery-counter" style="color: #00ff41;"></span>
					<div style="display: flex; gap: 10px;">
						<button id="gallery-prev" style="background: #003300; color: #00ff41; border: 1px solid #00ff41; padding: 5px 15px; cursor: pointer; font-family: 'Courier New', monospace;">← Prev</button>
						<button id="gallery-pause" style="background: #003300; color: #00ff41; border: 1px solid #00ff41; padding: 5px 15px; cursor: pointer; font-family: 'Courier New', monospace;">⏸ Pause</button>
						<button id="gallery-next" style="background: #003300; color: #00ff41; border: 1px solid #00ff41; padding: 5px 15px; cursor: pointer; font-family: 'Courier New', monospace;">Next →</button>
					</div>
				</div>
			</div>
		`;

		document.body.appendChild(overlay);
		this.overlayElement = overlay;

		// Set up button event listeners
		document.getElementById("gallery-prev").addEventListener("click", () => this.previous());
		document.getElementById("gallery-next").addEventListener("click", () => this.next());
		document.getElementById("gallery-pause").addEventListener("click", () => this.togglePause());

		// Keyboard controls
		document.addEventListener("keydown", (e) => {
			if (e.key === "ArrowLeft") this.previous();
			if (e.key === "ArrowRight") this.next();
			if (e.key === " ") {
				e.preventDefault();
				this.togglePause();
			}
			if (e.key === "Escape") this.stop();
		});
	}

	/**
	 * Remove the gallery overlay
	 */
	removeOverlay() {
		if (this.overlayElement) {
			this.overlayElement.remove();
			this.overlayElement = null;
		}
	}

	/**
	 * Update the overlay with current slide information
	 */
	updateOverlay(item, index) {
		if (!this.overlayElement) return;

		const info = this.overlayElement.querySelector("#gallery-info");
		info.querySelector("h2").textContent = item.title;
		info.querySelector("p").textContent = item.description;
		info.querySelector("#gallery-counter").textContent = `${index + 1} / ${galleryItems.length}`;
	}

	/**
	 * Toggle pause state
	 */
	togglePause() {
		this.isPaused = !this.isPaused;
		const btn = document.getElementById("gallery-pause");
		if (btn) {
			btn.textContent = this.isPaused ? "▶ Play" : "⏸ Pause";
		}
	}
}

/**
 * Build a URL with the configuration parameters for a gallery item
 * @param {Object} item - Gallery item configuration
 * @returns {string} URL query string
 */
export function buildGalleryURL(item) {
	const params = new URLSearchParams();
	Object.entries(item.config).forEach(([key, value]) => {
		params.set(key, value);
	});
	params.set("suppressWarnings", "true");
	return `?${params.toString()}`;
}
