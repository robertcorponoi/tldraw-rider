/**
 * Calculates the coordinates of the rotated top left corner of a rectangle
 * around its center
 *
 * @param {number} cx The center x-coordinate.
 * @param {number} cy The center y-coordinate.
 * @param {number} width The width of the rectangle.
 * @param {number} height The height of the rectangle.
 * @param {number} angle Rotation angle in radians.
 *
 * @returns {{ x: number; y: number }} The top-left corner position.
 */
export const getRotatedTopLeftForRectangle = (
	cx: number,
	cy: number,
	width: number,
	height: number,
	angle: number
): { x: number; y: number } => {
	// Half dimensions.
	const halfWidth = width / 2;
	const halfHeight = height / 2;

	// Offsets for the top-left corner relative to the center.
	const dx = -halfWidth;
	const dy = -halfHeight;

	// `dxRot` represents the x-coordinate offset after rotating.
	// `dx * Math.cos(angle)` projects the horizontal offset `dx` onto the
	// rotated x-axis.
	// `-dy * Math.sin(angle)` projects the vertical offset `dy` onto the
	// rotated x-axis, with the sign changed because the y-axis rotates
	// counterclockwise.
	//
	// `dyRot` represents the y-coordinate offset after rotating.
	// `dx * Math.sin(angle)` projects the horizontal offset `dx` onto the
	// rotated y-axis.
	// `dy * Math.cos(angle)` projects the vertical offset `dy` onto the
	// rotated y-axis.
	//
	// This part just calculates how the top left corner of the shape shifts
	// due to the rotation of the shape.
	const dxRot = dx * Math.cos(angle) - dy * Math.sin(angle);
	const dyRot = dx * Math.sin(angle) + dy * Math.cos(angle);

	// Add the rotated offsets to the center position of the shape to compute
	// the new absolute position of the top left corner of the shape and
	// return it.
	const x = cx + dxRot;
	const y = cy + dyRot;

	return { x, y };
};

/**
 * Rounds a number to a fixed number of digits.
 *
 * https://stackoverflow.com/a/29494612/4274475
 *
 * @param {number} num The number to round.
 * @param {number} digits The number of digits to round to.
 * @param {number} [base=10] The base to round to.
 *
 * @returns {number} The rounded number.
 */
export const toFixedNumber = (
	num: number,
	digits: number,
	base?: number
): number => {
	const pow = Math.pow(base ?? 10, digits);
	return Math.round(num * pow) / pow;
};

/**
 * Takes in an array of normalized RGB values (0–1) and returns a hexadecimal
 * color string.
 *
 * @param {[number,number,number]} normalizedRgb The normalized RGB values.
 *
 * @returns {string} The hexadecimal color string.
 */
export const rgbToHex = (normalizedRgb: [number, number, number]): string => {
	// Scale the normalized values to 0–255 and convert to integers.
	const scaledRgb = normalizedRgb.map((value) => Math.round(value * 255));

	// Format as a hexadecimal string.
	const hexColor = `#${scaledRgb
		.map((value) => value.toString(16).padStart(2, "0"))
		.join("")
		.toUpperCase()}`;

	return hexColor;
};
