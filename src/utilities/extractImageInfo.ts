import {PayloadRequest} from "payload";
import {DateTime} from "luxon";
import sharp from "sharp";

export const extractImageInfo = async (args: {
	req: PayloadRequest;
}): Promise<{ darkmode: boolean } | { darkmode: null }> => {
	const req = args.req;

	if (!req.file) {
		req.payload.logger.error({
			message: "No file",
			origin: "extractImageInfo",
			date: DateTime.now().toISO(),
			user: req.user?.id,
		});
		return {darkmode: null};
	}

	if (req.file.mimetype.indexOf("image") < 0) {
		req.payload.logger.error({
			message: "Not an image",
			origin: "extractImageInfo",
			date: DateTime.now().toISO(),
			file: req.file.name,
			user: req.user?.id,
		});
		return {darkmode: null};
	}

	const image = sharp(req.file.data);

	const channelStats = (await image.stats()).channels;
	const r = channelStats[0]?.mean ?? 0;
	const g = channelStats[1]?.mean ?? 0;
	const b = channelStats[2]?.mean ?? 0;

	// Use standard Rec. 709 luminance formula
	const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

	const darkmode = luminance / 255 < 0.5;

	return {
		darkmode,
	};
};
