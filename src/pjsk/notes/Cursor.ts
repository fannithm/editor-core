import { Container, Graphics, Texture } from 'pixi.js';

export default class Cursor extends Container {
	private cursorX: Graphics;
	private cursorY: Graphics;

	constructor(private lineWidth: number, private cursorWidth: number, private _lineColor: number, private textures: Record<string, Texture>) {
		super();
		this.name = 'Cursor';
		this.drawCursor();
	}

	private drawCursor(): void {
		this.cursorX = new Graphics();
		this.cursorX.lineStyle(this.lineWidth, this._lineColor);
		this.cursorX.moveTo(0, 0);
		this.cursorX.lineTo(this.cursorWidth, 0);
		this.addChild(this.cursorX);
		this.cursorY = new Graphics();
		this.cursorY.lineStyle(this.lineWidth, this._lineColor);
		this.cursorY.moveTo(0, 0);
		this.cursorY.lineTo(0, this.cursorWidth);
		this.cursorY.x = this.cursorWidth / 2;
		this.cursorY.y = -this.cursorWidth / 2;
		this.addChild(this.cursorY);
	}

	set lineColor(value: number) {
		this.removeChild(this.cursorX, this.cursorY);
		this.cursorX.destroy(true);
		this.cursorY.destroy(true);
		this._lineColor = value;
		this.drawCursor();
	}
}
