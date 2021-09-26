import * as PIXI from 'pixi.js';
import { EventType } from './EventEmitter';
import { Editor } from './Editor';
import { ScrollController } from './ScrollController';
import { SelectionManager } from './SelectionManager';

export class EventHandler {
	private readonly windowMouseUpHandler: () => void;
	private readonly selectAreaMouseMoveWhenMouseDownHandler: () => void;
	public readonly lastMousePosition: {
		x: number,
		y: number
	};

	constructor(private editor: Editor) {
		this.lastMousePosition = {
			x: 0,
			y: 0
		};
		this.windowMouseUpHandler = this._windowMouseUpHandler.bind(this);
		this.selectAreaMouseMoveWhenMouseDownHandler = this._selectAreaMouseMoveWhenMouseDownHandler.bind(this);
	}

	listen(): void {
		// mouse wheel
		this.editor.renderer.app.view.addEventListener('wheel', this.mouseWheelHandler.bind(this));

		// mouse down
		this.editor.renderer.app.stage.on('mousedown', this.selectAreaMouseDownHandler.bind(this));

		// mouse move
		this.editor.renderer.app.stage.on('mousemove', this.selectAreaMouseMoveHandler.bind(this));

		// scroll ticker
		this.scrollController.scrollTicker.add(this.scrollTickerHandler.bind(this));

		this.editor.audioManager.playTicker.add(this.audioPlayTickerHandler.bind(this));

		this.editor.event.on(EventType.Scroll, () => {
			const [beat, lane] = this.editor.cursorManager.getCursorPosition();
			this.editor.renderer.updateCursorPosition(beat, lane);
		});
	}

	private mouseWheelHandler(event: WheelEvent): void {
		const scrollBottom = Math.min(this.editor.const.maxHeight - this.editor.const.height, Math.max(0, this.editor.scrollController.scrollBottom - event.deltaY / this.editor.const.resolution));
		this.editor.scrollController.scrollTo(scrollBottom);
	}

	/**
	 * Select area mouse down handler
	 * Used to record the initial position of the selection box and bind events
	 * @param event
	 */
	private selectAreaMouseDownHandler(event: PIXI.InteractionEvent): void {
		if (event.data.button !== 0) return;
		if (!event.data.originalEvent.ctrlKey) {
			this.editor.selectionManager.emptySelection();
		}
		const point = event.data.global;
		const x = point.x;
		const y = this.editor.scrollController.scrollBottom + (this.editor.const.height - point.y);
		this.editor.selectionManager.selectionBox = [x, y, x, y];

		this.editor.renderer.app.stage.on('mousemove', this.selectAreaMouseMoveWhenMouseDownHandler);
		this.editor.event.on(EventType.Scroll, this.selectAreaMouseMoveWhenMouseDownHandler);
		this.editor.renderer.render();
		window.addEventListener('mouseup', this.windowMouseUpHandler);
	}

	/**
	 * Select area mouse move when mouse down handler.
	 * Used to resize the selection box.
	 */
	private _selectAreaMouseMoveWhenMouseDownHandler(): void {
		const point = this.lastMousePosition;
		this.selectionManager.selectionBox[2] = point.x;
		this.selectionManager.selectionBox[3] = this.scrollController.scrollBottom + (this.editor.const.height - point.y);
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

	private _windowMouseUpHandler() {
		window.removeEventListener('mouseup', this.windowMouseUpHandler);
		this.selectionManager.selectionBox = [0, 0, 0, 0];
		this.editor.renderer.app.stage.off('mousemove', this.selectAreaMouseMoveWhenMouseDownHandler);
		this.editor.event.off(EventType.Scroll, this.selectAreaMouseMoveWhenMouseDownHandler);
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
	private selectAreaMouseMoveHandler(event: PIXI.InteractionEvent) {
		this.lastMousePosition.x = event.data.global.x;
		this.lastMousePosition.y = event.data.global.y;
		if (!this.editor.map) return;
		const [beat, lane] = this.editor.cursorManager.getCursorPosition();
		this.editor.renderer.updateCursorPosition(beat, lane);
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
