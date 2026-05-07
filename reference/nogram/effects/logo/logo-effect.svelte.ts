import { untrack } from 'svelte';
import { Renderer } from './renderer';
import { Row } from './row';
import MathUtils from '../../tools/math-utils';

export type Effect = {
	numOfRows: number;
	space: number;
	color: string;
	min: number;
	max: number;
	range: number;
	movement: number;
	stretch: {
		amount: number;
		speed: number;
		wave: number;
	};
	drag: number;
};

export class LogoEffect {
	public effect: Effect = $state({
		numOfRows: 4,
		space: 20,
		color: '#287123',
		min: 1,
		max: 8,
		range: 8,
		movement: 0,
		stretch: {
			amount: 0,
			speed: 0,
			wave: 0
		},
		drag: 1
	});

	private readonly renderer;
	private displacementMap?: CanvasRenderingContext2D;
	private canvas?: HTMLCanvasElement;
	private resizeObserver?: ResizeObserver;
	private rows: Row[] = [];

	private seedOffset = Math.random() * 1000;

	constructor() {
		this.renderer = new Renderer();

		$effect(() => {
			const numOfRows = this.effect.numOfRows;
			untrack(() => {
				this.redraw(numOfRows);
			});
		});
		$effect(() => {
			const space = this.effect.space;
			this.rows.forEach((row) => {
				row.space = space;
			});
			untrack(() => {
				this.renderer.tick();
			});
		});

		$effect(() => {
			this.renderer.color = this.effect.color;
		});

		$effect(() => {
			const drag = this.effect.drag;
			this.rows.forEach((row) => {
				row.drag = drag;
			});
		});

		$effect(() => {
			const stretch = this.effect.stretch;
			this.rows.forEach((row) => {
				row.stretch = stretch;
			});
			untrack(() => {
				this.renderer.tick();
			});
		});

		const seedOffset = Math.random() * 1000;

		$effect(() => {
			const velocity = this.effect.movement;
			this.rows.forEach((row, i) => {
				const random = MathUtils.seededRandom(seedOffset + i);
				row.lines.velocity = velocity * random - velocity / 2;
			});
		});

		$effect(() => {
			const max = this.effect.max;
			const min = this.effect.min;
			const range = this.effect.range;
			this.rows.forEach((row) => {
				row.min = min;
				row.max = max;
				row.range = range;
			});
			untrack(() => {
				this.renderer.tick();
			});
		});
	}

	private drawRows() {
		while (this.rows.length > this.effect.numOfRows) {
			const pop = this.rows.length % 2 === 0;
			if (pop) {
				this.rows.pop();
			} else {
				this.rows.shift();
			}
		}
		while (this.rows.length < this.effect.numOfRows) {
			const push = this.rows.length % 2 === 0;
			if (push) {
				this.rows.push(new Row());
			} else {
				this.rows.unshift(new Row());
			}
		}
		return this.rows;
	}

	private redraw = (numOfRows?: number) => {
		numOfRows = numOfRows ?? this.effect.numOfRows;
		if (!this.canvas) return;
		this.drawRows();

		this.renderer.setRows(this.rows);

		// NOTE: we scale with 1.5 because of the page zoom effect on the site.
		const width = this.canvas.offsetWidth * window.devicePixelRatio * 1.5;
		const height = this.canvas.offsetHeight * window.devicePixelRatio * 1.5;
		if (!width || !height) return;

		this.canvas.width = width;
		this.canvas.height = height;

		for (let i = 0; i < this.rows.length; i++) {
			const row = this.rows[i];
			const rowHeight = height / numOfRows;

			row.y = rowHeight * i;
			row.canvasWidth = width ?? 0;
			row.canvasHeight = height ?? 0;
			row.height = rowHeight;
			row.scale = width / 100;

			row.stretch = this.effect.stretch;

			row.min = this.effect.min;
			row.max = this.effect.max;
			row.range = this.effect.range;

			const random = MathUtils.seededRandom(this.seedOffset + i);
			const velocity = this.effect.movement;
			row.lines.velocity = velocity * random - velocity / 2;

			row.space = this.effect.space;
			if (this.displacementMap) row.addDisplacement(this.displacementMap);
		}

		this.renderer.tick();
	};

	public setDisplacementMap(image: CanvasRenderingContext2D) {
		this.displacementMap = image;
		this.renderer.setDisplacementMap(image);
		this.redraw();
	}

	public setCanvas(element: HTMLCanvasElement) {
		this.canvas = element;

		if (this.canvas) this.resizeObserver?.unobserve(this.canvas);
		this.resizeObserver = new ResizeObserver(() => this.redraw());
		this.renderer.setCanvas(this.canvas);
		this.redraw();
	}

	public start() {
		if (this.canvas) this.resizeObserver?.observe(this.canvas);
		this.renderer.start();
	}
	public stop() {
		if (this.canvas) this.resizeObserver?.unobserve(this.canvas);
		this.renderer.stop();
	}
}
