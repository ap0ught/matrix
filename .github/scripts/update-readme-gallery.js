#!/usr/bin/env node

/**
 * Update README with Gallery Screenshots
 * 
 * "Free your mind" - This script updates the README.md with a gallery section
 * showcasing all the shader variations.
 */

const fs = require('fs');
const path = require('path');

const galleryItems = [
	{ title: "Classic Matrix", filename: "classic-matrix.png" },
	{ title: "Matrix Resurrections", filename: "resurrections.png" },
	{ title: "3D Volumetric Mode", filename: "3d-volumetric.png" },
	{ title: "Operator Console", filename: "operator.png" },
	{ title: "Nightmare Matrix", filename: "nightmare.png" },
	{ title: "Paradise Matrix", filename: "paradise.png" },
	{ title: "Rainbow Spectrum", filename: "rainbow.png" },
	{ title: "Light Spectrum", filename: "spectrum.png" },
	{ title: "Custom Stripes (RGB)", filename: "stripes-rgb.png" },
	{ title: "Trinity Mode", filename: "trinity.png" },
	{ title: "Morpheus Mode", filename: "morpheus.png" },
	{ title: "Megacity", filename: "megacity.png" },
	{ title: "Palimpsest", filename: "palimpsest.png" },
	{ title: "Twilight", filename: "twilight.png" },
	{ title: "Debug View", filename: "debug.png" },
];

/**
 * Generate gallery markdown section
 */
function generateGallerySection() {
	let markdown = '\n## 🎨 Gallery\n\n';
	markdown += '_Explore the full range of Matrix shader variations:_\n\n';
	markdown += '**[View Live Gallery Slideshow](https://ap0ught.github.io/matrix/?effect=gallery)**\n\n';
	
	// Create a grid of screenshots (3 per row)
	const itemsPerRow = 3;
	for (let i = 0; i < galleryItems.length; i += itemsPerRow) {
		const rowItems = galleryItems.slice(i, i + itemsPerRow);
		
		// Images row
		markdown += '| ';
		rowItems.forEach(item => {
			markdown += `![${item.title}](gallery/${item.filename}) | `;
		});
		markdown += '\n';
		
		// Separator row (only once)
		if (i === 0) {
			markdown += '| ';
			rowItems.forEach(() => {
				markdown += ':---: | ';
			});
			markdown += '\n';
		}
		
		// Titles row
		markdown += '| ';
		rowItems.forEach(item => {
			markdown += `**${item.title}** | `;
		});
		markdown += '\n\n';
	}
	
	return markdown;
}

/**
 * Main execution
 */
function main() {
	console.log("Updating README with gallery...");
	
	const readmePath = path.join(process.cwd(), 'README.md');
	
	if (!fs.existsSync(readmePath)) {
		console.error("README.md not found!");
		process.exit(1);
	}
	
	let readme = fs.readFileSync(readmePath, 'utf8');
	
	// Check if gallery section already exists
	const galleryMarkerStart = '## 🎨 Gallery';
	const galleryMarkerEnd = '## Customization';
	
	const gallerySection = generateGallerySection();
	
	if (readme.includes(galleryMarkerStart)) {
		// Replace existing gallery section
		const startIndex = readme.indexOf(galleryMarkerStart);
		const endIndex = readme.indexOf(galleryMarkerEnd);
		
		if (endIndex > startIndex) {
			readme = readme.substring(0, startIndex) + gallerySection + readme.substring(endIndex);
		}
	} else {
		// Insert before "Customization" section
		const customizationIndex = readme.indexOf(galleryMarkerEnd);
		if (customizationIndex !== -1) {
			readme = readme.substring(0, customizationIndex) + gallerySection + readme.substring(customizationIndex);
		}
	}
	
	fs.writeFileSync(readmePath, readme, 'utf8');
	
	console.log("✓ README.md updated with gallery section");
}

main();
