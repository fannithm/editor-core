// eslint-disable-file

import * as PIXI from 'pixi.js';
import { PJSK } from '@fannithm/const';


/**
 * ## Usage
 * ### Load resource first
 * See {@link PJSKMapEditor.loadResource}
 * ```js
 * await PJSKMapEditor.loadResource((loader, resource) => {
 * 	console.log(`${loader.progress}% loading: ${resource.url}`);
 * });
 * ```
 * ### Initialize
 * See {@link PJSKMapEditor.constructor}
 * ```js
 * const editor = new PJSKMapEditor(document.getElementById("container"), map, time);
 * ```
 */
export class PJSKMapEditor {
	private selection: IEditorSelection;
	private tempSelection: IEditorSelection;
	private oldSelection: IEditorSelection;
	private selectionBox: number[];
	private lastMouseCursorPosition: {
		x: number,
		y: number
	};
	private scrollTicker: PIXI.Ticker;
	private autoScrollDelta: number;
	// TODO drag
	private dragStartBeat: PJSK.MapBeat;
	private dragStartLane: number;
	private dragStartWidth: number;

	/**
	 * @param container Editor container for containing canvas element.
	 * @param map Map json, see [map format](https://www.notion.so/File-Format-525cf5eb690d49c2a88ebcb7bd3faf46#1516081e92a34b51b020b4c040377693) for detail.
	 * @param time Map total time, used to calculate editor max height.
	 */
	constructor(container: HTMLElement, map: PJSK.IMap, time: number) {
		this.selection = {
			single: [],
			slide: {}
		};
		this.tempSelection = {
			single: [],
			slide: {}
		}
		this.selectionBox = [0, 0, 0, 0];
		this.scrollTicker = new PIXI.Ticker();
		this.scrollTicker.autoStart = false;
		this.scrollTicker.add(this.scrollTickerHandler.bind(this));
		this.lastMouseCursorPosition = {
			x: 0,
			y: 0
		};
	}

	private dispatchSelectEvent() {
		const selection = JSON.parse(JSON.stringify(this.selection));
		if (!this.isSelectionEqual(this.oldSelection, selection)) {
			this.event.dispatchEvent(new CustomEvent<PJSKEvent.ISelectEventDetail>(PJSKEvent.Type.Select, {
				detail: {
					oldSelection: this.oldSelection,
					newSelection: selection
				}
			}));
			this.oldSelection = JSON.parse(JSON.stringify(selection));
		}
	}

	private selectAreaMoveHandler(): void {
		const point = this.lastMouseCursorPosition;
		this.selectionBox[2] = point.x;
		this.selectionBox[3] = this.scrollBottom + (this.const.height - point.y);
		// auto scroll
		const topScrollArea = this.const.height / 20;
		const bottomScrollArea = this.const.height - topScrollArea;
		if (point.y < topScrollArea || point.y > bottomScrollArea) {
			if (!this.scrollTicker.started) this.scrollTicker.start();
			this.autoScrollDelta = ((point.y < topScrollArea ? topScrollArea : bottomScrollArea) - point.y) / (topScrollArea / 10);
		} else {
			this.autoScrollDelta = 0;
			this.scrollTicker.stop();
		}
		this.findSelectedNote();
		this.reRender();
	}

