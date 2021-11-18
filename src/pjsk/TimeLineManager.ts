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

	public deleteTimeline(id: string): void {
		const index = this.editor.map.timelines.findIndex(v => v.id === id);
		if (index === -1) return;
		this.editor.map.timelines.splice(index, 1);
		this.editor.map.bpms = this.editor.map.bpms.filter(v => v.timeline === id);
		this.editor.map.notes = this.editor.map.notes.filter(v => v.timeline === id);
		this.editor.map.slides = this.editor.map.slides.filter(v => v.timeline === id);
	}
}
