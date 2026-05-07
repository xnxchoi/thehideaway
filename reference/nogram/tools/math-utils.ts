export default class MathUtils {
	public static roundToDecimal(value: number, numOfLeading: number) {
		const dec = Math.pow(10, numOfLeading);
		return Math.round(value * dec) / dec;
	}

	public static ceilToDecimal(value: number, numOfLeading: number) {
		const dec = Math.pow(10, numOfLeading);
		return Math.ceil(value * dec) / dec;
	}

	public static floorToDecimal(value: number, numOfLeading: number) {
		const dec = Math.pow(10, numOfLeading);
		return Math.floor(value * dec) / dec;
	}

	public static clamp(val: number, min = 0, max = 1) {
		return val > max ? max : val < min ? min : val;
	}

	public static ratioFromRatio(start: number, end: number, ratio: number, ignoreOverflow = false) {
		const diff = 1 / (end - start);
		const newRatio = diff * ratio - start * diff;
		return ignoreOverflow ? MathUtils.clamp(newRatio) : newRatio;
	}

	public static rotatePoint(cx: number, cy: number, x: number, y: number, angle: number) {
		const radians = (Math.PI / 180) * -angle;
		const cos = Math.cos(radians);
		const sin = Math.sin(radians);
		return {
			x: cos * (x - cx) + sin * (y - cy) + cx,
			y: cos * (y - cy) - sin * (x - cx) + cy
		};
	}

	/*
	 * mulberry32 algorithm
	 */
	public static seededRandom(seed: number) {
		let t = (seed += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	public static smoothenPoint(
		point: { x: number; y: number },
		prePoint: { x: number; y: number },
		nextPoint: { x: number; y: number },
		amount: number,
		fixedAngle = 0
	) {
		let anglePre: number = Math.atan2(point.y - prePoint.y, point.x - prePoint.x);
		let angleNext: number = Math.atan2(point.y - nextPoint.y, point.x - nextPoint.x);

		if (fixedAngle) {
			anglePre =
				((Math.round((anglePre * 180) / Math.PI / fixedAngle) * fixedAngle) / 180) * Math.PI;
			angleNext =
				((Math.round((angleNext * 180) / Math.PI / fixedAngle) * fixedAngle) / 180) * Math.PI;
		}

		const angleDiff: number = anglePre - angleNext;
		const minAngle: number = Math.min(Math.abs(angleDiff - Math.PI), Math.abs(angleDiff + Math.PI));
		const angleAmount: number = Math.atan(minAngle);

		return [
			{
				x: point.x - Math.cos(anglePre) * amount * angleAmount,
				y: point.y - Math.sin(anglePre) * amount * angleAmount
			},
			{
				x: point.x - Math.cos(angleNext) * amount * angleAmount,
				y: point.y - Math.sin(angleNext) * amount * angleAmount
			}
		];
	}

	public static randomRange(min: number, max: number) {
		return Math.random() * (max - min) + min;
	}

	public static randomPointInCircle(radius: number, offsetX = 0, offsetY = 0) {
		const r = radius * Math.sqrt(Math.random());
		const theta = Math.random() * 2 * Math.PI;
		return { x: offsetX + r * Math.cos(theta), y: offsetY + r * Math.sin(theta) };
	}
}
