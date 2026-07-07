/*
 * Color Space Conversion Utility
 *
 * This module converts colors between different color spaces, primarily
 * from HSL (Hue, Saturation, Lightness) to RGB (Red, Green, Blue).
 *
 * In the context of the Matrix, different color spaces represent different
 * ways of perceiving and manipulating the digital reality. HSL provides
 * intuitive control over color properties that users can understand,
 * while RGB represents the raw pixel values needed by computer graphics.
 *
 * @param {Object} colorSpec - Color specification object
 * @param {string} colorSpec.space - Color space ("rgb" or "hsl")
 * @param {Array<number>} colorSpec.values - Color values in the specified space
 * @returns {Array<number>} RGB color values [red, green, blue] in range 0-1
 */
export default ({ space, values }) => {
	/*
	 * RGB Pass-Through
	 * If color is already in RGB space, return values as-is.
	 * No conversion needed - we're already in the machine's native format.
	 */
	if (space === "rgb") {
		return values;
	}

	/*
	 * HSL to RGB Conversion Algorithm
	 *
	 * This implements the standard HSL-to-RGB conversion using the
	 * "alternative formula" which is more computationally efficient.
	 *
	 * The algorithm works by:
	 * 1. Calculate chroma (color intensity) based on saturation and lightness
	 * 2. Use a helper function to determine RGB components based on hue position
	 * 3. Apply lightness adjustment to achieve final RGB values
	 */
	const [hue, saturation, lightness] = values;

	/*
	 * Chroma Calculation
	 * Chroma represents the "colorfulness" - how far the color deviates from gray.
	 * Formula: C = S × (1 - |2L - 1|)
	 * This ensures maximum chroma occurs at 50% lightness (L=0.5).
	 */
	const a = saturation * Math.min(lightness, 1 - lightness);

	/*
	 * RGB Component Calculator Function
	 *
	 * This helper function calculates each RGB component based on the hue value.
	 * The hue is treated as a position on a color wheel (0-1 maps to 0-360 degrees).
	 *
	 * @param {number} n - Component offset (0 for red, 8 for green, 4 for blue)
	 * @returns {number} RGB component value in range 0-1
	 */
	const f = (n) => {
		/*
		 * Hue Wheel Position Calculation
		 * Convert hue (0-1) to position on 12-segment color wheel
		 * and apply component offset to find this component's position
		 */
		const k = (n + hue * 12) % 12;

		/*
		 * Piecewise Linear RGB Calculation
		 * The color wheel is divided into 6 main segments, each covering 2 units.
		 * This formula determines how much of the chroma contributes to this
		 * RGB component based on the wheel position:
		 * - Full chroma when k is in the component's primary range
		 * - Linear interpolation during transitions
		 * - No contribution when far from the component's range
		 */
		return lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
	};

	/*
	 * RGB Component Generation
	 * Apply the helper function with appropriate offsets:
	 * - f(0): Red component (starts at hue position 0)
	 * - f(8): Green component (starts at hue position 8/12 = 240 degrees)
	 * - f(4): Blue component (starts at hue position 4/12 = 120 degrees)
	 */
	return [f(0), f(8), f(4)];
};
