import { Editor } from './Editor';
import * as PIXI from 'pixi.js';

export class ScrollController {
	public _scrollBottom = 0;
	public scrollTicker = new PIXI.Ticker();
	public autoScrollDelta = 0;

	constructor(private editor: Editor) {
		this.scrollTicker.autoStart = false;
	}

	scrollTo(height: number): void {
		this.scrollBottom = height;
	}

	public get scrollBottom(): number {
		return this._scrollBottom;
	}

	public set scrollBottom(scrollBottom: number) {
		const newScrollBottom = Math.min(this.editor.const.maxHeight - this.editor.const.height, Math.max(0, scrollBottom));
		if (newScrollBottom !== this.scrollBottom) {
			const oldScrollBottom = this._scrollBottom;
			this._scrollBottom = newScrollBottom;
			this.editor.event.dispatchScrollEvent(oldScrollBottom, this._scrollBottom);
		}
		this.editor.renderer.render();
	}
}
