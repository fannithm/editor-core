import { Editor } from './Editor';

export class Constants {
	private _width: number;
	private _height: number;
	private _resolution = window.devicePixelRatio;
	private _fontSize = 18;
	private _paddingX = 4;
	private _paddingY = 2;
	private _heightPerSecond = 500;
	private _lineWidth = 1;
	private _invisibleLineWidth = 3;
	private _cursorLineWidth = 3;
	private _noteHeight = 32;
	private _arrowHeight = 32;

	constructor(public editor: Editor) {
		const { width, height } = this.editor.container.getBoundingClientRect();

		this._width = width;
		this._height = height;
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
		return this.heightPerSecond * this.editor.audioManager.totalTime + this.spaceY * 2;
	}

	public get resolution(): number {
		return this._resolution;
	}

	public set resolution(resolution: number) {
		this._resolution = resolution;
	}

	public get fontSizeRaw(): number {
		return this._fontSize;
	}

	public set fontSizeRaw(fontSize: number) {
		this._fontSize = fontSize;
	}

	public get fontSize(): number {
		return this._fontSize / this.resolution;
	}

	public get paddingXRaw(): number {
		return this._paddingX;
	}

	public set paddingXRaw(paddingX: number) {
		this._paddingX = paddingX;
	}

	public get paddingX(): number {
		return this._paddingX / this.resolution;
	}

	public get paddingYRaw(): number {
		return this._paddingY;
	}

	public set paddingYRaw(paddingY: number) {
		this._paddingY = paddingY;
	}

	public get paddingY(): number {
		return this._paddingY / this.resolution;
	}

	public get heightPerSecondRaw(): number {
		return this._heightPerSecond;
	}

	public set heightPerSecondRaw(heightPerSecond: number) {
		if (heightPerSecond < 100 || heightPerSecond > 2000) return;
		const time = (this.editor.scrollController.scrollBottom - this.spaceY) / this._heightPerSecond;
		this._heightPerSecond = heightPerSecond;
		// console.log(heightPerSecond);
		this.editor.scrollController.scrollTo(time * this._heightPerSecond + this.spaceY);
		this.editor.renderer.parseAndRender();
	}

	public get heightPerSecond(): number {
		return this._heightPerSecond / this.resolution;
	}

	public get spaceY(): number {
		return this.heightPerSecond / 2;
	}

	public get lineWidthRaw(): number {
		return this._lineWidth;
	}

	public set lineWidthRaw(lineWidth: number) {
		this._lineWidth = lineWidth;
	}

	public get lineWidth(): number {
		return this._lineWidth / this.resolution;
	}

	public get invisibleLineWidthRaw(): number {
		return this._invisibleLineWidth;
	}

	public set invisibleLineWidthRaw(invisibleLineWidth: number) {
		this._invisibleLineWidth = invisibleLineWidth;
	}

	public get invisibleLineWidth(): number {
		return this._invisibleLineWidth / this.resolution;
	}

	public get cursorLineWidthRaw(): number {
		return this._cursorLineWidth;
	}

	public set cursorLineWidthRaw(cursorLineWidth: number) {
		this._cursorLineWidth = cursorLineWidth;
	}

	public get cursorLineWidth(): number {
		return this._cursorLineWidth / this.resolution;
	}

	public get noteHeightRaw(): number {
		return this._noteHeight;
	}

	public set noteHeightRaw(noteHeight: number) {
		this._noteHeight = noteHeight;
	}

	public get noteHeight(): number {
		return this._noteHeight / this.resolution;
	}

	public get arrowHeightRaw(): number {
		return this._arrowHeight;
	}

	public set arrowHeightRaw(arrowHeight: number) {
		this._arrowHeight = arrowHeight;
	}

	public get arrowHeight(): number {
		return this._arrowHeight / this.resolution;
	}
}

