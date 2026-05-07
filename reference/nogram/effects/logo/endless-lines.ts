import { Line } from './row';

export class EndlessLines {
	public lines: Line[] = [];
	public width: number = 0;
	public space: number = 20;
	public scrollX: number = 0;
	public x: number = 0;
	public y: number = 0;
	public stretch: number = 1;
	public velocity: number = 0.4 * Math.random() - 0.2;

	public pivot: number = 0.5;

	private totalWidth: number = 0;

	private updateRow() {
		const numOfLines = Math.floor((this.width + this.space) / this.space) * 4;
		// const numOfLines = Math.floor(this.totalWidth / this.space);

		while (this.lines.length < numOfLines) {
			const line = new Line();
			this.lines.push(line);
		}
		while (this.lines.length > numOfLines) {
			const pop = this.lines.length % 2 === 0;
			if (pop) {
				const line = this.lines.pop();
				if (!line) break;
			} else {
				const line = this.lines.shift();
				if (!line) break;
			}
		}
	}

	private updateStatic() {
		let x = this.x;
		this.lines.forEach((line) => {
			line.staticX = x;
			line.staticY = this.y;
			x += this.space;
		});
		this.totalWidth = x * this.stretch;
	}

	public tick = () => {
		this.updateRow();
		this.updateStatic();

		const offset = this.totalWidth - this.width;
		this.x = this.x % this.totalWidth;

		this.lines.forEach((line) => {
			line.x = line.staticX - offset * this.pivot + this.scrollX;
			line.x *= this.stretch;
			while (line.x < -offset * 0.5) {
				line.x += this.totalWidth;
			}
			while (line.x > this.totalWidth - offset * 0.5) {
				line.x -= this.totalWidth;
			}
		});
	};
}
