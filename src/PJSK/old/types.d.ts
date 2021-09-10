import { UUID } from "@fannithm/const";
import { PJSK } from "@fannithm/const";

export interface IEditorSelection {
	single: UUID[],
	slide: {
		[key: string]: UUID[]
	}
}

export interface IEditorSelectionNote {
	single: (PJSK.INoteTap | PJSK.INoteFlick)[];
	slide: PJSK.INoteSlide[];
}
