// eslint-disable-file

import * as PIXI from 'pixi.js';
import { PJSK } from '@fannithm/const';


export class PJSKMapEditor {
	// TODO drag
	private dragStartBeat: PJSK.MapBeat;
	private dragStartLane: number;
	private dragStartWidth: number;



	private drawCurrentTimeLine() {
		const height = this.getHeightByTime(this.currentTime);
		if (height >= this.scrollBottom && height <= this.scrollBottom + this.const.height) {
			const line = new PIXI.Graphics();
			line.name = 'Time-line';
			line.lineStyle(this.const.lineWidth, this.colors.time, 1);
			line.moveTo(0, 0);
			line.lineTo(this.const.width * 0.8, 0);
			line.x = this.const.width * 0.1;
			line.y = this.getYInCanvas(height);
			this.container.time.addChild(line);
		}
	}

	private singleClickHandler(event: PIXI.InteractionEvent) {
		if (event.data.button !== 0) return;
		const id = (event.target as SingleNote).id;
		if (!event.data.originalEvent.ctrlKey) this.emptySelection();
		const index = this.selection.single.indexOf(id);
		if (index === -1) this.selection.single.push(id);
		else this.selection.single.splice(index, 1);
		this.dispatchSelectEvent();
		this.reRender();
	}

	private slideClickHandler(event: PIXI.InteractionEvent) {
		if (event.data.button !== 0) return;
		const id = (event.target as SlideNote).id;
		const slideId = (event.target as SlideNote).slideId;
		if (!event.data.originalEvent.ctrlKey) this.emptySelection();
		if (!this.selection.slide[slideId]) this.selection.slide[slideId] = [];
		const index = this.selection.slide[slideId].indexOf(id);
		if (index === -1) this.selection.slide[slideId].push(id);
		else this.selection.slide[slideId].splice(index, 1);
		this.dispatchSelectEvent();
		this.reRender();
	}

	private drawSelectionRect(note: PJSK.INoteTap | PJSK.INoteFlick | PJSK.INoteSlideNote, height: number) {
		const rect = new PIXI.Graphics();
		rect.name = `Selection-${ note.id }`;
		rect.lineStyle(this.const.lineWidth * 4, this.colors.selection);
		rect.drawRect(this.getLaneX(note.lane) - this.const.paddingX, this.getYInCanvas(height) - this.const.noteHeight / 2, 0.06 * this.const.width * note.width + this.const.paddingX * 2, this.const.noteHeight);
		this.container.selection.addChild(rect);
	}

	private moveCursor(beat: PJSK.MapBeat, lane: number): void {
		if (beat === undefined) return;
		const height = this.getHeightByBeat(beat);
		if (height > this.const.maxHeight - this.const.spaceY) return;
		if (lane < 0 || lane > 11) {
			this.container.cursor.visible = false;
			return;
		}
		const y = this.getYInCanvas(height);
		this.container.cursor.y = y;
		this.container.cursor.x = this.getLaneX(lane - 0.1);
		this.container.cursor.visible = true;
	}

	public getSelection(): IEditorSelection {
		return JSON.parse(JSON.stringify(this.selection));
	}

	public getNotesBySelection(selection: IEditorSelection): IEditorSelectionNote {
		return {
			single: selection.single.map(id => {
				const note = this.map.notes.find(note => note.id === id);
				return note;
			}),
			slide: Object.keys(selection.slide).map(id => {
				const slide = this.map.slides.find(v => v.id === id);
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
		this.map.notes = this.map.notes.filter(note => {
			if (selection.single.includes(note.id)) {
				deletedNote.single.push(note);
				return false;
			}
			return true;
		});
		this.map.slides = this.map.slides.map(slide => {
			if (!selection.slide[slide.id]) return slide;
			deletedNote.slide.push({
				...slide,
				notes: []
			});
			slide.notes = slide.notes.filter((note, index) => {
				if (selection.slide[slide.id].includes(note.id)) {
					const deletedSlide = deletedNote.slide.find(v => v.id === slide.id);
					deletedSlide.notes.push(note);
					if ((index === 0 || index === slide.notes.length - 1) && slide.notes.length !== 2) {
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
					}
					return false;
				}
				return true;
			});
			return slide;
		}).filter(slide => {
			// check slide notes length
			if (slide.notes.length === 1) {
				deletedNote.slide.find(v => v.id === slide.id).notes.push(slide.notes[0]);
			}
			return slide.notes.length > 1;
		});
		this.reRender();
		return deletedNote;
	}

	/**
	 * Get the current position of the cursor.
	 * @returns the beat and the lane of the cursor
	 */
	getCursorPosition(): [PJSK.MapBeat, number] {
		const mouseHeight = this.scrollBottom + this.const.height - this.lastMouseCursorPosition.y;
		let lastNegative = 0;
		let lastBeat: PJSK.MapBeat = [0, 0, 1];
		const beatSlice = this.beatSlice;
		// 1/beatSlice beat per loop
		for (let i = 0; ; i++) {
			const beat: PJSK.MapBeat = [Math.floor(i / beatSlice), i % beatSlice, beatSlice];
			const height = this.getHeightByBeat(beat);
			if (height < mouseHeight) {
				lastNegative = mouseHeight - height;
				lastBeat = beat;
				continue;
			}
			if (height >= mouseHeight) {
				const positive = height - mouseHeight;
				const x = this.lastMouseCursorPosition.x - this.getLaneX(0);
				const lane = Math.floor(x / (this.const.width * 0.06));
				return [positive < lastNegative ? beat : lastBeat, lane];
			}
		}
	}
}
