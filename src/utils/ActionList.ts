export default class ActionList {
	private maxRecords: number;
	private list: IEditorSelectAction[];

	constructor(maxRecords: number) {
		this.maxRecords = maxRecords;
	}

	push(action: IEditorSelectAction): void {
		this.list.push(action);
	}
}

export enum EditorActionName {
	Select = 'select',
	Unselect = 'unselect'
}

export interface IEditorAction<Type, Param> {
	type: Type,
	param: Param
}

export type IEditorSelectAction = IEditorAction<EditorActionName.Select, {
	from: EditorActionName
}>;
