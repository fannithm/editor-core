/*
import * as PIXI from 'pixi.js';
import { PJSK } from '@fannithm/const';

export class PJSKMapEditor {
	// TODO drag
	private dragStartBeat: PJSK.MapBeat;
	private dragStartLane: number;
	private dragStartWidth: number;

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
}
*/
