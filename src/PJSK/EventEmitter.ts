import * as PIXI from 'pixi.js';
import { Editor } from './Editor';
import { IEditorSelection } from './SelectionManager';

/**
 * See [eventemitter3](https://github.com/primus/eventemitter3).
 */
export class EventEmitter extends PIXI.utils.EventEmitter {
	constructor(private editor: Editor) {
		super();
	}

	dispatchScrollEvent(oldScrollBottom: number, newScrollBottom: number): void {
		this.emit(EventType.Scroll, {
			oldScrollBottom,
			newScrollBottom
		});
	}

	dispatchSelectEvent(): void {
		const selection = JSON.parse(JSON.stringify(this.editor.selectionManager.selection));
		if (!this.editor.selectionManager.isSelectionEqual(this.editor.selectionManager.oldSelection, selection)) {
			this.editor.event.emit(EventType.Select, {
				oldSelection: this.editor.selectionManager.oldSelection,
				newSelection: selection
			});
			this.editor.selectionManager.oldSelection = JSON.parse(JSON.stringify(selection));
		}
	}

	dispatchDestroyEvent(): void {
		this.emit(EventType.Destroy);
	}
}

export enum EventType {
	/**
	 * Emitted when scroll bottom of the editor is changed.
	 *
	 * See {@link IScrollEventDetail}
	 * @event scroll
	 */
	Scroll = 'scroll',
	/**
	 * Emitted when the editor is to destroy.
	 * @event destroy
	 */
	Destroy = 'destroy',
	/**
	 * Emitted when selected note has changed.
	 * @event select
	 */
	Select = 'select'
}

export interface IScrollEvent {
	/**
	 * The scroll bottom of the editor before scrolling.
	 */
	oldScrollBottom: number;
	/**
	 * The scroll bottom of the editor after scrolling.
	 */
	newScrollBottom: number;
}

export interface ISelectEvent {
	oldSelection: IEditorSelection,
	newSelection: IEditorSelection
}
