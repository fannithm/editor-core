import { Editor } from './Editor';
import { Fraction } from '@fannithm/utils';
import { FlickDirection } from '@fannithm/const/dist/pjsk';

export class CursorManager {
	private _critical = false;
	private _width = 4;
	public direction = FlickDirection.Up;
	private _type = EditorCursorType.Default;
	public positionX: number;
	public positionY: Fraction;

	constructor(private editor: Editor) {
	}

	/**
	 * Calculate the current position of the cursor.
	 */
	calculateCursorPosition(): void {
		const mouseHeight = this.editor.scrollController.scrollBottom + this.editor.const.height - this.editor.handler.lastMousePosition.y;
		let lastNegative = 0;
		let lastBeat = this.editor.fraction([0, 0, 1]);
		const beatSlice = this.editor.beatSlice;
		// 1/beatSlice beat per loop
		for (let i = 0; ; i++) {
			const beat = this.editor.fraction([Math.floor(i / beatSlice), i % beatSlice, beatSlice]);
			const height = this.editor.calculator.getHeightByBeat(beat, this.editor.timeLineManager.prime);
			if (height < mouseHeight) {
				lastNegative = mouseHeight - height;
				lastBeat = beat;
				continue;
			}
			if (height >= mouseHeight) {
				const positive = height - mouseHeight;
				const x = this.editor.handler.lastMousePosition.x - this.editor.calculator.getLaneX(0);
				const cursorLane = Math.floor(x / (this.editor.const.width * 0.06));
				const cursorBeat = positive < lastNegative ? beat : lastBeat;
				if (cursorLane != this.positionX || !cursorBeat.eq(this.positionY)) {
					this.positionX = cursorLane;
					this.positionY = cursorBeat;
					this.editor.event.dispatchCursorMoveEvent();
				}
				return;
			}
		}
	}


	get type(): EditorCursorType {
		return this._type;
	}

	set type(value: EditorCursorType) {
		if (this._type === EditorCursorType.Default && value !== this._type) {
			this.editor.selectionManager.emptySelection();
		}
		this._type = value;
		this.editor.renderer.parseAndRender();
	}

	get width(): number {
		return this._width;
	}

	set width(value: number) {
		this._width = Math.max(1, Math.min(12, value));
		this.editor.renderer.parseAndRender();
	}

	get critical(): boolean {
		return this._critical;
	}

	set critical(value: boolean) {
		this._critical = value;
		this.editor.renderer.parseAndRender();
	}
}


export enum EditorCursorType {
	Default = 0,
	Tap = 1,
	Flick = 2,
	Slide = 3,
	BPM = 4
}
