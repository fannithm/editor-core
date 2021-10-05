import { Editor } from './Editor';
import { Fraction } from '@fannithm/utils';
import { FlickDirection } from '@fannithm/const/dist/pjsk';
import { IRenderNoteObject } from './Parser';

export class CursorManager {
	private _critical = false;
	private _width = 4;
	public direction = FlickDirection.Up;
	private _type = EditorCursorType.Default;
	public positionX: number;
	public positionY: Fraction;
	public object: IRenderNoteObject = {
		alpha: 0,
		id: 'CursorNote',
		name: 'CursorNote',
		scrollHeight: 0,
		texture: 'tap',
		x: 0,
		width: 0
	};

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

	/**
	 * Update parser object for renderer to render cursor note
	 */
	public updateObject(): void {
		const visible = (this.positionX >= 0 && this.positionX <= 11) && (![EditorCursorType.Default, EditorCursorType.BPM].includes(this.type));
		const lane = Math.min(12 - this.width, Math.max(0, this.positionX - Math.floor(this.width / 2)));
		this.object.alpha = visible ? 0.8 : 0;
		this.object.scrollHeight = this.editor.calculator.getHeightByBeat(this.positionY, this.editor.timeLineManager.prime);
		this.object.texture = this.critical ? 'critical' : {
			[EditorCursorType.Tap]: 'tap',
			[EditorCursorType.Flick]: 'flick',
			[EditorCursorType.Slide]: 'slide'
		}[this.type] || 'tap';
		this.object.x = this.editor.calculator.getLaneX(lane - 0.1);
		this.object.width = this.editor.calculator.getLaneWidth(this.width + 0.2);
		this.editor.renderer.render();
	}


	get type(): EditorCursorType {
		return this._type;
	}

	set type(value: EditorCursorType) {
		if (this._type === EditorCursorType.Default && value !== this._type) {
			this.editor.selectionManager.emptySelection();
		}
		this._type = value;
		this.updateObject();
	}

	get width(): number {
		return this._width;
	}

	set width(value: number) {
		this._width = Math.max(1, Math.min(12, value));
		this.updateObject();
	}

	get critical(): boolean {
		return this._critical;
	}

	set critical(value: boolean) {
		this._critical = value;
		this.updateObject();
	}
}


export enum EditorCursorType {
	Default = 0,
	Tap = 1,
	Flick = 2,
	Slide = 3,
	BPM = 4
}
