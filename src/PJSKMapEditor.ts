import * as PIXI from 'pixi.js';
import { PJSK, UUID } from '@fannithm/const';
import bezierEasing from 'bezier-easing';
import SingleNote from './notes/TapNote';
import SlideNote from './notes/SlideNote';
import { PJSKEventType } from './event';
import SlideVisibleNote from './notes/SlideVisibleNote';
import Cursor from './notes/Cursor';

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
	private app: PIXI.Application;
	private map: PJSK.IMap;
	private resolution: number;
	private container: {
		lane: PIXI.Container;
		time: PIXI.Container;
		note: PIXI.Container;
		slide: PIXI.Container;
		arrow: PIXI.Container;
		selection: PIXI.Container;
		cursor: Cursor
	};
	private notes: {
		[key: string]: PIXI.Texture;
	}
	private scrollBottom = 0;
	private const: {
		resolution: number,
		fontSize: number,
		heightPerSecond: number,
		spaceY: number,
		width: number,
		height: number,
		paddingX: number,
		paddingY: number,
		lineWidth: number,
		noteHeight: number,
		arrowHeight: number,
		maxHeight: number,
		cursorLineWidth: number
	};
	private colors = {
		background: 0xffffff,
		lane: 0x000000,
		bpm: 0x00ffff,
		time: 0xff0000,
		beat: {
			third: 0xff0000,
			half: 0x000000,
			quarter: 0x0000ff
		},
		slide: 0xd9faef,
		slideNote: 0x30e5a8,
		critical: 0xfcf9cd,
		criticalNote: 0xf1e41d,
		selection: 0x0390fc,
		cursor: 0x000000
	};
	private beatSlice: number;
	private selection: {
		single: UUID[],
		slide: {
			[key: string]: UUID[]
		},
		singleTemp: UUID[],
		slideTemp: {
			[key: string]: UUID[]
		}
	};
	private time: number;
	private currentTime: number;
	private lastMouseCursorPosition: {
		x: number,
		y: number
	};
	private selectionBox: number[];
	private scrollTicker: PIXI.Ticker;
	private autoScrollDelta: number;
	private dragStartBeat: PJSK.MapBeat;
	private actionList: MapEditorAction[];
	/**
	 * See [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) on MDN for usage.
	 *
	 * See {@link PJSKEventType} for all events.
	 */
	public event: EventTarget;

	/**
	 * @param container Editor container for containing canvas element.
	 * @param map Map json, see [map format](https://www.notion.so/File-Format-525cf5eb690d49c2a88ebcb7bd3faf46#1516081e92a34b51b020b4c040377693) for detail.
	 * @param time Map total time, used to calculate editor max height.
	 */
	constructor(container: HTMLElement, map: PJSK.IMap, time: number) {
		const { width, height } = container.getBoundingClientRect();
		const resolution = window.devicePixelRatio;
		this.resolution = resolution;
		this.setMap(map);
		this.app = new PIXI.Application({
			backgroundAlpha: 0,
			width,
			height,
			antialias: true,
			resolution
		});
		this.const = {
			resolution,
			fontSize: 18 / resolution,
			heightPerSecond: 500 / resolution,
			spaceY: 200 / resolution,
			width: width,
			height: height,
			paddingX: 4 / resolution,
			paddingY: 2 / resolution,
			lineWidth: 1 / resolution,
			noteHeight: 32 / resolution,
			arrowHeight: 32 / resolution,
			maxHeight: 0,
			cursorLineWidth: 3 / resolution
		};
		this.time = time;
		this.currentTime = 0;
		this.const.maxHeight = this.const.heightPerSecond * time + this.const.spaceY * 2;
		this.container = {
			lane: new PIXI.Container(),
			time: new PIXI.Container(),
			note: new PIXI.Container(),
			slide: new PIXI.Container(),
			arrow: new PIXI.Container(),
			selection: new PIXI.Container(),
			cursor: new Cursor(this.const.cursorLineWidth, this.const.width * 0.06 * 1.2, this.colors.cursor)
		};
		this.scrollBottom /= resolution;
		this.app.view.style.width = width + 'px';
		this.app.view.style.height = height + 'px';
		container.appendChild(this.app.view);
		this.app.stage.addChild(this.container.cursor);
		this.container.cursor.visible = false;
		this.container.cursor.zIndex = 15;
		this.app.stage.addChild(this.container.lane);
		this.app.stage.sortableChildren = true;
		this.app.stage.interactive = true;
		this.container.lane.name = 'Lane';
		this.notes = PIXI.Loader.shared.resources['images/sprite.json'].textures;
		this.event = new EventTarget();
		this.selection = {
			single: [],
			slide: {},
			singleTemp: [],
			slideTemp: {}
		};
		this.selectionBox = [0, 0, 0, 0];
		this.scrollTicker = new PIXI.Ticker();
		this.scrollTicker.autoStart = false;
		this.scrollTicker.add(this.scrollTickerHandler.bind(this));
		this.beatSlice = 4;
		this.lastMouseCursorPosition = {
			x: 0,
			y: 0
		}
		this.start();
	}

	private start(): void {
		const selectArea = new PIXI.Graphics();
		selectArea.name = 'SelectArea';
		selectArea.beginFill(this.colors.background, 1);
		selectArea.drawRect(0, 0, this.const.width, this.const.height);
		selectArea.zIndex = -1;
		selectArea.interactive = true;
		selectArea.endFill();
		this.app.stage.addChild(selectArea);
		this.drawLane();
		this.reRender();
		this.app.view.addEventListener('wheel', (event) => {
			const scrollBottom = Math.min(this.const.maxHeight - this.const.height, Math.max(0, this.scrollBottom - event.deltaY / this.resolution));
			this.scrollTo(scrollBottom);
		});
		const selectAreaMoveHandler = this.selectAreaMoveHandler.bind(this);
		// selection rect
		selectArea.on('mousedown', (event: PIXI.InteractionEvent) => {
			if (event.data.button !== 0) return;
			if (!event.data.originalEvent.ctrlKey) {
				this.emptySelection();
			}
			const point = event.data.global;
			const x = point.x;
			const y = this.scrollBottom + (this.const.height - point.y);
			this.selectionBox = [x, y, x, y];
			selectArea.on('mousemove', selectAreaMoveHandler);
			this.event.addEventListener(PJSKEventType.Scroll, selectAreaMoveHandler);
			this.reRender();
		});
		const mouseUpHandler = () => {
			this.selectionBox = [0, 0, 0, 0];
			selectArea.removeListener('mousemove', selectAreaMoveHandler);
			this.event.removeEventListener(PJSKEventType.Scroll, selectAreaMoveHandler);
			this.autoScrollDelta = 0;
			this.scrollTicker.stop();
			// move temp selection to selection
			this.selection.single.push(...this.selection.singleTemp);
			for (const id in this.selection.slideTemp) {
				if (Object.prototype.hasOwnProperty.call(this.selection.slideTemp, id)) {
					const slide = this.selection.slideTemp[id];
					if (!this.selection.slide[id]) this.selection.slide[id] = [];
					this.selection.slide[id].push(...slide);
				}
			}
			this.selection.singleTemp = [];
			this.selection.slideTemp = {};
			this.reRender();
		};
		window.addEventListener('mouseup', mouseUpHandler);
		// move cursor
		selectArea.on('mousemove', (event: PIXI.InteractionEvent) => {
			this.lastMouseCursorPosition.x = event.data.global.x;
			this.lastMouseCursorPosition.y = event.data.global.y;
			const [beat, lane] = this.getCursorPosition();
			this.moveCursor(beat, lane);
		});
		this.event.addEventListener(PJSKEventType.Scroll, () => {
			const [beat, lane] = this.getCursorPosition();
			this.moveCursor(beat, lane);
		});
		this.event.addEventListener(PJSKEventType.Destroy, () => {
			window.removeEventListener('mouseup', mouseUpHandler);
		});
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

		this.selection.singleTemp = [];
		this.selection.slideTemp = {};

		for (let i = 0; i < this.map.notes.length; i++) {
			const note = this.map.notes[i];
			const height = this.getHeightByBeat(note.beat);
			const noteStartX = this.getLaneX(note.lane);
			const noteEndX = this.getLaneX(note.lane + note.width);
			if (height >= startY && height <= endY &&
				noteStartX >= startX && noteEndX <= endX &&
				!this.selection.single.includes(note.id)) {
				this.selection.singleTemp.push(note.id);
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
					if (!this.selection.slideTemp[slide.id]) this.selection.slideTemp[slide.id] = [];
					this.selection.slideTemp[slide.id].push(note.id);
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

	scrollTo(height: number): void {
		const detail = {
			oldScrollBottom: this.scrollBottom,
			scrollBottom: 0,
		};
		this.scrollBottom = Math.min(this.const.maxHeight - this.const.height, Math.max(0, height));
		detail.scrollBottom = this.scrollBottom;
		this.event.dispatchEvent(new CustomEvent(PJSKEventType.Scroll, {
			detail
		}));
		this.reRender();
	}

	private reRender(): void {
		this.container.time.destroy({
			children: true
		});
		this.container.note.destroy({
			children: true
		});
		this.container.slide.destroy({
			children: true
		});
		this.container.arrow.destroy({
			children: true
		});
		this.container.selection.destroy({
			children: true
		});
		this.container.time = new PIXI.Container();
		this.container.note = new PIXI.Container();
		this.container.slide = new PIXI.Container();
		this.container.arrow = new PIXI.Container();
		this.container.selection = new PIXI.Container();
		this.container.time.name = 'Time';
		this.container.note.name = 'Note';
		this.container.slide.name = 'Slide';
		this.container.arrow.name = 'Arrow';
		this.container.selection.name = 'Selection';
		this.container.time.zIndex = 5;
		this.container.arrow.zIndex = 7;
		this.container.slide.zIndex = 8;
		this.container.note.zIndex = 9;
		this.container.selection.zIndex = 10;
		this.app.stage.addChild(this.container.time);
		this.app.stage.addChild(this.container.note);
		this.app.stage.addChild(this.container.slide);
		this.app.stage.addChild(this.container.arrow);
		this.app.stage.addChild(this.container.selection);
		this.drawBeat();
		this.drawBPM();
		this.drawCurrentTimeLine();
		this.drawNote();
		this.drawSlide();
		this.drawSelectionBox();
	}

	destroy(): void {
		this.event.dispatchEvent(new CustomEvent(PJSKEventType.Destroy));
		this.app.destroy(true, {
			children: true
		});
	}

	static loadResource(
		onLoad?: (loader: PIXI.Loader, resource: PIXI.ILoaderResource) => void,
		onError?: (loader: PIXI.Loader, resource: PIXI.ILoaderResource) => void): Promise<void> {
		return new Promise<void>(resolve => {
			const loader = PIXI.Loader.shared;
			loader.add("images/sprite.json").load(() => {
				console.log('load resources completed');
				resolve();
			});
			onLoad && loader.onLoad.add(onLoad);
			onError && loader.onError.add(onError);
		});
	}

	private minusBeat(beat1: PJSK.MapBeat, beat2: PJSK.MapBeat): number {
		return this.fractionToDecimal(beat1) - this.fractionToDecimal(beat2);
	}

	getTimeByBeat(beat: PJSK.MapBeat): number {
		let time = 0;
		for (let i = 0; i < this.map.bpms.length; i++) {
			const bpm = this.map.bpms[i];
			if (this.minusBeat(beat, bpm.beat) <= 0) break;
			const nextBpm = this.map.bpms[i + 1];
			time += (nextBpm
				? (this.minusBeat(beat, nextBpm.beat) > 0
					? this.minusBeat(nextBpm.beat, bpm.beat)
					: this.minusBeat(beat, bpm.beat))
				: (this.minusBeat(beat, bpm.beat))) / bpm.bpm * 60;
		}
		return time;
	}

	getHeightByBeat(beat: PJSK.MapBeat): number {
		return this.const.spaceY + this.getTimeByBeat(beat) * this.const.heightPerSecond;
	}

	getHeightByTime(time: number): number {
		return this.const.spaceY + time * this.const.heightPerSecond;
	}

	private formatTime(time: number): string {
		return `${Math.floor(time / 60)}:${(time % 60).toFixed(3).padStart(6, '0')}`
	}

	private getYInCanvas(height: number): number {
		return this.const.height - (height - this.scrollBottom);
	}

	private getLaneX(lane: number): number {
		return this.const.width * (lane * 6 + 14) / 100;
	}

	private fractionToDecimal(frac: number[]): number {
		return frac[0] + (frac[1] / frac[2]);
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

	private drawBPM(): void {
		for (let i = 0; i < this.map.bpms.length; i++) {
			const bpm = this.map.bpms[i];
			const bpmTime = this.getTimeByBeat(bpm.beat);
			const bpmHeight = this.getHeightByTime(bpmTime);
			if (bpmHeight >= this.scrollBottom && bpmHeight <= this.scrollBottom + this.const.height) {
				const line = new PIXI.Graphics();
				line.name = `BPM-${bpm.id}-line`;
				line.lineStyle(this.const.lineWidth, this.colors.bpm, 1);
				line.moveTo(0, 0);
				line.lineTo(this.const.width, 0);
				line.y = this.getYInCanvas(bpmHeight);
				const time = new PIXI.Text(this.formatTime(bpmTime), {
					fontSize: this.const.fontSize,
					fill: this.colors.bpm,
					align: 'left'
				});
				time.name = `BPM-${bpm.id}-time`;
				time.x = this.const.paddingX;
				time.y = this.getYInCanvas(bpmHeight) - time.height - this.const.paddingY;
				const value = new PIXI.Text(bpm.bpm.toString(), {
					fontSize: this.const.fontSize,
					fill: this.colors.bpm,
					align: 'left'
				});
				value.name = `BPM-${bpm.id}-value`;
				value.x = this.getLaneX(12) + this.const.paddingX;
				value.y = this.getYInCanvas(bpmHeight) - value.height - this.const.paddingY;
				this.container.time.addChild(line);
				this.container.time.addChild(time);
				this.container.time.addChild(value);
			} else if (bpmHeight > this.scrollBottom + this.const.height) break;
		}
	}

	private drawBeatLine(beat: number[], color: number, alpha: number, height: number, drawText = false): void {
		const line = new PIXI.Graphics();
		const _beat = this.fractionToDecimal(beat);
		line.name = `Beat-${_beat}-line`;
		line.lineStyle(this.const.lineWidth, color, alpha);
		line.moveTo(this.getLaneX(0), 0);
		line.lineTo(drawText ? this.const.width : this.getLaneX(12), 0);
		line.y = this.getYInCanvas(height);
		if (drawText) {
			const text = new PIXI.Text(`${Math.floor((beat[0]) / 4) + 1}:${beat[0] % 4 + 1}`, {
				fontSize: this.const.fontSize,
				fill: color,
				align: 'left'
			});
			text.name = `Beat-${_beat}-beat`;
			text.x = this.const.width - text.width - this.const.paddingX;
			text.y = this.getYInCanvas(height) - text.height - this.const.paddingY;
			this.container.time.addChild(text);
		}
		this.container.time.addChild(line);
	}

	private drawBeat(): void {
		this.container.time.destroy({
			children: true
		});
		this.container.time = new PIXI.Container();
		const slice = this.beatSlice;
		// 1/beatSlice beat per loop
		for (let i = 0; ; i++) {
			const beat: PJSK.MapBeat = [Math.floor(i / slice), i % slice, slice];
			const time = this.getTimeByBeat(beat);
			const height = this.getHeightByTime(time);
			if (height > this.const.maxHeight - this.const.spaceY) break;
			if (height >= this.scrollBottom && height <= this.scrollBottom + this.const.height) {
				if (i % slice === 0)
					this.drawBeatLine(beat, this.colors.beat.half, 1, height, true);
				else if (i % (slice / 2) === 0)
					this.drawBeatLine(beat, this.colors.beat.half, 0.2, height)
				else if (i % (slice / 3) === 0)
					this.drawBeatLine(beat, this.colors.beat.third, 0.4, height)
				else if (i % (slice / 4) === 0)
					this.drawBeatLine(beat, this.colors.beat.quarter, 0.4, height)
			} else if (height > this.scrollBottom + this.const.height) break;
		}
		this.app.stage.addChild(this.container.time);
	}

	private drawLane(): void {
		for (let i = 0; i <= 12; i++) {
			const line = new PIXI.Graphics();
			line.name = `Lane-${i}`
			const x = this.const.width * ((i * 6 + 14) / 100);
			line.lineStyle(this.const.lineWidth, this.colors.lane, ((i % 2) ? 0.2 : 1));
			line.moveTo(0, 0);
			line.lineTo(0, this.const.height);
			line.x = x;
			this.container.lane.addChild(line);
		}
	}

	private drawBaseNote(note: PJSK.INoteTap | PJSK.INoteFlick | PJSK.INoteSlideNote, name: string, height: number, slide?: PJSK.INoteSlide): void {
		const base = slide === undefined
			? new SingleNote(this.notes[name], note as PJSK.INoteTap)
			: new SlideNote(this.notes[name], note as PJSK.INoteSlideNote, slide);
		base.name = `Note-${name}-${note.id}`;
		const scale = this.const.noteHeight / base.height;
		base.scale.set(scale);
		base.x = this.getLaneX(note.lane) - 0.1 * 0.06 * this.const.width;
		base.y = this.getYInCanvas(height) - this.const.noteHeight / 2;
		base.width = (note.width + 0.2) * 0.06 * this.const.width / scale;
		base.on('click', slide === undefined ? this.singleClickHandler.bind(this) : this.slideClickHandler.bind(this));
		this.container.note.addChild(base);
	}

	private singleClickHandler(event: PIXI.InteractionEvent) {
		const id = (event.target as SingleNote).id;
		if (!event.data.originalEvent.ctrlKey) this.emptySelection();
		const index = this.selection.single.indexOf(id);
		if (index === -1) this.selection.single.push(id);
		else this.selection.single.splice(index, 1);
		this.reRender();
	}

	private slideClickHandler(event: PIXI.InteractionEvent) {
		const id = (event.target as SlideNote).id;
		const slideId = (event.target as SlideNote).slideId;
		if (!event.data.originalEvent.ctrlKey) this.emptySelection();
		if (!this.selection.slide[slideId]) this.selection.slide[slideId] = [];
		const index = this.selection.slide[slideId].indexOf(id);
		if (index === -1) this.selection.slide[slideId].push(id);
		else this.selection.slide[slideId].splice(index, 1);
		this.reRender();
	}

	private drawFlickArrow(note: PJSK.INoteFlick | PJSK.INoteSlideEndFlick, height: number): void {
		const width = Math.min(6, note.width);
		const name = `flick_arrow_${note.critical ? 'critical_' : ''}${width.toString().padStart(2, '0')}${{
			0: '',
			1: '_left',
			2: '_right'
		}[note.direction]}`;
		const arrow = new PIXI.Sprite(this.notes[name]);
		arrow.name = `Arrow-${note.id}`;
		const arrowWidth = (width * 0.8) * 0.06 * this.const.width;
		const scale = arrowWidth / arrow.width;
		const arrowHeight = arrow.height * scale;
		arrow.scale.set(scale);
		arrow.x = this.getLaneX(note.lane + (note.width - width) / 2 + width * 0.1)
		arrow.y = this.getYInCanvas(height) - arrowHeight;
		this.container.arrow.addChild(arrow);
	}

	private drawCurve(note: PJSK.INoteSlideNote, next: PJSK.INoteSlideNote, height: number, nextHeight: number, critical = false): void {
		const curve = new PIXI.Graphics();
		curve.name = `Curve-${note.id}`
		let bezier = [
			false,
			[0, 0, 1, 1],
			[1, .5, 1, 1],
			[0, 0, 0, .5],
			[.42, 0, .58, 1],
			note.bezier
		][note.curve];
		if (bezier) {
			let from = [this.getLaneX(note.lane + 0.1), this.getYInCanvas(height)];
			let to = [this.getLaneX(next.lane + 0.1), this.getYInCanvas(nextHeight)];
			curve.beginFill(critical ? this.colors.critical : this.colors.slide, .8);
			curve.moveTo(from[0], from[1]);
			curve.bezierCurveTo(
				from[0] + bezier[0] * (to[0] - from[0]),
				from[1] + bezier[1] * (to[1] - from[1]),
				from[0] + bezier[2] * (to[0] - from[0]),
				from[1] + bezier[3] * (to[1] - from[1]),
				to[0],
				to[1]
			);
			curve.lineTo(this.getLaneX(next.lane + next.width - 0.1), this.getYInCanvas(nextHeight))
			to = [this.getLaneX(note.lane + note.width - 0.1), this.getYInCanvas(height)];
			from = [this.getLaneX(next.lane + next.width - 0.1), this.getYInCanvas(nextHeight)]
			const [x1, y1, x2, y2] = bezier as PJSK.CubicBezier;
			bezier = [1 - x2, 1 - y2, 1 - x1, 1 - y1];
			curve.bezierCurveTo(
				from[0] + bezier[0] * (to[0] - from[0]),
				from[1] + bezier[1] * (to[1] - from[1]),
				from[0] + bezier[2] * (to[0] - from[0]),
				from[1] + bezier[3] * (to[1] - from[1]),
				to[0],
				to[1]
			);
			curve.endFill();
		}
		this.container.slide.addChild(curve);
	}

	private drawInvisibleNote(note: PJSK.INoteSlideInvisible, height: number, critical = false): void {
		const line = new PIXI.Graphics();
		line.name = `Invisible-${note.id}`;
		line.lineStyle(this.const.lineWidth * 3, critical ? this.colors.criticalNote : this.colors.slideNote, 1);
		line.moveTo(this.getLaneX(note.lane + 0.1), 0);
		line.lineTo(this.getLaneX(note.lane + note.width - 0.1), 0);
		line.y = this.getYInCanvas(height);
		// TODO select invisible note
		// line.interactive = true;
		// line.on('click', this.slideClickHandler.bind(this));
		this.container.slide.addChild(line);
	}

	private drawVisibleNote(note: PJSK.INoteSlideVisible, height: number, slide: PJSK.INoteSlide): void {
		const sprite = new SlideVisibleNote(this.notes[`slide_node${slide.critical ? '_critical' : ''}`], note, slide);
		sprite.name = `Visible-${note.id}`;
		const scale = this.const.noteHeight / sprite.height;
		sprite.scale.set(scale);
		sprite.x = this.getLaneX(note.lane + (note.width / 2)) - (sprite.width / 2);
		sprite.y = this.getYInCanvas(height) - (sprite.height / 2);
		sprite.on('click', this.slideClickHandler.bind(this));
		this.container.slide.addChild(sprite);
	}

	private drawSkippedVisibleNote(slide: PJSK.INoteSlide, start: PJSK.INoteSlideNote, from: number, to: number) {
		const fromHeight = this.getHeightByBeat(start.beat);
		const end = slide.notes[to];
		const toHeight = this.getHeightByBeat(end.beat);
		const bezier = [
			false,
			[0, 0, 1, 1],
			[0, 0, 0, .5],
			[1, .5, 1, 1],
			[1, .5, 0, .5],
			start.bezier
		][start.curve];
		const easing = bezier && bezierEasing(bezier[0], bezier[1], bezier[2], bezier[3]);
		for (let i = from; i < to; i++) {
			const note = slide.notes[i];
			const height = this.getHeightByBeat(note.beat);
			if (height >= this.scrollBottom - this.const.noteHeight &&
				height <= this.scrollBottom + this.const.height + this.const.noteHeight) {
				const progress = (height - fromHeight) / (toHeight - fromHeight);
				const _note = {
					id: note.id,
					type: PJSK.NoteType.SlideVisible,
					beat: note.beat,
					width: start.width + (end.width - start.width) * easing(progress),
					lane: start.lane + (end.lane - start.lane) * easing(progress),
				} as PJSK.INoteSlideVisible;
				this.drawVisibleNote(_note, height, slide);
				if (this.selection.slide[slide.id]?.includes(note.id) || this.selection.slideTemp[slide.id]?.includes(note.id)) {
					this.drawSelectionRect(_note, height);
				}
			}
			else if (height > this.scrollBottom + this.const.height + this.const.noteHeight) break;
		}
	}

	private drawSlide(): void {
		for (let i = 0; i < this.map.slides.length; i++) {
			const slide = this.map.slides[i];
			if (this.getHeightByBeat(slide.notes[slide.notes.length - 1].beat) < this.scrollBottom) continue;
			if (this.getHeightByBeat(slide.notes[0].beat) > this.scrollBottom + this.const.height + this.const.noteHeight) break;
			for (let j = 0; j < slide.notes.length; j++) {
				const note = slide.notes[j];
				const next = slide.notes[j + 1];
				const height = this.getHeightByBeat(note.beat);
				// find next note has lane property
				let nextCurve: PJSK.INoteSlideNote = next;
				let nextCurveIndex = j;
				if (next && next.lane === undefined) {
					nextCurveIndex += 1 + slide.notes.slice(j + 1).findIndex(v => v.lane !== undefined);
					nextCurve = slide.notes[nextCurveIndex];
				}
				// draw un-positioned slide visible note
				if (note.lane !== undefined && nextCurve &&
					height < this.scrollBottom + this.const.height + this.const.noteHeight &&
					this.getHeightByBeat(nextCurve.beat) > this.scrollBottom - this.const.noteHeight) {
					const nextHeight = this.getHeightByBeat(nextCurve.beat);
					this.drawCurve(note, nextCurve, height, nextHeight, slide.critical);
					if (next.lane === undefined) this.drawSkippedVisibleNote(slide, note, j + 1, nextCurveIndex);
				}
				if (height >= this.scrollBottom - this.const.noteHeight &&
					height <= this.scrollBottom + this.const.height + this.const.noteHeight) {
					if ([PJSK.NoteType.SlideStart, PJSK.NoteType.SlideEndDefault].includes(note.type)) {
						this.drawBaseNote(note, slide.critical ? 'critical' : 'slide', height, slide);
					}
					else if (note.type === PJSK.NoteType.SlideEndFlick) {
						this.drawBaseNote(note, (note.critical || slide.critical) ? 'critical' : 'flick', height, slide);
						// TODO do not hide flick arrow before scroll out of screen
						this.drawFlickArrow({
							...note,
							critical: note?.critical || slide.critical
						}, height);
					} // TODO select slide node when clicking
					else if (note.type === PJSK.NoteType.SlideInvisible) this.drawInvisibleNote(note, height, slide.critical);
					else if (note.type === PJSK.NoteType.SlideVisible) {
						this.drawVisibleNote(note, height, slide);
					}
					if (this.selection.slide[slide.id]?.includes(note.id) || this.selection.slideTemp[slide.id]?.includes(note.id)) {
						this.drawSelectionRect(note, height);
					}
				}
			}
		}
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

	private drawNote(): void {
		for (let i = 0; i < this.map.notes.length; i++) {
			const note = this.map.notes[i];
			const height = this.getHeightByBeat(note.beat);
			if (height >= this.scrollBottom - this.const.noteHeight && height <= this.scrollBottom + this.const.height + this.const.noteHeight) {
				if (note.type === PJSK.NoteType.Flick) this.drawFlickArrow(note, height);
				this.drawBaseNote(note, note.critical ? 'critical' : (note.type ? 'flick' : 'tap'), height);
				if (this.selection.single.includes(note.id) || this.selection.singleTemp.includes(note.id)) {
					this.drawSelectionRect(note, height);
				}
			}
			if (height > this.scrollBottom + this.const.height + this.const.noteHeight) break;
		}
	}

	setMap(map: PJSK.IMap): void {
		this.map = map;
		this.map.bpms = this.map.bpms.sort((a, b) => this.minusBeat(a.beat, b.beat));
		this.map.notes = this.map.notes.sort((a, b) => this.minusBeat(a.beat, b.beat));
		this.map.slides = this.map.slides.map(v => ({
			...v,
			notes: v.notes.sort((a, b) => this.minusBeat(a.beat, b.beat))
		})).sort((a, b) => this.minusBeat(a.notes[0].beat, b.notes[0].beat))
		console.log(this.map);
	}

	getHeightPerSecond(): number {
		return this.const.heightPerSecond * this.resolution;
	}

	setHeightPerSecond(heightPerSecond: number): void {
		// TODO scroll height
		if (heightPerSecond < 100 || heightPerSecond > 2000) return;
		this.scrollTo(this.scrollBottom * heightPerSecond / this.const.heightPerSecond);
		this.const.heightPerSecond = heightPerSecond / this.resolution;
		this.const.spaceY = this.const.heightPerSecond / 16;
		this.const.maxHeight = this.const.heightPerSecond * this.time + this.const.spaceY * 2;
		this.reRender();
	}

	getCurrentTime(): number {
		return this.currentTime;
	}

	setCurrentTime(time: number): void {
		this.currentTime = time;
		this.reRender();
	}

	setBeatSlice(slice: number): void {
		this.beatSlice = slice;
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

	getConst(name: string): number {
		return this.const[name];
	}
}

type MapEditorActionName = 'unselect' | 'select';

interface MapEditorAction {
	type: MapEditorActionName
}
