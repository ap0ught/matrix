#!/usr/bin/env node

/**
 * Gallery Screenshot Generator
 * 
 * "I can only show you the door" - This script captures screenshots of each
 * Matrix shader configuration for the gallery.
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Import gallery configuration
const galleryItems = [
	{
		title: "Classic Matrix",
		filename: "classic-matrix.png",
		config: { version: "classic", effect: "palette" },
	},
	{
		title: "Matrix Resurrections",
		filename: "resurrections.png",
		config: { version: "resurrections", effect: "palette" },
	},
	{
		title: "3D Volumetric Mode",
		filename: "3d-volumetric.png",
		config: { version: "3d", effect: "palette" },
	},
	{
		title: "Operator Console",
		filename: "operator.png",
		config: { version: "operator", effect: "palette" },
	},
	{
		title: "Nightmare Matrix",
		filename: "nightmare.png",
		config: { version: "nightmare", effect: "palette" },
	},
	{
		title: "Paradise Matrix",
		filename: "paradise.png",
		config: { version: "paradise", effect: "palette" },
	},
	{
		title: "Rainbow Spectrum",
		filename: "rainbow.png",
		config: { version: "classic", effect: "rainbow" },
	},
	{
		title: "Light Spectrum",
		filename: "spectrum.png",
		config: { version: "classic", effect: "spectrum" },
	},
	{
		title: "Custom Stripes (RGB)",
		filename: "stripes-rgb.png",
		config: { version: "classic", effect: "stripes", stripeColors: "1,0,0,1,1,0,0,1,0" },
	},
	{
		title: "Trinity Mode",
		filename: "trinity.png",
		config: { version: "trinity", effect: "palette" },
	},
	{
		title: "Morpheus Mode",
		filename: "morpheus.png",
		config: { version: "morpheus", effect: "palette" },
	},
	{
		title: "Megacity",
		filename: "megacity.png",
		config: { version: "megacity", effect: "palette" },
	},
	{
		title: "Palimpsest",
		filename: "palimpsest.png",
		config: { version: "palimpsest", effect: "palette" },
	},
	{
		title: "Twilight",
		filename: "twilight.png",
		config: { version: "twilight", effect: "palette" },
	},
	{
		title: "Debug View",
		filename: "debug.png",
		config: { version: "classic", effect: "none" },
	},
];

/**
 * Build URL with configuration parameters
 */
function buildURL(config) {
	const params = new URLSearchParams();
	Object.entries(config).forEach(([key, value]) => {
		params.set(key, value);
	});
	params.set("suppressWarnings", "true");
	return `http://localhost:8000/?${params.toString()}`;
}

/**
 * Main execution
 */
async function main() {
	console.log("Starting gallery screenshot generation...");
	
	// Create gallery directory
	const galleryDir = path.join(process.cwd(), 'gallery');
	if (!fs.existsSync(galleryDir)) {
		fs.mkdirSync(galleryDir, { recursive: true });
	}

	// Launch browser
	const browser = await chromium.launch({
		headless: true,
		args: ['--disable-dev-shm-usage']
	});
	
	const context = await browser.newContext({
		viewport: { width: 1920, height: 1080 },
		deviceScaleFactor: 1,
	});

	const page = await context.newPage();

	// Generate screenshots for each gallery item
	for (let i = 0; i < galleryItems.length; i++) {
		const item = galleryItems[i];
		console.log(`[${i + 1}/${galleryItems.length}] Capturing: ${item.title}`);

		try {
			const url = buildURL(item.config);
			await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
			
			// Wait for the animation to settle (5 seconds)
			await page.waitForTimeout(5000);
			
			// Take screenshot
			const screenshotPath = path.join(galleryDir, item.filename);
			await page.screenshot({
				path: screenshotPath,
				fullPage: false,
				type: 'png',
			});
			
			console.log(`  ✓ Saved to ${item.filename}`);
		} catch (error) {
			console.error(`  ✗ Error capturing ${item.title}:`, error.message);
		}
	}

	await browser.close();
	
	console.log("\n✨ Gallery screenshot generation complete!");
	console.log(`📁 Screenshots saved to: ${galleryDir}`);
}

main().catch(error => {
	console.error("Fatal error:", error);
	process.exit(1);
});
