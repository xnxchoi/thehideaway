import type { Row } from './row';

export class Renderer {
	public rows: Row[] = [];
	public color: string = '#287123';

	private animationFrameId: number = -1;
	private canvas?: HTMLCanvasElement;
	private displacementMap?: CanvasRenderingContext2D;
	private lastTime: number = 0;
    private isStarted: boolean = false;

	public setDisplacementMap(image: CanvasRenderingContext2D) {
		this.displacementMap = image;
	}

	public setCanvas = (canvas: HTMLCanvasElement) => {
		this.canvas = canvas;
	};

	public setRows(rows: Row[]) {
		this.rows = rows;
	}

	public start = () => {
		this.isStarted = true;
		cancelAnimationFrame(this.animationFrameId);
		this.animationFrameId = requestAnimationFrame(this.tick);
	};

	public stop() {
		this.isStarted = false;
		cancelAnimationFrame(this.animationFrameId);
	}

	public tick = () => {
		if(!this.isStarted) return;
		const timestamp = performance.now();
		cancelAnimationFrame(this.animationFrameId);
		this.animationFrameId = requestAnimationFrame(this.tick);

		// Calculate delta time in seconds
		const deltaTime = (timestamp - this.lastTime) / 1000;
		this.lastTime = timestamp;

		if (!this.canvas) return;

		const ctx = this.canvas.getContext('2d');
		if (!ctx) return;

		// Clear the canvas
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Set drawing style
		ctx.fillStyle = this.color;

		if (this.displacementMap) {
			// ctx.drawImage(this.displacementMap.canvas, 0, 0, this.canvas.width, this.canvas.height);
		}

		// Draw each row's lines
		for (const row of this.rows) {
			row.render(deltaTime);

			for (const line of row.lines.lines) {
				if (line.width <= 0.05) continue;
				ctx.fillRect(
					line.x - line.width * 0.5,
					Math.floor(line.y),
					line.width,
					Math.ceil(line.height)
				);
			}
		}
	};
}
