/**
 * PJSKEventType enumeration
 */
export enum PJSKEventType {
	/**
	 * ## Usage:
	 * ```js
	 * editor.event.addEventListener(PJSKEventType.Scroll, (event: PJSKScrollEvent) => {
	 * 	console.log(event.detail.scrollBottom)
	 * })
	 * ```
	 * See {@link PJSKScrollEvent.detail}
	 * @event scroll
	 */
	Scroll = 'scroll'
}

export interface PJSKScrollEvent extends CustomEvent<PJSKScrollEventDetail> {
	readonly detail: PJSKScrollEventDetail
}

export interface PJSKScrollEventDetail {
	/**
	 * The scroll bottom before scroll
	 */
	oldScrollBottom: number;
	/**
	 * The scroll bottom of the editor.
	 */
	scrollBottom: number
}
