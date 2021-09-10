import Editor from "./Editor";

export default class Constants {
	private _width: number;
	private _height: number;
	private _maxHeight: number;
	private _resolution: number;
	private _fontSize: number;
	private _paddingX: number;
	private _paddingY: number;
	private _heightPerSecond: number;
	private _lineWidth: number;
	private _cursorLineWidth: number;
	private _noteHeight: number;
	private _arrowHeight: number;

	constructor(public editor: Editor) {
		const { width, height } = this.editor.container.getBoundingClientRect();
		const resolution = window.devicePixelRatio;

		this.resolution = resolution;
		this.fontSize = 18 / resolution;
		this.heightPerSecond = 500 / resolution;
		this.maxHeight = this.heightPerSecond * time + this.spaceY * 2;
		this.width = width;
		this.height = height;
		this.paddingX = 4 / resolution;
		this.paddingY = 2 / resolution;
		this.lineWidth = 1 / resolution;
		this.noteHeight = 32 / resolution;
		this.arrowHeight = 32 / resolution;
		this.maxHeight = 0;
		this.cursorLineWidth = 3 / resolution;
	}

	public get width(): number {
		return this._width;
	}

	public set width(width: number) {
		this._width = width;
	}

	public get height(): number {
		return this._height;
	}

	public set height(height: number) {
		this._height = height;
	}

	public get maxHeight(): number {
		return this._maxHeight;
	}

	public set maxHeight(maxHeight: number) {
		this._maxHeight = maxHeight;
	}

	public get resolution(): number {
		return this._resolution;
	}

	public set resolution(resolution: number) {
		this._resolution = resolution;
	}

	public get fontSize(): number {
		return this._fontSize;
	}

	public set fontSize(fontSize: number) {
		this._fontSize = fontSize;
	}

	public get paddingX(): number {
		return this._paddingX;
	}

	public set paddingX(paddingX: number) {
		this._paddingX = paddingX;
	}

	public get paddingY(): number {
		return this._paddingY;
	}

	public set paddingY(paddingY: number) {
		this._paddingY = paddingY;
	}

	public get heightPerSecond(): number {
		return this._heightPerSecond * this.resolution;
	}

	public set heightPerSecond(heightPerSecond: number) {
		if (heightPerSecond < 100 || heightPerSecond > 2000) return;
		const time = (this.editor.scrollController.scrollBottom - this.spaceY) / this._heightPerSecond;
		this._heightPerSecond = heightPerSecond / this.resolution;
		this.maxHeight = this._heightPerSecond * this.time + this.spaceY * 2;
		this.editor.scrollController.scrollTo(time * this._heightPerSecond + this.spaceY);
		this.editor.renderer.render();
	}

	public get spaceY(): number {
		return this._heightPerSecond / 2;
	}

	public get lineWidth(): number {
		return this._lineWidth;
	}

	public set lineWidth(lineWidth: number) {
		this._lineWidth = lineWidth;
	}

	public get cursorLineWidth(): number {
		return this._cursorLineWidth;
	}

	public set cursorLineWidth(cursorLineWidth: number) {
		this._cursorLineWidth = cursorLineWidth;
	}

	public get noteHeight(): number {
		return this._noteHeight;
	}

	public set noteHeight(noteHeight: number) {
		this._noteHeight = noteHeight;
	}

	public get arrowHeight(): number {
		return this._arrowHeight;
	}

	public set arrowHeight(arrowHeight: number) {
		this._arrowHeight = arrowHeight;
	}
}

