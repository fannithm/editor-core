import { Editor } from './Editor';

export class TimeLineManager {
	private _prime = '';
	private _visible: string[] = [];

	constructor(private editor: Editor) {
	}

	public get prime(): string {
		return this._prime;
	}

	public set prime(prime: string) {
		this._prime = prime;
		this.editor.renderer.parseAndRender();
	}

	public get visible(): string[] {
		return this._visible;
	}

	public set visible(visible: string[]) {
		this._visible = visible;
		if (visible.length === 1 || (visible.length > 1 && !visible.includes(this.prime))) this.prime = visible[0];
		this.editor.renderer.parseAndRender();
	}
}
