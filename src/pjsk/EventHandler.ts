import * as PIXI from 'pixi.js';
import { v4 as uuid } from 'uuid';
import { EventType } from './EventEmitter';
import { Editor } from './Editor';
import { ScrollController } from './ScrollController';
import { SelectionManager } from './SelectionManager';
import { EditorCursorType } from './CursorManager';
import { PJSK as PJSKConst } from '@fannithm/const';

export class EventHandler {
	public readonly lastMousePosition: {
		x: number,
		y: number
	};
	private cursorMoved = false;

	constructor(private editor: Editor) {
		this.lastMousePosition = {
			x: 0,
			y: 0
		};
		// bind this reference
		[
			// event below will be added and removed in other events and manual removing is not needed
			'windowMouseUpHandler',
			'stageMouseMoveWhenMouseDownHandler',
			// event below will be removed in `removeAll` method
			'mouseWheelHandler',
			'stageMouseDownHandler',
			'stageMouseMoveHandler',
			'stageClickHandler',
			'scrollTickerHandler',
			'audioPlayTickerHandler',
			'editorScrollHandler',
			'editorCursorMoveHandler'
		].forEach(v => this[v] = this[v].bind(this));
	}

	listen(): void {
		// mouse wheel
		this.editor.renderer.app.view.addEventListener('wheel', this.mouseWheelHandler);

		// mouse down
		this.editor.renderer.app.stage.on('mousedown', this.stageMouseDownHandler);

		// mouse move
		this.editor.renderer.app.stage.on('mousemove', this.stageMouseMoveHandler);

		this.editor.renderer.app.stage.on('click', this.stageClickHandler);

		// scroll ticker
		this.scrollController.scrollTicker.add(this.scrollTickerHandler);

		// audio play ticker
		this.editor.audioManager.playTicker.add(this.audioPlayTickerHandler);

		this.editor.event.on(EventType.Scroll, this.editorScrollHandler);

		this.editor.event.on(EventType.CursorMove, this.editorCursorMoveHandler);
	}

	removeAll(): void {
		this.editor.renderer.app.view.removeEventListener('wheel', this.mouseWheelHandler);
		this.editor.renderer.app.stage.off('mousedown', this.stageMouseDownHandler);
		this.editor.renderer.app.stage.off('mousemove', this.stageMouseMoveHandler);
		this.scrollController.scrollTicker.remove(this.scrollTickerHandler);
		this.editor.audioManager.playTicker.remove(this.audioPlayTickerHandler);
		this.editor.event.off(EventType.Scroll, this.editorScrollHandler);
		this.editor.event.off(EventType.CursorMove, this.editorCursorMoveHandler);
	}

	private editorScrollHandler() {
		this.editor.cursorManager.calculateCursorPosition();
		const beat = this.editor.cursorManager.positionY;
		const lane = this.editor.cursorManager.positionX;
		this.editor.renderer.updateCursorPosition(beat, lane);
	}

	private editorCursorMoveHandler() {
		// change slide cursor
		this.editor.cursorManager.autoChangeSlideCursor();
		this.editor.cursorManager.updateObject();
	}

