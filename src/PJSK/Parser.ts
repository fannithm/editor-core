import Editor from "./Editor";
import { NoteType } from "@fannithm/const/dist/pjsk";

/**
 * parse map to editor render object
 */
export default class Parser {
	public renderObjects: IRenderObjects;

	constructor(private editor: Editor) {
		this.renderObjects = {
			lanes: [12, 6],
			beatLines: [],
			texts: [],
			notes: [],
			curves: [],
			arrows: [],
			visibleNodes: [],
			invisibleNodes: []
		};
	}

	parse(): IRenderObjects {
		this.parseBeatLines();
		this.addTimeText();
		this.parseNotes();
		return this.renderObjects;
	}

	private parseBeatLines() {
		const slice = this.editor.beatSlice;
		// 1/beatSlice beat per loop
		for (let i = 0; ; i++) {
			const beat = this.editor.fraction([Math.floor(i / slice), i % slice, slice]);
			const time = this.editor.calculator.getTimeByBeat(beat);
			const height = this.editor.calculator.getHeightByTime(time);
			if (height > this.editor.const.maxHeight - this.editor.const.spaceY) break;
			const object: IRenderBeatLineObject = {
				name: `BeatLine - ${beat.decimal}`,
				x: this.editor.calculator.getLaneX(0),
				width: this.editor.calculator.getLaneWidth(12),
				scrollHeight: height,
				color: 0,
				alpha: 0
			};
			if (i % slice === 0) {
				object.color = this.editor.color.beatLineWhole;
				object.alpha = this.editor.color.beatLineWholeAlpha;
				object.width = this.editor.const.width - this.editor.calculator.getLaneX(0);
				this.renderObjects.texts.push({
					name: `BeatLineText - ${beat.decimal}`,
					x: this.editor.const.width - this.editor.const.paddingX,
					fontSize: this.editor.const.fontSize,
					scrollHeight: height + this.editor.const.paddingY,
					alignX: 'right',
					alignY: 'bottom',
					color: this.editor.color.beatLineWhole,
					alpha: this.editor.color.beatLineWholeAlpha,
					text: `${Math.floor((beat[0]) / 4) + 1}:${beat[0] % 4 + 1}`
				});
			} else if (i % (slice / 2) === 0) {
				object.color = this.editor.color.beatLineHalf;
				object.alpha = this.editor.color.beatLineHalfAlpha;
			} else if (i % (slice / 3) === 0) {
				object.color = this.editor.color.beatLineThird;
				object.alpha = this.editor.color.beatLineThirdAlpha;
			} else if (i % (slice / 4) === 0) {
				object.color = this.editor.color.beatLineQuarter;
				object.alpha = this.editor.color.beatLineQuarterAlpha;
			} else continue;
			this.renderObjects.beatLines.push(object);
		}
	}

	private addTimeText() {
		// TODO "00:00.000";
	}

	private parseNotes() {
		for (let i = 0; i < this.map.notes.length; i++) {
			/* const note = this.map.notes[i];
			const height = this.editor.calculator.getHeightByBeat(this.editor.fraction(note.beat));
			if (note.type === NoteType.Flick) this.ro.arrows.push(note, height);
			this.ro.notes.push(note, note.critical ? 'critical' : (note.type ? 'flick' : 'tap'), height); */
			// if (this.selection.single.includes(note.id) || this.tempSelection.single.includes(note.id)) {
			// 	this.drawSelectionRect(note, height);
			// }
		}
	}

	private get map() {
		return this.editor.map;
	}
}

export interface IRenderObjects {
	/**
	 * lane number, width per lane (percent)
	 */
	lanes: [number, number],
	beatLines: IRenderBeatLineObject[];
	texts: IRenderTextObject[];
	notes: IRenderNoteObject[];
	curves: IRenderCurveObject[];
	arrows: IRenderArrowObject[];
	visibleNodes: IRenderVisibleNodeObject[];
	invisibleNodes: IRenderInvisibleNodeObject[];
}

export interface IRenderBeatLineObject {
	name: string;
	x: number;
	width: number;
	scrollHeight: number;
	color: number;
	alpha: number;
}

export interface IRenderTextObject {
	name: string;
	x: number;
	scrollHeight: number;
	alignX?: 'left' | 'center' | 'right';
	alignY?: 'top' | 'middle' | 'bottom';
	fontSize: number;
	color: number;
	alpha: number;
	text: string;
}

export interface IRenderNoteObject {
	name: string;
	x: number;
	width: number;
	scrollHeight: number;
	texture: string;
	id: string;
	alpha: number;
}

export interface IRenderCurveObject {
	name: string;
	x: number;
	startWidth: number;
	startScrollHeight: number;
	endWidth: number;
	endScrollHeight: number;
	color: number;
	id: string;
	alpha: number;
}

export interface IRenderArrowObject {
	name: string;
	x: number;
	width: number;
	scrollHeight: number;
	texture: string;
	id: string;
}

export interface IRenderVisibleNodeObject {
	name: string;
	x: number;
	width: number;
	scrollHeight: number;
	texture: string;
	id: string;
}

export interface IRenderInvisibleNodeObject {
	name: string;
	x: number;
	width: number;
	scrollHeight: number;
	color: number;
	id: string;
}
