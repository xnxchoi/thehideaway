import { EndlessLines } from './endless-lines';

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export class Line {
	public width: number = 0;
	public height: number = 0;
	public x: number = 0;
	public y: number = 0;

	public staticX: number = 0;
	public staticY: number = 0;

	public toString() {
		return `x: ${this.x}, y: ${this.y}, width: ${this.width}, height: ${this.height}`;
	}

	constructor(public readonly staticRect?: Rect) {
		if (staticRect) {
			this.width = staticRect.width;
			this.height = staticRect.height;
			this.x = staticRect.x;
			this.y = staticRect.y;
		}
	}
}

export class Row {
	private map?: CanvasRenderingContext2D;

	public min: number = 1;
	public max: number = 8;
	public range: number = 8;

	public canvasHeight: number = 0;
	public canvasWidth: number = 0;
	public height: number = 0;
	public y: number = 0;
	public space: number = 6;
	public scale: number = 1;

	public drag: number = 4;

	public stretch = {
		amount: 0,
		speed: 0.03,
		wave: 0
	};

	public velocity: number = 0;

	public lines: EndlessLines = new EndlessLines();

	private imageData?: ImageData;
	private imageWidth: number = 0;
	private imageHeight: number = 0;

	public addDisplacement(map: CanvasRenderingContext2D) {
		this.map = map;
		this.imageData = map.getImageData(0, 0, map.canvas.width, map.canvas.height);
		this.imageWidth = this.imageData.width;
		this.imageHeight = this.imageData.height;
	}

	public getContrastAt(x: number) {
		if (!this.imageData) return 0;
		if (!this.canvasWidth || !this.canvasHeight) return 0;

		const scaleX = this.imageWidth / this.canvasWidth;
		const scaleY = this.imageHeight / this.canvasHeight;

		// Calculate the pixel index in the image data array
		const index =
			(Math.floor((this.y + this.height * 0.5) * scaleY) * this.imageWidth +
				Math.floor(x * scaleX)) *
			4;

		if (index < 0 || index + 2 >= this.imageData.data.length) return 1;

		// Get RGB values from the cached image data
		const r = this.imageData.data[index];
		const g = this.imageData.data[index + 1];
		const b = this.imageData.data[index + 2];

		// Calculate grayscale value using luminance formula
		return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
	}

	public getWidthAt(x: number) {
		if (!this.map) return 1;

		const size = this.max * this.scale;
		const min = this.min * this.scale;
		const range = this.range * this.scale;

		const fromX = Math.floor(x - range / 2);
		const toX = Math.ceil(x + range / 2);

		let averageContrast = 0;
		for (let i = fromX; i < toX; i++) {
			averageContrast += this.getContrastAt(i);
		}
		const delta = toX - fromX - 1;
		if (delta > 1) {
			averageContrast /= delta;
		}

		let width = (1 - averageContrast) * size;
		if (width < min) width = min;
		return width;
	}

	private tick: number = 0;

	public render = (deltaTime: number) => {
		this.lines.space = this.space * this.scale;
		this.lines.y = this.y;
		this.lines.scrollX += this.lines.velocity * this.scale; // * deltaTime * 100;
		this.lines.width = this.canvasWidth;

		const speed = this.stretch.speed * 0.01;
		this.lines.stretch =
			1 +
			Math.sin(this.tick * speed + this.y * this.stretch.wave * 0.001) * this.stretch.amount * 0.01;

		this.lines.lines.forEach((line) => {
			const width = this.getWidthAt(line.x);
			const delta = line.width - width;

			if (this.drag < 1) {
				line.width = width;
			} else {
				line.width -= delta / this.drag;
			}

			line.height = this.height;
			line.y = this.y;
		});

		this.tick += deltaTime * 10;
		this.lines.tick();
	};
}
