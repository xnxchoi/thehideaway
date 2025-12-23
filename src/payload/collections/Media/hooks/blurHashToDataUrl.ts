import {decode} from "blurhash";
import sharp from "sharp";

/**
 * Converts a blurhash string to a PNG Base64 Data URI
 */
export async function blurhashToDataURI({hash, width = 32, height = 32}: {
	hash: string;
	width?: number;
	height?: number;
}) {
	// 1. Decode the blurhash to raw pixels (Uint8ClampedArray)
	// Keep width/height small (e.g. 32x32) for better performance & smaller DOM size
	const pixels = decode(hash, width, height);

	// 2. Use Sharp to wrap raw pixels in a PNG container
	const pngBuffer = await sharp(pixels, {
		raw: {
			width,
			height,
			channels: 4, // R, G, B, Alpha
		},
	})
		.png() // Encode as PNG
		.toBuffer();

	// 3. Return the Data URI
	return `data:image/png;base64,${pngBuffer.toString("base64")}`;
}