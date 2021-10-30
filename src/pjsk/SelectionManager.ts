import { PJSK, UUID } from '@fannithm/const';
import { Editor } from './Editor';
import { IRenderInvisibleNodeObject, IRenderNoteObject, IRenderVisibleNodeObject } from './Parser';
import { INoteSlideEndDefault, INoteSlideEndFlick, INoteSlideStart, NoteType } from '@fannithm/const/dist/pjsk';
import SlideNote from './notes/SlideNote';

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
				if (note.id === 'CursorNote') continue;
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

	public deleteNotesBySelection(selection: IEditorSelection): void {
		for (let i = 0; i < selection.single.length; i++) {
			const id = selection.single[i];
			const index = this.editor.map.notes.findIndex(v => v.id === id);
			if (index !== -1) this.editor.map.notes.splice(index, 1);
		}
		for (const slideId in selection.slide) {
			const slideSelection = selection.slide[slideId];
			const slideIndex = this.editor.map.slides.findIndex(v => v.id === slideId);
			const slide = this.editor.map.slides[slideIndex];
			let start: INoteSlideStart = null;
			let end: INoteSlideEndDefault | INoteSlideEndFlick = null;
			for (let i = 0; i < slideSelection.length; i++) {
				const id = slideSelection[i];
				const index = slide.notes.findIndex(v => v.id === id);
				const [note] = slide.notes.splice(index, 1);
				if (note.type === NoteType.SlideStart) {
					start = note;
				} else if (note.type === NoteType.SlideEndDefault || note.type === NoteType.SlideEndFlick) {
					end = note;
				}
			}
			if (slide.notes.length <= 1) {
				this.editor.map.slides.splice(slideIndex, 1);
				continue;
			}
			if (start) {
				const slideHead = slide.notes[0];
				slideHead.type = NoteType.SlideStart;
				if (slideHead.lane === undefined) {
					const object = this.editor.parser.renderObjects.visibleNodes.find(v => v.id === slideHead.id);
					const laneWidth = this.editor.calculator.getLaneWidth(1);
					slideHead.lane = Math.round((object.x - this.editor.calculator.getLaneX(0)) / laneWidth);
					slideHead.width = Math.round(object.width / laneWidth);
					slideHead.curve = start.curve;
				}
			}
			if (end) {
				const slideTail = slide.notes[slide.notes.length - 1];
				slideTail.type = end.type;
				if (end.type === NoteType.SlideEndFlick) {
					(slideTail as INoteSlideEndFlick).direction = end.direction;
					if (end.critical) (slideTail as INoteSlideEndFlick).critical = end.critical;
				}
				if (slideTail.lane === undefined) {
					const object = this.editor.parser.renderObjects.visibleNodes.find(v => v.id === slideTail.id);
					const laneWidth = this.editor.calculator.getLaneWidth(1);
					slideTail.width = Math.round(object.width / laneWidth);
					slideTail.lane = Math.round((object.x - this.editor.calculator.getLaneX(0)) / laneWidth);
				}
			}
		}
		this.editor.renderer.parseAndRender();
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
