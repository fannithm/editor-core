import { IEditorSelection } from "./types";

/**
 * PJSKEvent type enumeration
 */
export enum Type {
	/**
	 * Emitted when scroll bottom of the editor is changed.
	 *
	 * ## Usage:
	 * ```js
	 * editor.event.addEventListener(PJSKEventType.Scroll, (event: PJSKScrollEvent) => {
	 * 	console.log(event.detail.scrollBottom)
	 * })
	 * ```
	 * See {@link PJSKScrollEvent.detail}
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
