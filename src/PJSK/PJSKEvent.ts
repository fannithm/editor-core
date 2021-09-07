import { IEditorSelection } from "./types";

/**
 * # PJSKEvent type enumeration
 *
 * ## Usage
 * ```js
 * editor.event.addEventListener(PJSKEvent.Type.Scroll, (event: PJSKEvent.ScrollEvent) => {
 * 	console.log(event.detail.scrollBottom)
 * })
 * ```
 * View `CustomEvent` documentation on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent).
 */
export enum Type {
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

export interface IScrollEventDetail {
	/**
	 * The scroll bottom of the editor before scrolling.
	 */
	oldScrollBottom: number;
	/**
	 * The scroll bottom of the editor after scrolling.
	 */
	newScrollBottom: number
}
export type ScrollEvent = CustomEvent<IScrollEventDetail>;

export interface ISelectEventDetail {
	oldSelection: IEditorSelection,
	newSelection: IEditorSelection
}
export type SelectEvent = CustomEvent<ISelectEventDetail>;
