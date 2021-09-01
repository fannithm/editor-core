import { Container, Graphics } from 'pixi.js';

export default class Cursor extends Container {
	constructor(lineWidth: number, cursorWidth: number, color: number) {
		super();
		this.name = 'Cursor';
		this.draw(lineWidth, cursorWidth, color);
	}

	draw(lineWidth: number, cursorWidth: number, color: number): void {
		const cursorX = new Graphics();
		cursorX.lineStyle(lineWidth, color)
		cursorX.moveTo(0, 0);
		cursorX.lineTo(cursorWidth, 0);
		this.addChild(cursorX);
		const cursorY = new Graphics();
		cursorY.lineStyle(lineWidth, color)
		cursorY.moveTo(0, 0);
		cursorY.lineTo(0, cursorWidth);
		cursorY.x = cursorWidth / 2;
		cursorY.y = -cursorWidth / 2;
		this.addChild(cursorY);
	}
}