	/**
	 * Add selected note to temp selection array
	 */
	private findSelectedNote() {
		const startY = Math.min(this.selectionBox[1], this.selectionBox[3]);
		const endY = Math.max(this.selectionBox[1], this.selectionBox[3]);
		const startX = Math.min(this.selectionBox[0], this.selectionBox[2]);
		const endX = Math.max(this.selectionBox[0], this.selectionBox[2]);

		this.tempSelection.single = [];
		this.tempSelection.slide = {};

		for (let i = 0; i < this.map.notes.length; i++) {
			const note = this.map.notes[i];
			const height = this.getHeightByBeat(note.beat);
			const noteStartX = this.getLaneX(note.lane);
			const noteEndX = this.getLaneX(note.lane + note.width);
			if (height >= startY && height <= endY &&
				noteStartX >= startX && noteEndX <= endX &&
				!this.selection.single.includes(note.id)) {
				this.tempSelection.single.push(note.id);
			} else if (height > endY) break;
		}

		for (let i = 0; i < this.map.slides.length; i++) {
			const slide = this.map.slides[i];
			const endHeight = this.getHeightByBeat(slide.notes[slide.notes.length - 1].beat);
			if (endHeight < startY) continue;
			for (let j = 0; j < slide.notes.length; j++) {
				const note = slide.notes[j];
				const height = this.getHeightByBeat(note.beat);
				let noteStartX = note.lane !== undefined ? this.getLaneX(note.lane) : 0;
				let noteEndX = note.lane !== undefined ? this.getLaneX(note.lane + note.width) : 0;
				// calculate lane of un-positioned note
				if (note.lane === undefined) {
					const noteReversedIndex = slide.notes.length - j - 1;
					const start = slide.notes.concat().reverse().find((note, index) => index > noteReversedIndex && note.lane !== undefined);
					const end = slide.notes.find((note, index) => index > j && note.lane !== undefined);
					const fromHeight = this.getHeightByBeat(start.beat);
					const toHeight = this.getHeightByBeat(end.beat);
					const progress = (height - fromHeight) / (toHeight - fromHeight);
					const bezier = [
						false,
						[0, 0, 1, 1],
						[0, 0, 0, .5],
						[1, .5, 1, 1],
						[1, .5, 0, .5],
						start.bezier
					][start.curve];
					const easing = bezier && bezierEasing(bezier[0], bezier[1], bezier[2], bezier[3]);
					const width = start.width + (end.width - start.width) * easing(progress);
					const lane = start.lane + (end.lane - start.lane) * easing(progress);
					noteStartX = this.getLaneX(bezier ? lane : start.lane);
					noteEndX = this.getLaneX(bezier ? (lane + width) : (start.lane + start.width));
				}

				if (height >= startY && height <= endY &&
					noteStartX >= startX && noteEndX <= endX &&
					!this.selection.slide[slide.id]?.includes(note.id)) {
					if (!this.tempSelection.slide[slide.id]) this.tempSelection.slide[slide.id] = [];
					this.tempSelection.slide[slide.id].push(note.id);
				}
				else if (height > endY && j === 0) return;
				else if (height > endY) break;
			}
		}
	}

	private emptySelection() {
		this.selection.single = [];
		this.selection.slide = {};
	}

	private scrollTickerHandler(): void {
		this.scrollTo(this.scrollBottom + this.autoScrollDelta);
	}

	private drawSelectionBox() {
		const box = this.selectionBox;
		if (box[0] === box[2] || box[1] === box[3]) return;
		const selectionBox = new PIXI.Graphics();
		selectionBox.beginFill(this.colors.selection, 0.2);
		selectionBox.lineStyle(this.const.lineWidth, this.colors.selection);
		// TODO max width and max height out of box
		const y = this.getYInCanvas(box[1]);
		const height = this.getYInCanvas(box[3]) - y;
		selectionBox.drawRect(box[0], y, box[2] - box[0], height);
		selectionBox.endFill();
		this.container.selection.addChild(selectionBox);
	}

	private drawCurrentTimeLine() {
		const height = this.getHeightByTime(this.currentTime);
		if (height >= this.scrollBottom && height <= this.scrollBottom + this.const.height) {
			const line = new PIXI.Graphics();
			line.name = `Time-line`;
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
		rect.name = `Selection-${note.id}`;
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

	private isUniqueArrayEqual<T>(a: T[], b: T[]) {
		return a.length === b.length && a.every(v => b.includes(v))
	}

	/**
	 * Compare is selection a equals to selection b
	 * @param a selection a
	 * @param b selection b
	 */
	isSelectionEqual(a: IEditorSelection, b: IEditorSelection): boolean {
		// compare array length
		if (!this.isUniqueArrayEqual(a.single, b.single)) return false;
		const slideAKey = Object.keys(a.slide);
		const slideBKey = Object.keys(b.slide)
		if (!this.isUniqueArrayEqual(slideAKey, slideBKey)) return false;
		return slideAKey.every(key => {
			return this.isUniqueArrayEqual(a.slide[key], b.slide[key])
		})
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
		}
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
