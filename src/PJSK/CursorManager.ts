import { Editor } from './Editor';
import { Fraction } from '@fannithm/utils';
import { CurveType, FlickDirection, MapBeat } from '@fannithm/const/dist/pjsk';
import { IRenderArrowObject, IRenderCurveObject, IRenderNoteObject } from './Parser';

export class CursorManager {
	private _critical = false;
	private _width = 3;
	private _direction = FlickDirection.Up;
	private _type = EditorCursorType.Default;
	private _curve = CurveType.Linear;
	public positionX: number;
	public positionY: Fraction;
	private _slideHeadPlaced = false;
	private _slideCritical = false;
	private _flickEnd = false;
	public bpm = 120;
	public noteObject: IRenderNoteObject = {
		id: 'CursorNote',
		name: 'CursorNote',
		x: 0,
		scrollHeight: 0,
		width: 0,
		texture: 'tap',
		alpha: 0,
		rawWidth: 0,
		rawLane: 0
	};
	public slideHeadBeat: MapBeat;
	public slideHeadObject: IRenderNoteObject = {
		id: 'CursorNote',
		name: 'CursorNoteSlideHead',
		x: 0,
		scrollHeight: 0,
		width: 0,
		texture: 'slide',
		alpha: 0,
		rawWidth: 0,
		rawLane: 0
	};
	public arrowObject: IRenderArrowObject = {
		id: 'CursorNote',
		name: 'CursorNoteArrow',
		x: 0,
		scrollHeight: 0,
		width: 0,
		alpha: 1,
		texture: 'flick_arrow_01'
	};
	public curveObject: IRenderCurveObject = {
		id: 'CursorNote',
		slideId: 'CursorNoteSlide',
		name: 'CursorNoteCurve',
		startScrollHeight: 0,
		endScrollHeight: 0,
		alpha: 0,
		color: 0,
		points: []
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
		this.noteObject.alpha = 0;
		this.arrowObject.alpha = 0;
		this.curveObject.alpha = 0;
		// note
		const visible = this.visible && (![EditorCursorType.Default, EditorCursorType.BPM].includes(this.type));
		this.noteObject.alpha = visible ? 0.8 : 0;
		this.noteObject.scrollHeight = this.editor.calculator.getHeightByBeat(this.positionY, this.editor.timeLineManager.prime);
		this.noteObject.texture = this.critical ? 'critical' : {
			[EditorCursorType.Tap]: 'tap',
			[EditorCursorType.Flick]: 'flick',
			[EditorCursorType.Slide]: 'slide'
		}[this.type] || 'tap';
		this.noteObject.x = this.editor.calculator.getLaneX(this.lane - 0.1);
		this.noteObject.width = this.editor.calculator.getLaneWidth(this.width + 0.2);
		this.noteObject.rawWidth = this.width;
		this.noteObject.rawLane = this.lane;
		// arrow
		if (this.type === EditorCursorType.Flick || (this.type === EditorCursorType.Slide && this.slideHeadPlaced && this.flickEnd)) {
			const width = Math.min(6, this.width);
			const renderWidth = Math.max(0.8, Math.min(4, width * 0.6));
			this.arrowObject.x = this.editor.calculator.getLaneX(this.lane + (this.width - renderWidth) / 2);
			this.arrowObject.scrollHeight = this.noteObject.scrollHeight;
			this.arrowObject.width = this.editor.calculator.getLaneWidth(renderWidth);
			this.arrowObject.alpha = visible ? 0.8 : 0;
			this.arrowObject.texture = `flick_arrow_${ this.critical || (this.slideHeadPlaced && this.slideCritical) ? 'critical_' : '' }${ width.toString().padStart(2, '0') }${ {
				0: '',
				1: '_left',
				2: '_right'
			}[this.direction] }`;
		}
		// slide
		if (this.type === EditorCursorType.Slide) {
			// end note
			this.noteObject.texture = this.slideCritical || (!this.slideHeadPlaced && this.critical) || (this.slideHeadPlaced && this.critical && this.flickEnd) ? 'critical' : (this.slideHeadPlaced && this.flickEnd ? 'flick' : 'slide');
			if (this.slideHeadPlaced) {
				// draw curve
				const start = this.slideHeadObject.scrollHeight > this.noteObject.scrollHeight ? this.noteObject : this.slideHeadObject;
				const end = this.slideHeadObject.scrollHeight > this.noteObject.scrollHeight ? this.slideHeadObject : this.noteObject;
				this.curveObject.startScrollHeight = start.scrollHeight;
				this.curveObject.endScrollHeight = end.scrollHeight;
				this.curveObject.alpha = 0.8 * (this.slideCritical ? this.editor.color.slideCriticalCurveAlpha : this.editor.color.slideCurveAlpha);
				this.curveObject.color = this.slideCritical ? this.editor.color.slideCriticalCurve : this.editor.color.slideCurve;
				this.curveObject.points = [
					...this.editor.parser.getCurvePoints(
						this.editor.calculator.getLaneX(start.rawLane + 0.1),
						start.scrollHeight,
						this.editor.calculator.getLaneX(end.rawLane + 0.1),
						end.scrollHeight,
						this.editor.parser.bezier[this.curve] as false | number[]
					),
					...this.editor.parser.getCurvePoints(
						this.editor.calculator.getLaneX(start.rawLane + start.rawWidth - 0.1),
						start.scrollHeight,
						this.editor.calculator.getLaneX(end.rawLane + end.rawWidth - 0.1),
						end.scrollHeight,
						this.editor.parser.bezier[this.curve] as false | number[]
					).reverse()
				];
			}
		}

		this.editor.renderer.render();
	}

