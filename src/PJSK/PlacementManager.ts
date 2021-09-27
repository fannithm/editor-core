import { Editor } from './Editor';
import { FlickDirection } from '@fannithm/const/dist/pjsk';

export class PlacementManager {
	public critical = false;
	public width = 3;
	public direction = FlickDirection.Up;
	private _cursor = EditorCursor.Default;

	constructor(private editor: Editor) {
	}

	get cursor(): EditorCursor {
		return this._cursor;
	}

	set cursor(value: EditorCursor) {
		this._cursor = value;
	}
}

export enum EditorCursor {
	Default = 0,
	Tap = 1,
	Flick = 2,
	Slide = 3,
	SlideNode = 4,
	BPM = 5,
	Delete = 6
}
