import { Editor } from './Editor';

export class EventHandler {

	constructor(private editor: Editor) {
	}

	listen(): void {
		// mouse wheel
		this.editor.renderer.app.view.addEventListener('wheel', this.mouseWheelHandler.bind(this));
		/* // selection rect
		const selectAreaMoveHandler = this.selectAreaMoveHandler.bind(this);
		this.oldSelection = {
			single: [],
			slide: {}
		};
		selectArea.on('mousedown', (event: PIXI.InteractionEvent) => {
			if (event.data.button !== 0) return;
			if (!event.data.originalEvent.ctrlKey) {
				this.emptySelection();
			}
			const point = event.data.global;
			const x = point.x;
			const y = this.scrollBottom + (this.const.height - point.y);
			this.selectionBox = [x, y, x, y];
			selectArea.on('mousemove', selectAreaMoveHandler);
			this.event.addEventListener(PJSKEvent.Type.Scroll, selectAreaMoveHandler);
			this.reRender();
			window.addEventListener('mouseup', mouseUpHandler);
		});

		const mouseUpHandler = () => {
			window.removeEventListener('mouseup', mouseUpHandler);
			this.selectionBox = [0, 0, 0, 0];
			selectArea.off('mousemove', selectAreaMoveHandler);
			this.event.removeEventListener(PJSKEvent.Type.Scroll, selectAreaMoveHandler);
			this.autoScrollDelta = 0;
			this.scrollTicker.stop();
			// move temp selection to selection
			this.selection.single.push(...this.tempSelection.single);
			for (const id in this.tempSelection.slide) {
				if (Object.prototype.hasOwnProperty.call(this.tempSelection.slide, id)) {
					const slide = this.tempSelection.slide[id];
					if (!this.selection.slide[id]) this.selection.slide[id] = [];
					this.selection.slide[id].push(...slide);
				}
			}
			this.tempSelection.single = [];
			this.tempSelection.slide = {};
			this.dispatchSelectEvent();
			this.reRender();
		};

		// move cursor
		selectArea.on('mousemove', (event: PIXI.InteractionEvent) => {
			this.lastMouseCursorPosition.x = event.data.global.x;
			this.lastMouseCursorPosition.y = event.data.global.y;
			const [beat, lane] = this.getCursorPosition();
			this.moveCursor(beat, lane);
		});
		this.event.addEventListener(PJSKEvent.Type.Scroll, () => {
			const [beat, lane] = this.getCursorPosition();
			this.moveCursor(beat, lane);
		}); */
	}

	private mouseWheelHandler(event: WheelEvent) {
		const scrollBottom = Math.min(this.editor.const.maxHeight - this.editor.const.height, Math.max(0, this.editor.scrollController.scrollBottom - event.deltaY / this.editor.const.resolution));
		this.editor.scrollController.scrollTo(scrollBottom);
	}
}
