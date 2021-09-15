import PIXI from 'pixi.js';

/**
 * See [eventemitter3](https://github.com/primus/eventemitter3).
 */
export class EventEmitter extends PIXI.utils.EventEmitter {
	constructor() {
		super();
	}

	*dispatchScrollEvent(oldScrollBottom: number): Generator<void, void, number> {
		const newScrollBottom = yield;
		this.emit(EventType.Scroll, {
			oldScrollBottom,
			newScrollBottom
		});
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
	newScrollBottom: number
}

// export interface ISelectEventDetail {
// 	oldSelection: IEditorSelection,
// 	newSelection: IEditorSelection
// }
