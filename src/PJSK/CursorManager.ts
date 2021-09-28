import { Editor } from './Editor';
import { Fraction } from '@fannithm/utils';
import { FlickDirection } from '@fannithm/const/dist/pjsk';

export class CursorManager {
	public critical = false;
	public width = 3;
	public direction = FlickDirection.Up;
	private _type = EditorCursorType.Default;

	constructor(private editor: Editor) {
	}

	/**
	 * Get the current position of the cursor.
	 * @returns the beat and the lane of the cursor
	 */
	getCursorPosition(): [Fraction, number] {
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
				const lane = Math.floor(x / (this.editor.const.width * 0.06));
				return [positive < lastNegative ? beat : lastBeat, lane];
			}
		}
	}


	get type(): EditorCursorType {
		return this._type;
	}

	set type(value: EditorCursorType) {
		this._type = value;
		this.editor.renderer.cursorColor = {
			[EditorCursorType.Default]: this.editor.color.cursorDefault,
			[EditorCursorType.Tap]: this.critical ? this.editor.color.cursorCritical : this.editor.color.cursorTap,
			[EditorCursorType.Flick]: this.critical ? this.editor.color.cursorCritical : this.editor.color.cursorFlick,
			[EditorCursorType.Slide]: this.critical ? this.editor.color.cursorCritical : this.editor.color.cursorSlide,
			[EditorCursorType.BPM]: this.editor.color.cursorBpm
		}[value];
	}
}


export enum EditorCursorType {
	Default = 0,
	Tap = 1,
	Flick = 2,
	Slide = 3,
	BPM = 4
}