	public placeSlideHead(): void {
		if (this.type !== EditorCursorType.Slide) return;
		this.slideHeadObject.x = this.editor.calculator.getLaneX(this.lane - 0.1);
		this.slideHeadObject.scrollHeight = this.editor.calculator.getHeightByBeat(this.positionY, this.editor.timeLineManager.prime);
		this.slideHeadObject.width = this.editor.calculator.getLaneWidth(this.width + 0.2);
		this.slideHeadObject.texture = this.critical ? 'critical' : 'slide';
		this.slideHeadObject.alpha = 1;
		this.slideHeadObject.rawWidth = this.width;
		this.slideHeadObject.rawLane = this.lane;
		this._slideCritical = this.critical;
		this._slideHeadPlaced = true;
		this.slideHeadBeat = [this.positionY.integer, this.positionY.numerator, this.positionY.denominator];
	}

	public endSlidePlacement(): void {
		if (this.type !== EditorCursorType.Slide && !this.slideHeadPlaced) return;
		this._slideHeadPlaced = false;
		this.critical = this.slideCritical;
		this._slideCritical = false;
		this.slideHeadObject.alpha = 0;
		this.updateObject();
	}


	get type(): EditorCursorType {
		return this._type;
	}

	set type(value: EditorCursorType) {
		this._type = value;
		if (this.type === EditorCursorType.Default && value !== this._type) {
			this.editor.selectionManager.emptySelection();
		}
		this.endSlidePlacement();
		this.editor.renderer.cursor.lineColor = this.type === EditorCursorType.BPM ? this.editor.color.bpmLine : this.editor.color.cursor;
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

	get direction(): FlickDirection {
		return this._direction;
	}

	set direction(value: FlickDirection) {
		this._direction = value;
		this.updateObject();
	}

	get curve(): CurveType {
		return this._curve;
	}

	set curve(value: CurveType) {
		this._curve = value;
		this.updateObject();
	}

	get flickEnd(): boolean {
		return this._flickEnd;
	}

	set flickEnd(value: boolean) {
		this._flickEnd = value;
		this.updateObject();
	}

	get slideHeadPlaced(): boolean {
		return this._slideHeadPlaced;
	}

	get slideCritical(): boolean {
		return this._slideCritical;
	}

	get lane(): number {
		return Math.min(12 - this.width, Math.max(0, this.positionX - Math.floor(this.width / 2)));
	}

	get visible(): boolean {
		return this.positionX >= 0 && this.positionX <= 11;
	}
}


export enum EditorCursorType {
	Default = 0,
	Tap = 1,
	Flick = 2,
	Slide = 3,
	BPM = 4
}
