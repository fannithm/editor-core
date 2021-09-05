import { UUID } from "@fannithm/const";

export interface IEditorSelection {
	single: UUID[],
	slide: {
		[key: string]: UUID[]
	}
}
