import { PJSK, UUID } from '@fannithm/const';
import { Editor } from './Editor';
import { IRenderInvisibleNodeObject, IRenderNoteObject, IRenderVisibleNodeObject } from './Parser';

export class SelectionManager {
	public selection: IEditorSelection;
	public tempSelection: IEditorSelection;
	public oldSelection: IEditorSelection;
	public selectionBox: number[];

	constructor(private editor: Editor) {
		this.selection = {
			single: [],
			slide: {}
		};
		this.tempSelection = {
			single: [],
			slide: {}
		};
		this.oldSelection = {
			single: [],
			slide: {}
		};
		this.selectionBox = [0, 0, 0, 0];
	}

	emptySelection(): void {
		this.selection.single = [];
		this.selection.slide = {};
	}

	private isUniqueArrayEqual<T>(a: T[], b: T[]): boolean {
		return a.length === b.length && a.every(v => b.includes(v));
	}

	/**
	 * Compare is selection a equals to selection b.
	 * @param a selection a
	 * @param b selection b
	 */
	isSelectionEqual(a: IEditorSelection, b: IEditorSelection): boolean {
		if (!this.isUniqueArrayEqual(a.single, b.single)) return false;
		const slideAKey = Object.keys(a.slide);
		const slideBKey = Object.keys(b.slide);
		if (!this.isUniqueArrayEqual(slideAKey, slideBKey)) return false;
		return slideAKey.every(key => {
			return this.isUniqueArrayEqual(a.slide[key], b.slide[key]);
		});
	}

	/**
	 * Merge temp selection to selection.
	 */
	mergeTempSelection(): void {
		this.selection.single.push(...this.tempSelection.single);
		for (const id in this.tempSelection.slide) {
			if (Object.prototype.hasOwnProperty.call(this.tempSelection.slide, id)) {
				const slide = this.tempSelection.slide[id];
				if (!this.selection.slide[id]) this.selection.slide[id] = [];
				this.selection.slide[id].push(...slide);
			}
		}
		this.tempSelection.single = [];
		this.tempSelection.slide = {};
	}

	/**
	 * Add selected note to temp selection array.
	 */
	public findSelectedNote(): void {
		const startY = Math.min(this.selectionBox[1], this.selectionBox[3]);
		const endY = Math.max(this.selectionBox[1], this.selectionBox[3]);
		const startX = Math.min(this.selectionBox[0], this.selectionBox[2]);
		const endX = Math.max(this.selectionBox[0], this.selectionBox[2]);

		this.tempSelection.single = [];
		this.tempSelection.slide = {};

		const find = (arr: (IRenderNoteObject | IRenderVisibleNodeObject | IRenderInvisibleNodeObject)[]) => {
			for (let i = 0; i < arr.length; i++) {
				const note = arr[i];
				if (note.scrollHeight >= startY && note.scrollHeight <= endY &&
					note.x >= startX && (note.x + note.width) <= endX) {
					if (note.slideId !== undefined && !this.selection.slide[note.slideId]?.includes(note.id)) {
						if (!this.tempSelection.slide[note.slideId]) this.tempSelection.slide[note.slideId] = [];
						this.tempSelection.slide[note.slideId].push(note.id);
					} else if (!this.selection.single.includes(note.id))
						this.tempSelection.single.push(note.id);
				}
			}
		};

		const renderObject = this.editor.parser.renderObjects;

		find(renderObject.notes);
		find(renderObject.visibleNodes);
		find(renderObject.invisibleNodes);
	}

	/**
	 * Get selected note.
	 * @param selection
	 */
	public getNotesBySelection(selection: IEditorSelection): IEditorSelectionNote {
		return {
			single: selection.single.map(id => {
				return this.editor.map.notes.find(note => note.id === id);
			}),
			slide: Object.keys(selection.slide).map(id => {
				const slide = this.editor.map.slides.find(v => v.id === id);
				return {
					...slide,
					notes: slide.notes.filter(note => {
						return selection.slide[id].includes(note.id);
					})
				};
			})
		};
	}

	/**
	 * Delete note by selection
	 * @param selection
	 * @returns deleted note
	 */
	public deleteNotesBySelection(selection: IEditorSelection): IEditorSelectionNote {
		const deletedNote: IEditorSelectionNote = {
			single: [],
			slide: []
		};
		this.editor.map.notes = this.editor.map.notes.filter(note => {
			if (selection.single.includes(note.id)) {
				deletedNote.single.push(note);
				return false;
			}
			return true;
		});
		this.editor.map.slides = this.editor.map.slides.map(slide => {
			if (!selection.slide[slide.id]) return slide;
			const deletedSlide = {
				...slide,
				notes: []
			};
			deletedNote.slide.push(deletedSlide);
			slide.notes = slide.notes.filter((note) => {
				if (selection.slide[slide.id].includes(note.id)) {
					deletedSlide.notes.push(note);
					return false;
				}
				return true;
			});
			slide.notes.forEach((note, index) => {
				/*if ((index === 0 || index === slide.notes.length - 1) && slide.notes.length !== 2) {
				 const neighborNote = slide.notes[index + (index === 0 ? 1 : -1)];
				 // change start/end note type
				 neighborNote.type = note.type;
				 // check un-positioned note
				 if (neighborNote.lane === undefined) {
				 deletedSlide.notes.push({
				 ...neighborNote
				 });
				 neighborNote.width = note.width;
				 neighborNote.lane = note.lane;
				 neighborNote.curve = note.curve;
				 if (note.bezier !== undefined) neighborNote.bezier = note.bezier;
				 // end flick
				 if ((note as PJSK.INoteSlideEndFlick).direction !== undefined)
				 (neighborNote as PJSK.INoteSlideEndFlick).direction = (note as PJSK.INoteSlideEndFlick).direction;
				 if ((note as PJSK.INoteSlideEndFlick).critical !== undefined)
				 (neighborNote as PJSK.INoteSlideEndFlick).critical = (note as PJSK.INoteSlideEndFlick).critical;
				 }
				 }*/
			});
			return slide;
		}).filter(slide => {
			// check slide notes length
			if (slide.notes.length === 1) {
				deletedNote.slide.find(v => v.id === slide.id).notes.push(slide.notes[0]);
			}
			return slide.notes.length > 1;
		});
		this.editor.renderer.parseAndRender();
		return deletedNote;
	}
}

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
