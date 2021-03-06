import { PJSK as PJSKConst } from '@fannithm/const';
import { Editor } from './Editor';
import bezierEasing from 'bezier-easing';

/**
 * parse map to editor render object
 */
export class Parser {
	public renderObjects: IRenderObjects;
	public bezier = [
		false,
		[0, 0, 1, 1],
		[0.11, 0, 0.5, 0],
		[0.5, 1, 0.89, 1],
		[0.45, 0, 0.55, 1]
	];

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
			this.parseCursor();
			// prime
			this.parseBeatLines();
			this.parseBPMLines();
			this.addTimeText();
			// visible
			this.parseNotes();
			this.parseSlide();
		}
	}

	private parseCursor() {
		this.renderObjects.notes.push(this.editor.cursorManager.noteObject);
		this.renderObjects.notes.push(this.editor.cursorManager.slideHeadObject);
		this.renderObjects.notes.push(this.editor.cursorManager.slideTailObject);
		this.renderObjects.arrows.push(this.editor.cursorManager.arrowObject);
		this.renderObjects.curves.push(this.editor.cursorManager.curveObject);
		this.renderObjects.visibleNodes.push(this.editor.cursorManager.visibleObject);
		this.renderObjects.invisibleNodes.push(this.editor.cursorManager.invisibleObject);
	}

	private addLanes() {
		const laneNumber = 12;
		const laneWidth = 6;
		const leftSpace = (100 - (laneNumber * laneWidth)) / 2;
		for (let i = 0; i <= 12; i++) {
			this.renderObjects.lanes.push({
				name: `Lane-${ i }`,
				x: this.editor.const.width * ((i * laneWidth + leftSpace) / 100),
				color: (i % 2) ? this.editor.resourceManager.theme.color.secondaryLane : this.editor.resourceManager.theme.color.primeLane,
				alpha: (i % 2) ? this.editor.resourceManager.theme.color.secondaryLaneAlpha : this.editor.resourceManager.theme.color.primeLaneAlpha
			});
		}
	}

	private parseBeatLines() {
		const slice = this.editor.beatSlice;
		// 1/beatSlice beat per loop
		for (let i = 0; ; i++) {
			const beat = this.editor.fraction([Math.floor(i / slice), i % slice, slice]);
			const time = this.editor.calculator.getTimeByBeat(beat, this.editor.timeLineManager.prime);
			const height = this.editor.calculator.getHeightByTime(time);
			if (height > this.editor.const.maxHeight - this.editor.const.spaceY) break;
			const object: IRenderBeatLineObject = {
				name: `BeatLine-${ beat.decimal }`,
				x: this.editor.calculator.getLaneX(0),
				width: this.editor.calculator.getLaneWidth(12),
				scrollHeight: height,
				color: 0,
				alpha: 0
			};
			if (i % slice === 0) {
				object.color = this.editor.resourceManager.theme.color.beatLineWhole;
				object.alpha = this.editor.resourceManager.theme.color.beatLineWholeAlpha;
				object.width = this.editor.const.width - this.editor.calculator.getLaneX(0);
				this.renderObjects.texts.push({
					name: `BeatLineText-${ beat.decimal }`,
					x: this.editor.const.width - this.editor.const.paddingX,
					fontSize: this.editor.const.fontSize,
					scrollHeight: height + this.editor.const.paddingY,
					alignX: 'right',
					alignY: 'bottom',
					color: this.editor.resourceManager.theme.color.beatLineWhole,
					alpha: this.editor.resourceManager.theme.color.beatLineWholeAlpha,
					text: `${ Math.floor((beat.integer) / 4) + 1 }:${ beat.integer % 4 + 1 }`
				});
			} else if (i % (slice / 2) === 0) {
				object.color = this.editor.resourceManager.theme.color.beatLineHalf;
				object.alpha = this.editor.resourceManager.theme.color.beatLineHalfAlpha;
			} else if (i % (slice / 3) === 0) {
				object.color = this.editor.resourceManager.theme.color.beatLineThird;
				object.alpha = this.editor.resourceManager.theme.color.beatLineThirdAlpha;
			} else if (i % (slice / 4) === 0) {
				object.color = this.editor.resourceManager.theme.color.beatLineQuarter;
				object.alpha = this.editor.resourceManager.theme.color.beatLineQuarterAlpha;
			} else continue;
			this.renderObjects.beatLines.push(object);
		}
	}

	public formatTime(time: number): string {
		return `${ Math.floor(time / 60).toString().padStart(2, '0') }:${ (time % 60).toFixed(3).padStart(6, '0') }`;
	}

	private parseBPMLines() {
		const bpms = this.map.bpms.filter(v => v.timeline === this.editor.timeLineManager.prime);
		for (let i = 0; i < bpms.length; i++) {
			const bpm = bpms[i];
			const bpmTime = this.editor.calculator.getTimeByBeat(this.editor.fraction(bpm.beat), this.editor.timeLineManager.prime);
			const bpmHeight = this.editor.calculator.getHeightByTime(bpmTime);
			// bpm line
			this.renderObjects.beatLines.push({
				name: `BPM-${ bpm.id }-line`,
				x: 0,
				width: this.editor.const.width,
				scrollHeight: bpmHeight,
				color: this.editor.resourceManager.theme.color.bpmLine,
				alpha: 1
			});
			// bpm text
			this.renderObjects.texts.push({
				name: `BPM-${ bpm.id }-time`,
				x: this.editor.const.paddingX,
				scrollHeight: bpmHeight + this.editor.const.paddingY,
				alignY: 'bottom',
				fontSize: this.editor.const.fontSize,
				color: this.editor.resourceManager.theme.color.bpmLine,
				alpha: 1,
				text: this.formatTime(bpmTime)
			});
			// bpm value
			this.renderObjects.texts.push({
				name: `BPM-${ bpm.id }-value`,
				x: this.editor.calculator.getLaneX(12) + this.editor.const.paddingX,
				scrollHeight: bpmHeight + this.editor.const.paddingY,
				alignY: 'bottom',
				fontSize: this.editor.const.fontSize,
				color: this.editor.resourceManager.theme.color.bpmLine,
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
				name: `Time-${ i }`,
				x: this.editor.calculator.getLaneX(0) - this.editor.const.paddingX,
				scrollHeight: height,
				alignX: 'right',
				alignY: 'middle',
				fontSize: this.editor.const.fontSize,
				color: this.editor.resourceManager.theme.color.timeText,
				alpha: 1,
				text
			});
		}
	}

	private pushFlickObject(note: PJSKConst.INoteFlick | PJSKConst.INoteSlideEndFlick, height: number, slideCritical = false) {
		const width = Math.min(6, note.width);
		const renderWidth = Math.max(0.8, Math.min(4, width * 0.6));
		this.renderObjects.arrows.push({
			name: `Arrow-${ note.id }`,
			x: this.editor.calculator.getLaneX(note.lane + (note.width - renderWidth) / 2),
			width: this.editor.calculator.getLaneWidth(renderWidth),
			scrollHeight: height,
			texture: `flick_arrow_${ note.critical || slideCritical ? 'critical_' : '' }${ width.toString().padStart(2, '0') }${ {
				0: '',
				1: '_left',
				2: '_right'
			}[note.direction] }`,
			alpha: 1,
			id: note.id
		});
	}

	private parseNotes() {
		const notes = this.map.notes.filter(v => this.editor.timeLineManager.visible.includes(v.timeline));
		for (let i = 0; i < notes.length; i++) {
			const note = notes[i];
			const height = this.editor.calculator.getHeightByBeat(this.editor.fraction(note.beat), note.timeline);
			if (note.type === PJSKConst.NoteType.Flick) {
				this.pushFlickObject(note, height);
			}
			this.renderObjects.notes.push({
				name: `Note-${ note.id }`,
				x: this.editor.calculator.getLaneX(note.lane - 0.1),
				width: this.editor.calculator.getLaneWidth(note.width + 0.2),
				scrollHeight: height,
				texture: note.critical ? 'critical' : (note.type ? 'flick' : 'tap'),
				id: note.id,
				alpha: 1,
				rawLane: note.lane,
				rawWidth: note.width
			});
		}
	}

	private parseUnPositionedNote(slide: PJSKConst.INoteSlide, start: number, end: number) {
		const startNote = slide.notes[start];
		const endNote = slide.notes[end];
		const startHeight = this.editor.calculator.getHeightByBeat(this.editor.fraction(startNote.beat), slide.timeline);
		const endHeight = this.editor.calculator.getHeightByBeat(this.editor.fraction(endNote.beat), slide.timeline);
		const bezier = [
			...this.bezier,
			startNote.bezier
		][startNote.curve];
		const easing = bezier && bezierEasing(bezier[0], bezier[1], bezier[2], bezier[3]);
		for (let i = start + 1; i < end; i++) {
			const note = slide.notes[i];
			const height = this.editor.calculator.getHeightByBeat(this.editor.fraction(slide.notes[i].beat), slide.timeline);
			const progress = (height - startHeight) / (endHeight - startHeight);
			const lane = bezier ? startNote.lane + (endNote.lane - startNote.lane) * easing(progress) : startNote.lane;
			const width = bezier ? startNote.width + (endNote.width - startNote.width) * easing(progress) : startNote.width;
			this.renderObjects.visibleNodes.push({
				name: `Visible-${ note.id }`,
				x: this.editor.calculator.getLaneX(lane),
				width: this.editor.calculator.getLaneWidth(width),
				scrollHeight: height,
				texture: `slide_node${ slide.critical ? '_critical' : '' }`,
				alpha: 1,
				id: note.id,
				slideId: slide.id
			});
		}
	}

	private parseSlide() {
		const slides = this.map.slides.filter(v => this.editor.timeLineManager.visible.includes(v.timeline));
		for (let i = 0; i < slides.length; i++) {
			const slide = slides[i];
			// TODO sort notes before parse
			for (let j = 0; j < slide.notes.length; j++) {
				const note = slide.notes[j];
				const height = this.editor.calculator.getHeightByBeat(this.editor.fraction(note.beat), slide.timeline);
				// parse note
				if ([PJSKConst.NoteType.SlideStart, PJSKConst.NoteType.SlideEndDefault].includes(note.type)) {
					this.renderObjects.notes.push({
						name: `SlideNote-${ note.id }`,
						x: this.editor.calculator.getLaneX(note.lane - 0.1),
						width: this.editor.calculator.getLaneWidth(note.width + 0.2),
						scrollHeight: height,
						texture: slide.critical ? 'critical' : 'slide',
						id: note.id,
						slideId: slide.id,
						alpha: 1,
						rawLane: note.lane,
						rawWidth: note.width
					});
				} else if (note.type === PJSKConst.NoteType.SlideEndFlick) {
					this.renderObjects.notes.push({
						name: `SlideEndFlick-${ note.id }`,
						x: this.editor.calculator.getLaneX(note.lane - 0.1),
						width: this.editor.calculator.getLaneWidth(note.width + 0.2),
						scrollHeight: height,
						texture: (note.critical || slide.critical) ? 'critical' : 'flick',
						id: note.id,
						slideId: slide.id,
						alpha: 1,
						rawLane: note.lane,
						rawWidth: note.width
					});
					this.pushFlickObject(note, height, slide.critical);
				} else if (note.type === PJSKConst.NoteType.SlideInvisible) {
					this.renderObjects.invisibleNodes.push({
						name: `Invisible-${ note.id }`,
						x: this.editor.calculator.getLaneX(note.lane + 0.1),
						width: this.editor.calculator.getLaneWidth(note.width - 0.2),
						scrollHeight: height,
						color: slide.critical ? this.editor.resourceManager.theme.color.slideCriticalInvisibleNode : this.editor.resourceManager.theme.color.slideInvisibleNode,
						alpha: 1,
						id: note.id,
						slideId: slide.id
					});
				} else if (note.type === PJSKConst.NoteType.SlideVisible) {
					this.renderObjects.visibleNodes.push({
						name: `Visible-${ note.id }`,
						x: this.editor.calculator.getLaneX(note.lane),
						width: this.editor.calculator.getLaneWidth(note.width),
						scrollHeight: height,
						texture: `slide_node${ slide.critical ? '_critical' : '' }`,
						alpha: 1,
						id: note.id,
						slideId: slide.id
					});
				}
				// parse curve
				let next = slide.notes[j + 1];
				if (next === undefined) break;
				if (next.lane === undefined) {
					const end = slide.notes.findIndex((v, index) => index > j && v.lane !== undefined);
					next = slide.notes[end];
					this.parseUnPositionedNote(slide, j, end);
					j = end - 1;
				}
				this.renderObjects.curves.push({
					name: `Curve-${ note.id }`,
					startScrollHeight: height,
					endScrollHeight: this.editor.calculator.getHeightByBeat(this.editor.fraction(next.beat), slide.timeline),
					points: [
						...this.getCurvePoints(
							this.editor.calculator.getLaneX(note.lane + 0.1),
							height,
							this.editor.calculator.getLaneX(next.lane + 0.1),
							this.editor.calculator.getHeightByBeat(this.editor.fraction(next.beat), slide.timeline),
							[...this.bezier, note.bezier][note.curve] as false | number[]
						),
						...this.getCurvePoints(
							this.editor.calculator.getLaneX(note.lane + note.width - 0.1),
							height,
							this.editor.calculator.getLaneX(next.lane + next.width - 0.1),
							this.editor.calculator.getHeightByBeat(this.editor.fraction(next.beat), slide.timeline),
							[...this.bezier, note.bezier][note.curve] as false | number[]
						).reverse()
					],
					color: slide.critical ? this.editor.resourceManager.theme.color.slideCriticalCurve : this.editor.resourceManager.theme.color.slideCurve,
					alpha: slide.critical ? this.editor.resourceManager.theme.color.slideCriticalCurveAlpha : this.editor.resourceManager.theme.color.slideCurveAlpha,
					id: note.id,
					slideId: slide.id
				});
			}
		}
	}

	public getCurvePoints(startX: number, startScrollHeight: number, endX: number, endScrollHeight: number, bezier: number[] | false): IRenderCurvePoint[] {
		if (!bezier) return [
			{ x: startX, scrollHeight: startScrollHeight },
			{ x: startX, scrollHeight: endScrollHeight }
		];
		const step = this.editor.const.curveRenderStep;
		const length = Math.ceil((endScrollHeight - startScrollHeight) / step);
		const easing = bezierEasing(bezier[0], bezier[1], bezier[2], bezier[3]);
		const dx = endX - startX;
		const dy = endScrollHeight - startScrollHeight;
		return new Array(length + 1).fill(0).map((v, i) => {
			const p = Math.min(1, (i * step) / (endScrollHeight - startScrollHeight));
			return {
				x: startX + easing(p) * dx,
				scrollHeight: startScrollHeight + p * dy
			};
		});
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
	alpha: number;
	id: string;
	slideId?: string;
	rawLane: number;
	rawWidth: number;
}

export interface IRenderCurvePoint {
	x: number;
	scrollHeight: number;
}

export interface IRenderCurveObject {
	name: string;
	// startX: number;
	// startWidth: number;
	startScrollHeight: number;
	// endX: number;
	// endWidth: number;
	endScrollHeight: number;
	// bezier: number[] | false;
	points: IRenderCurvePoint[];
	color: number;
	alpha: number;
	id: string;
	slideId: string;
}

export interface IRenderArrowObject {
	name: string;
	x: number;
	width: number;
	scrollHeight: number;
	texture: string;
	alpha: number;
	id: string;
}

export interface IRenderVisibleNodeObject {
	name: string;
	x: number;
	width: number;
	scrollHeight: number;
	texture: string;
	alpha: number;
	id: string;
	slideId: string;
}

export interface IRenderInvisibleNodeObject {
	name: string;
	x: number;
	width: number;
	scrollHeight: number;
	color: number;
	alpha: number;
	id: string;
	slideId: string;
}
