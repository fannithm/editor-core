import Editor from "./Editor";

export default class ScrollController {
	private _scrollBottom: number;

	constructor(private editor: Editor) {
	}

	scrollTo(height: number): void {
		this.scrollBottom = height;
	}

	public get scrollBottom(): number {
		return this._scrollBottom;
	}

	public set scrollBottom(scrollBottom: number) {
		const newScrollBottom = Math.min(this.editor.const.maxHeight - this.editor.const.height, Math.max(0, scrollBottom)),
		if (newScrollBottom !== this.scrollBottom) {
			this._scrollBottom = newScrollBottom;
			this.editor.event.dispatchScrollEvent({
				oldScrollBottom: this.scrollBottom,
				newScrollBottom
			});
		}
	}
}
