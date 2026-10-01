/**
 * Shared utility functions for Matrix Digital Rain
 */

/**
 * Format a mode/version/effect name for display
 * Converts camelCase, snake_case, and kebab-case to Title Case
 *
 * @param {string} name - The name to format
 * @returns {string} Formatted name with spaces and title case
 *
 * @example
 * formatModeName("camelCase") // "Camel Case"
 * formatModeName("snake_case") // "Snake Case"
 * formatModeName("kebab-case") // "Kebab Case"
 */
export function formatModeName(name) {
	return name
		.split(/(?=[A-Z])|[_-]/) // Split on camelCase, underscores, and hyphens
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}
