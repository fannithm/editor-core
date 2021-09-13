import { Editor } from './Editor';

export class AudioManager {
	private _currentTime = 0;
	private _totalTime = 10;
	private _follow = false;

	constructor(private editor: Editor) {
	}

	public get currentTime(): number {
		return this._currentTime;
	}

	public set currentTime(currentTime: number) {
		// TODO scrollBottom
		this._currentTime = currentTime;
		this.editor.renderer.render();
	}

	public get totalTime(): number {
		return this._totalTime;
	}

	public set totalTime(totalTime: number) {
		this._totalTime = totalTime;
		this.editor.renderer.render();
	}

	public get follow(): boolean {
		return this._follow;
	}

	public set follow(value: boolean) {
		this._follow = value;
		this.editor.renderer.render();
	}
}
