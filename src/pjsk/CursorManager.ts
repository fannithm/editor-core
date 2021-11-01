import { Editor } from './Editor';
import { Fraction } from '@fannithm/utils';
import { PJSK as PJSKConst } from '@fannithm/const';
import {
	IRenderArrowObject,
	IRenderCurveObject,
	IRenderInvisibleNodeObject,
	IRenderNoteObject,
	IRenderVisibleNodeObject
} from './Parser';

export class CursorManager {
	private _critical = false;
	private _width = 3;
	private _direction = PJSKConst.FlickDirection.Up;
	private _type = EditorCursorType.Default;
	private _curve = PJSKConst.CurveType.Linear;
	private _nodeVisible = true;
	public positionX: number;
	public positionY: Fraction;
	private _slideHeadPlaced = false;
	private _slideCritical = false;
	private _flickEnd = false;
	/**
	 * to record if the cursor is in a slide
	 */
	public slideId = '';
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
	public slideHeadBeat: PJSKConst.MapBeat;
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
	public slideTailObject: IRenderNoteObject = {
		id: 'CursorNote',
		name: 'CursorNoteSlideTail',
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
	public invisibleObject: IRenderInvisibleNodeObject = {
		id: 'CursorNote',
		name: 'CursorNoteInvisibleNode',
		slideId: 'CursorNoteSlide',
		x: 0,
		width: 0,
		scrollHeight: 0,
		color: 0,
		alpha: 0
	};
	public visibleObject: IRenderVisibleNodeObject = {
		id: 'CursorNote',
		name: 'CursorNoteVisibleNode',
		slideId: 'CursorNoteSlide',
		x: 0,
		width: 0,
		scrollHeight: 0,
		texture: 'slide_node',
		alpha: 0
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
		this.slideHeadObject.alpha = 0;
		this.slideTailObject.alpha = 0;
		this.arrowObject.alpha = 0;
		this.curveObject.alpha = 0;
		this.visibleObject.alpha = 0;
		this.invisibleObject.alpha = 0;
		if (!this.visible) {
			this.editor.renderer.render();
			return;
		}

		this.editor.renderer.cursor.lineColor = this.editor.resourceManager.theme.color.cursor;
		const scrollHeight = this.editor.calculator.getHeightByBeat(this.positionY, this.editor.timeLineManager.prime);
		const x = this.editor.calculator.getLaneX(this.lane - 0.1);
		const width = this.editor.calculator.getLaneWidth(this.width + 0.2);

		const updateArrowObject = (width: number, lane: number, scrollHeight: number, critical: boolean) => {
			// flick arrow
			const arrowWidth = Math.min(6, width);
			const renderWidth = Math.max(0.8, Math.min(4, arrowWidth * 0.6));
			this.arrowObject.x = this.editor.calculator.getLaneX(lane + (width - renderWidth) / 2);
			this.arrowObject.scrollHeight = scrollHeight;
			this.arrowObject.width = this.editor.calculator.getLaneWidth(renderWidth);
			this.arrowObject.alpha = 0.6;
			this.arrowObject.texture = `flick_arrow_${ critical ? 'critical_' : '' }${ arrowWidth.toString().padStart(2, '0') }${ {
				0: '',
				1: '_left',
				2: '_right'
			}[this.direction] }`;
		};

		if ([EditorCursorType.Tap, EditorCursorType.Flick].includes(this.type) || (this.type === EditorCursorType.Slide && !this.slideHeadPlaced)) {
			this.noteObject.scrollHeight = scrollHeight;
			this.noteObject.x = x;
			this.noteObject.width = width;
			this.noteObject.rawWidth = this.width;
			this.noteObject.rawLane = this.lane;
			this.noteObject.alpha = 0.6;
			const isFlick = this.type === EditorCursorType.Flick;
			this.noteObject.texture = this.critical ? 'critical' : (isFlick ? 'flick' : this.type === EditorCursorType.Tap ? 'tap' : 'slide');
			if (isFlick) updateArrowObject(this.width, this.lane, this.noteObject.scrollHeight, this.critical);
		} else if (this.type === EditorCursorType.Slide) {
			// slide head has been placed
			this.slideHeadObject.alpha = this.slideTailObject.alpha = 0.6;
			this.slideHeadObject.scrollHeight = this.noteObject.scrollHeight;
			this.slideTailObject.scrollHeight = scrollHeight;
			this.slideHeadObject.x = this.noteObject.x;
			this.slideTailObject.x = x;
			this.slideHeadObject.width = this.noteObject.width;
			this.slideTailObject.width = width;
			this.slideHeadObject.rawLane = this.noteObject.rawLane;
			this.slideTailObject.rawLane = this.lane;
			this.slideHeadObject.rawWidth = this.noteObject.rawWidth;
			this.slideTailObject.rawWidth = this.width;
			const reversed = this.noteObject.scrollHeight > scrollHeight;
			const head = reversed ? this.slideTailObject : this.slideHeadObject;
			const tail = reversed ? this.slideHeadObject : this.slideTailObject;
			head.texture = this.slideCritical ? 'critical' : 'slide';
			tail.texture = this.slideCritical || (!this.slideHeadPlaced && this.critical) || (this.slideHeadPlaced && this.critical && this.flickEnd) ? 'critical' : (this.slideHeadPlaced && this.flickEnd ? 'flick' : 'slide');
			if (this.flickEnd) updateArrowObject(tail.rawWidth, tail.rawLane, tail.scrollHeight, tail.texture === 'critical');
			// curve
			this.curveObject.startScrollHeight = head.scrollHeight;
			this.curveObject.endScrollHeight = tail.scrollHeight;
			this.curveObject.alpha = 0.8 * (this.slideCritical ? this.editor.resourceManager.theme.color.slideCriticalCurveAlpha : this.editor.resourceManager.theme.color.slideCurveAlpha);
			this.curveObject.color = this.slideCritical ? this.editor.resourceManager.theme.color.slideCriticalCurve : this.editor.resourceManager.theme.color.slideCurve;
			this.curveObject.points = [
				...this.editor.parser.getCurvePoints(
					this.editor.calculator.getLaneX(head.rawLane + 0.1),
					head.scrollHeight,
					this.editor.calculator.getLaneX(tail.rawLane + 0.1),
					tail.scrollHeight,
					this.editor.parser.bezier[this.curve] as false | number[]
				),
				...this.editor.parser.getCurvePoints(
					this.editor.calculator.getLaneX(head.rawLane + head.rawWidth - 0.1),
					head.scrollHeight,
					this.editor.calculator.getLaneX(tail.rawLane + tail.rawWidth - 0.1),
					tail.scrollHeight,
					this.editor.parser.bezier[this.curve] as false | number[]
				).reverse()
			];
		} else if (this.type === EditorCursorType.SlideNode) {
			if (!this.slideId) return;
			const critical = this.editor.map.slides.find(v => v.id === this.slideId).critical;
			this.invisibleObject.x = this.editor.calculator.getLaneX(this.lane + 0.1);
			this.invisibleObject.width = this.editor.calculator.getLaneWidth(this.width - 0.2);
			this.invisibleObject.scrollHeight = scrollHeight;
			this.invisibleObject.alpha = 0.6;
			this.invisibleObject.color = critical ? this.editor.resourceManager.theme.color.slideCriticalInvisibleNode : this.editor.resourceManager.theme.color.slideInvisibleNode;
			if (this.nodeVisible) {
				this.visibleObject.x = x;
				this.visibleObject.width = width;
				this.visibleObject.scrollHeight = scrollHeight;
				this.visibleObject.alpha = 0.6;
				this.visibleObject.texture = `slide_node${ critical ? '_critical' : '' }`;
			}
		} else if (this.type === EditorCursorType.BPM) {
			this.editor.renderer.cursor.lineColor = this.editor.resourceManager.theme.color.bpmLine;
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

	public autoChangeSlideCursor(): void {
		if (![EditorCursorType.Slide, EditorCursorType.SlideNode].includes(this.editor.cursorManager.type) || this.editor.cursorManager.slideHeadPlaced) return;
		const height = this.editor.calculator.getHeightByBeat(this.editor.cursorManager.positionY, this.editor.timeLineManager.prime);
		const curves = this.editor.parser.renderObjects.curves.filter(v => height >= v.startScrollHeight && height <= v.endScrollHeight);
		let id = '';
		for (let i = 0; i < curves.length; i++) {
			const curve = curves[i];
			if (curve.slideId === 'CursorNoteSlide') continue;
			const startX = curve.points.find(v => v.scrollHeight >= height).x;
			const endX = curve.points.concat().reverse().find(v => v.scrollHeight >= height).x;
			const x = this.editor.calculator.getLaneX(this.editor.cursorManager.positionX + 0.5);
			if (x >= startX && x <= endX) {
				id = curve.slideId;
				break;
			}
		}
		this.editor.cursorManager.type = id ? EditorCursorType.SlideNode : EditorCursorType.Slide;
		this.editor.cursorManager.slideId = id;
	}

	get type(): EditorCursorType {
		return this._type;
	}

	set type(value: EditorCursorType) {
		if (value === this._type) return;
		this._type = value;
		if (this.type !== EditorCursorType.Default)
			this.editor.selectionManager.emptySelection();
		if (this.type === EditorCursorType.Slide)
			this.autoChangeSlideCursor();
		if (this.slideHeadPlaced) this.endSlidePlacement();
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

	get direction(): PJSKConst.FlickDirection {
		return this._direction;
	}

	set direction(value: PJSKConst.FlickDirection) {
		this._direction = value;
		this.updateObject();
	}

	get curve(): PJSKConst.CurveType {
		return this._curve;
	}

	set curve(value: PJSKConst.CurveType) {
		this._curve = value;
		this.updateObject();
	}

	get nodeVisible(): boolean {
		return this._nodeVisible;
	}

	set nodeVisible(value: boolean) {
		if (this.type === EditorCursorType.SlideNode) {
			this._nodeVisible = value;
			this.updateObject();
		}
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
	SlideNode = 4,
	BPM = 5
}
