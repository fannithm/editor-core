import { Editor } from './Editor';

/**
 * parse map to editor render object
 */
export class Parser {
	public renderObjects: IRenderObjects;

	constructor(private editor: Editor) {
		this.initRenderObjects();
	}

	private initRenderObjects(): void {
		this.renderObjects = {
			lanes: [],
			beatLines: [],
			texts: [],
			notes: [],
			curves: [],
			arrows: [],
			visibleNodes: [],
			invisibleNodes: []
		};
	}

	parse(): void {
		this.initRenderObjects();
		this.addLanes();
		if (this.map?.timelines.length > 0 && this.map?.bpms.length > 0) {
			// prime
			this.parseBeatLines();
			this.parseBPMLines();
			this.addTimeText();
			// visible
			this.parseNotes();
		}
	}

	private addLanes() {
		const laneNumber = 12;
		const laneWidth = 6;
		const leftSpace = (100 - (laneNumber * laneWidth)) / 2;
		for (let i = 0; i <= 12; i++) {
			this.renderObjects.lanes.push({
				name: `Lane-${i}`,
				x: this.editor.const.width * ((i * laneWidth + leftSpace) / 100),
				color: (i % 2) ? this.editor.color.secondaryLane : this.editor.color.primeLane,
				alpha: (i % 2) ? this.editor.color.secondaryLaneAlpha : this.editor.color.primeLaneAlpha
			});
		}
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
				name: `BeatLine-${beat.decimal}`,
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
					name: `BeatLineText-${beat.decimal}`,
					x: this.editor.const.width - this.editor.const.paddingX,
					fontSize: this.editor.const.fontSize,
					scrollHeight: height + this.editor.const.paddingY,
					alignX: 'right',
					alignY: 'bottom',
					color: this.editor.color.beatLineWhole,
					alpha: this.editor.color.beatLineWholeAlpha,
					text: `${Math.floor((beat.integer) / 4) + 1}:${beat.integer % 4 + 1}`
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

	private formatTime(time: number): string {
		return `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toFixed(3).padStart(6, '0')}`
	}

	private parseBPMLines() {
		const bpms = this.map.bpms.filter(v => v.timeline === this.editor.timeLineManager.prime);
		for (let i = 0; i < bpms.length; i++) {
			const bpm = bpms[i];
			const bpmTime = this.editor.calculator.getTimeByBeat(this.editor.fraction(bpm.beat));
			const bpmHeight = this.editor.calculator.getHeightByTime(bpmTime);
			// bpm line
			this.renderObjects.beatLines.push({
				name: `BPM-${bpm.id}-line`,
				x: 0,
				width: this.editor.const.width,
				scrollHeight: bpmHeight,
				color: this.editor.color.bpmLine,
				alpha: 1,
			});
			// bpm text
			this.renderObjects.texts.push({
				name: `BPM-${bpm.id}-time`,
				x: this.editor.const.paddingX,
				scrollHeight: bpmHeight + this.editor.const.paddingY,
				alignY: 'bottom',
				fontSize: this.editor.const.fontSize,
				color: this.editor.color.bpmLine,
				alpha: 1,
				text: this.formatTime(bpmTime)
			});
			// bpm value
			this.renderObjects.texts.push({
				name: `BPM-${bpm.id}-value`,
				x: this.editor.calculator.getLaneX(12) + this.editor.const.paddingX,
				scrollHeight: bpmHeight + this.editor.const.paddingY,
				alignY: 'bottom',
				fontSize: this.editor.const.fontSize,
				color: this.editor.color.bpmLine,
				alpha: 1,
				text: bpm.bpm.toString()
			});
		}
	}

	private addTimeText() {
		for (let i = 0; i <= this.editor.audioManager.totalTime; i++) {
			const height = this.editor.calculator.getHeightByTime(i);
			const text = this.formatTime(i);
			if (this.renderObjects.texts.some(v => v.text === text)) continue;
			this.renderObjects.texts.push({
				name: `Time-${i}`,
				x: this.editor.const.paddingX,
				scrollHeight: height,
				alignY: 'middle',
				fontSize: this.editor.const.fontSize,
				color: this.editor.color.timeText,
				alpha: 1,
				text
			})
		}
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
	lanes: IRenderLaneObject[],
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

export interface IRenderLaneObject {
	name: string;
	x: number;
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