	private mouseWheelHandler(event: WheelEvent): void {
		if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) return;
		const scrollBottom = Math.min(this.editor.const.maxHeight - this.editor.const.height, Math.max(0, this.editor.scrollController.scrollBottom - event.deltaY / this.editor.const.resolution));
		this.editor.scrollController.scrollTo(scrollBottom);
	}

	/**
	 * Select area mouse down handler
	 * Used to record the initial position of the selection box and bind events
	 * @param event
	 */
	private stageMouseDownHandler(event: PIXI.InteractionEvent): void {
		if (event.data.button !== 0 || this.editor.cursorManager.type !== EditorCursorType.Default) return;
		if (!event.data.originalEvent.ctrlKey) {
			this.editor.selectionManager.emptySelection();
		}
		const point = event.data.global;
		const x = point.x;
		const y = this.editor.scrollController.scrollBottom + (this.editor.const.height - point.y);
		this.editor.selectionManager.selectionBox = [x, y, x, y];

		this.editor.renderer.app.stage.on('mousemove', this.stageMouseMoveWhenMouseDownHandler);
		this.editor.event.on(EventType.Scroll, this.stageMouseMoveWhenMouseDownHandler);
		this.editor.renderer.render();
		window.addEventListener('mouseup', this.windowMouseUpHandler);
	}

	/**
	 * Select area mouse move when mouse down handler.
	 * Used to resize the selection box.
	 */
	private stageMouseMoveWhenMouseDownHandler(): void {
		const point = this.lastMousePosition;
		this.selectionManager.selectionBox[2] = point.x;
		this.selectionManager.selectionBox[3] = this.scrollController.scrollBottom + (this.editor.const.height - point.y);
		if (this.selectionManager.selectionBox[2] - this.selectionManager.selectionBox[0] ||
			this.selectionManager.selectionBox[3] - this.selectionManager.selectionBox[1])
			this.cursorMoved = true;
		// auto scroll
		const topScrollArea = this.editor.const.height / 20;
		const bottomScrollArea = this.editor.const.height - topScrollArea;
		if (point.y < topScrollArea || point.y > bottomScrollArea) {
			if (!this.scrollController.scrollTicker.started) this.scrollController.scrollTicker.start();
			this.scrollController.autoScrollDelta = ((point.y < topScrollArea ? topScrollArea : bottomScrollArea) - point.y) / (topScrollArea / 10);
		} else {
			this.scrollController.autoScrollDelta = 0;
			this.scrollController.scrollTicker.stop();
		}
		this.editor.selectionManager.findSelectedNote();
		this.editor.renderer.render();
	}

	private windowMouseUpHandler() {
		this.cursorMoved = false;
		window.removeEventListener('mouseup', this.windowMouseUpHandler);
		this.selectionManager.selectionBox = [0, 0, 0, 0];
		this.editor.renderer.app.stage.off('mousemove', this.stageMouseMoveWhenMouseDownHandler);
		this.editor.event.off(EventType.Scroll, this.stageMouseMoveWhenMouseDownHandler);
		this.scrollController.autoScrollDelta = 0;
		this.scrollController.scrollTicker.stop();
		this.selectionManager.mergeTempSelection();
		this.editor.event.dispatchSelectEvent();
		this.editor.renderer.render();
	}

	/**
	 * Select area mouse move handler.
	 * Used to update mouse position and cursor position
	 * @param event
	 */
	private stageMouseMoveHandler(event: PIXI.InteractionEvent) {
		this.lastMousePosition.x = event.data.global.x;
		this.lastMousePosition.y = event.data.global.y;
		if (!this.editor.map) return;
		this.editor.cursorManager.calculateCursorPosition();
		const beat = this.editor.cursorManager.positionY;
		const lane = this.editor.cursorManager.positionX;
		this.editor.renderer.updateCursorPosition(beat, lane);
	}

	private stageClickHandler() {
		if (this.cursorMoved || !this.editor.cursorManager.visible) return;
		if (this.editor.cursorManager.type === EditorCursorType.Default) {
			// TODO select note
		} else {
			// place note
			const note = {
				id: uuid(),
				beat: [this.editor.cursorManager.positionY.integer, this.editor.cursorManager.positionY.numerator, this.editor.cursorManager.positionY.denominator] as PJSKConst.MapBeat,
				lane: this.editor.cursorManager.lane,
				timeline: this.editor.timeLineManager.prime,
				width: this.editor.cursorManager.width
			};
			if (this.editor.cursorManager.type === EditorCursorType.Tap) {
				this.editor.map.notes.push({
					...note,
					type: PJSKConst.NoteType.Tap,
					critical: this.editor.cursorManager.critical
				});
			} else if (this.editor.cursorManager.type === EditorCursorType.Flick) {
				this.editor.map.notes.push({
					...note,
					type: PJSKConst.NoteType.Flick,
					direction: this.editor.cursorManager.direction,
					critical: this.editor.cursorManager.critical
				});
			} else if (this.editor.cursorManager.type === EditorCursorType.Slide && !this.editor.cursorManager.slideHeadPlaced) {
				this.editor.cursorManager.placeSlideHead();
			} else if (this.editor.cursorManager.type === EditorCursorType.Slide && this.editor.cursorManager.slideHeadPlaced) {
				let start = this.editor.cursorManager.slideHeadObject;
				let end = this.editor.cursorManager.slideTailObject;
				let startBeat = this.editor.cursorManager.slideHeadBeat;
				let endBeat = [this.editor.cursorManager.positionY.integer, this.editor.cursorManager.positionY.numerator, this.editor.cursorManager.positionY.denominator] as PJSKConst.MapBeat;
				if (start.scrollHeight === end.scrollHeight) return;
				if (start.scrollHeight > end.scrollHeight) {
					[start, end] = [end, start];
					[startBeat, endBeat] = [endBeat, startBeat];
				}
				const endNote = {
					id: uuid(),
					type: this.editor.cursorManager.flickEnd ? PJSKConst.NoteType.SlideEndFlick : PJSKConst.NoteType.SlideEndDefault,
					beat: endBeat,
					lane: end.rawLane,
					width: end.rawWidth,
					curve: PJSKConst.CurveType.None
				} as PJSKConst.INoteSlideEndDefault | PJSKConst.INoteSlideEndFlick;
				if (this.editor.cursorManager.flickEnd) {
					(endNote as PJSKConst.INoteSlideEndFlick).direction = this.editor.cursorManager.direction;
					if (this.editor.cursorManager.critical)
						(endNote as PJSKConst.INoteSlideEndFlick).critical = true;
				}
				const slide = {
					id: note.id,
					timeline: this.editor.timeLineManager.prime,
					notes: [
						{
							id: uuid(),
							type: PJSKConst.NoteType.SlideStart,
							beat: startBeat,
							lane: start.rawLane,
							width: start.rawWidth,
							curve: this.editor.cursorManager.curve
						},
						endNote
					]
				} as PJSKConst.INoteSlide;
				if (this.editor.cursorManager.slideCritical) slide.critical = true;
				this.editor.map.slides.push(slide);
				this.editor.cursorManager.endSlidePlacement();
			} else if (this.editor.cursorManager.type === EditorCursorType.SlideNode) {
				const slideId = this.editor.cursorManager.slideId;
				if (!slideId) return;
				const slide = this.editor.map.slides.find(v => v.id === slideId);
				const index = slide.notes.findIndex(v => this.editor.fraction(v.beat).eq(this.editor.fraction(note.beat)));
				if (index !== -1) {
					const node = slide.notes[index];
					node.curve = this.editor.cursorManager.curve;
					node.lane = note.lane;
					node.width = note.width;
					if (![PJSKConst.NoteType.SlideStart, PJSKConst.NoteType.SlideEndFlick, PJSKConst.NoteType.SlideEndDefault].includes(node.type))
						node.type = this.editor.cursorManager.nodeVisible ? PJSKConst.NoteType.SlideVisible : PJSKConst.NoteType.SlideInvisible;
				} else {
					slide.notes.push({
						id: note.id,
						type: this.editor.cursorManager.nodeVisible ? PJSKConst.NoteType.SlideVisible : PJSKConst.NoteType.SlideInvisible,
						beat: note.beat,
						lane: note.lane,
						width: note.width,
						curve: this.editor.cursorManager.curve
					});
					slide.notes.sort((a, b) => this.editor.fraction(a.beat).minus(this.editor.fraction(b.beat)).decimal);
				}


			} else if (this.editor.cursorManager.type === EditorCursorType.BPM) {
				const index = this.editor.map.bpms.findIndex(v => v.timeline === note.timeline && this.editor.fraction(v.beat).eq(this.editor.fraction(note.beat)));
				const bpm = {
					id: note.id,
					timeline: note.timeline,
					beat: note.beat,
					bpm: this.editor.cursorManager.bpm
				};
				if (index !== -1) this.editor.map.bpms[index] = bpm;
				else {
					this.editor.map.bpms.push(bpm);
					this.editor.map.bpms.sort((a, b) => this.editor.fraction(a.beat).minus(this.editor.fraction(b.beat)).decimal);
				}
			}
		}
		this.editor.renderer.parseAndRender();
	}

	private scrollTickerHandler(): void {
		this.editor.scrollController.scrollTo(this.editor.scrollController.scrollBottom + this.editor.scrollController.autoScrollDelta);
	}

	private audioPlayTickerHandler(): void {
		this.editor.event.dispatchAudioTimeUpdateEvent();
		if (!this.editor.audioManager.follow)
			this.editor.renderer.updateCurrentTimeLine();
		else {
			const height = this.editor.calculator.getHeightByTime(this.editor.audioManager.currentTime);
			this.editor.scrollController.scrollBottom = height - this.editor.const.spaceY;
		}
	}

	private get selectionManager(): SelectionManager {
		return this.editor.selectionManager;
	}

	private get scrollController(): ScrollController {
		return this.editor.scrollController;
	}
}
