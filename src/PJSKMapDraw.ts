import * as PIXI from 'pixi.js';
import { PJSK } from '@fannithm/const';
import bezierEasing from 'bezier-easing';

export default class PJSKMapDraw {
	private app: PIXI.Application;
	private map: PJSK.IMap;
	private resolution: number;
	private container: {
		lane: PIXI.Container;
		time: PIXI.Container;
		note: PIXI.Container;
		slide: PIXI.Container;
		arrow: PIXI.Container;
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
		maxHeight: number
	};
	private colors = {
		lane: 0x000000,
		bpm: 0x00ffff,
		beat: {
			third: 0xff0000,
			half: 0x000000,
			quarter: 0x0000ff
		},
		slide: 0xd9faef,
		slideNote: 0x30e5a8,
		critical: 0xfcf9cd,
		criticalNote: 0xf1e41d
	};
	private beatLine = {
		third: false,
		half: true,
		quarter: true
	};
	public event: EventTarget;

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
			heightPerSecond: 3200 / resolution,
			spaceY: 200 / resolution,
			width: width,
			height: height,
			paddingX: 4 / resolution,
			paddingY: 2 / resolution,
			lineWidth: 1 / resolution,
			noteHeight: 32 / resolution,
			arrowHeight: 32 / resolution,
			maxHeight: 0
		};
		this.const.maxHeight = this.const.heightPerSecond * time + this.const.spaceY * 2;
		this.container = {
			lane: new PIXI.Container(),
			time: new PIXI.Container(),
			note: new PIXI.Container(),
			slide: new PIXI.Container(),
			arrow: new PIXI.Container()
		};
		this.scrollBottom /= resolution;
		this.app.view.style.width = width + 'px';
		this.app.view.style.height = height + 'px';
		container.appendChild(this.app.view);
		this.app.stage.addChild(this.container.lane);
		this.app.stage.sortableChildren = true;
		this.container.lane.name = 'Lane';
		this.notes = PIXI.Loader.shared.resources['images/sprite.json'].textures;
		this.event = new EventTarget();
		this.start();
	}

	start(): void {
		this.drawLane();
		this.reRender();
		this.app.view.addEventListener('wheel', (event) => {
			const scrollBottom = Math.min(this.const.maxHeight, Math.max(0, this.scrollBottom - event.deltaY / this.resolution));
			this.scrollTo(scrollBottom);
		});
	}

	scrollTo(height: number): void {
		this.scrollBottom = Math.min(this.const.maxHeight, Math.max(0, height));
		this.event.dispatchEvent(new CustomEvent('scroll', {
			detail: {
				scrollBottom: this.scrollBottom,
			}
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
		this.container.time = new PIXI.Container();
		this.container.note = new PIXI.Container();
		this.container.slide = new PIXI.Container();
		this.container.arrow = new PIXI.Container();
		this.container.time.name = 'Time';
		this.container.note.name = 'Note';
		this.container.slide.name = 'Slide';
		this.container.arrow.name = 'Arrow';
		this.container.time.zIndex = 5;
		this.container.arrow.zIndex = 7;
		this.container.slide.zIndex = 8;
		this.container.note.zIndex = 10;
		this.app.stage.addChild(this.container.time);
		this.app.stage.addChild(this.container.note);
		this.app.stage.addChild(this.container.slide);
		this.app.stage.addChild(this.container.arrow);
		this.drawBeat();
		this.drawBPM();
		this.drawNote();
		this.drawSlide();
	}

	destroy(): void {
		this.app.destroy(true, {
			children: true
		});
	}

	static loadResource(
		onLoad: (loader: PIXI.Loader, resource: PIXI.ILoaderResource) => void,
		onError: (err: Error, loader: PIXI.Loader, resource: PIXI.ILoaderResource) => void): Promise<void> {
		return new Promise<void>(resolve => {
			const loader = PIXI.Loader.shared;
			loader.add("images/sprite.json").load(() => {
				console.log('load resources completed');
				resolve();
			});
			loader.onLoad.add(onLoad);
			loader.onError.add(onError);
		});
	}

	private minusBeat(beat1: PJSK.MapBeat, beat2: PJSK.MapBeat): number {
		return this.fractionToDecimal(beat1) - this.fractionToDecimal(beat2);
	}

	private getTimeByBeat(beat: PJSK.MapBeat): number {
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

	private getHeightByBeat(beat: PJSK.MapBeat): number {
		return this.const.spaceY + this.getTimeByBeat(beat) * this.const.heightPerSecond;
	}

	private getHeightByTime(time: number): number {
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
			const text = new PIXI.Text(`${beat[0] + 1}:${(beat[1] / 12) + 1}`, {
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
		// 1/12 beat per loop
		for (let i = 0; ; i++) {
			const beat: PJSK.MapBeat = [Math.floor(i / 48), i % 48, 48];
			const time = this.getTimeByBeat(beat);
			const height = this.getHeightByTime(time);
			if (height - this.const.height > this.const.maxHeight - this.const.spaceY) break;
			if (height >= this.scrollBottom && height <= this.scrollBottom + this.const.height) {
				if (i % 12 === 0)
					this.drawBeatLine(beat, this.colors.beat.half, 1, height, true);
				else if (i % 6 === 0 && this.beatLine.half)
					this.drawBeatLine(beat, this.colors.beat.half, 0.2, height)
				else if (i % 4 === 0 && this.beatLine.third)
					this.drawBeatLine(beat, this.colors.beat.third, 0.4, height)
				else if (i % 3 === 0 && this.beatLine.quarter)
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

	private nineSliceNote(texture: PIXI.Texture): PIXI.NineSlicePlane {
		return new PIXI.NineSlicePlane(texture, 91, 0, 91, 0);
	}

	private drawBaseNote(note: PJSK.INoteTap | PJSK.INoteFlick | PJSK.INoteSlideNote, name: string, height: number): void {
		const tap = this.nineSliceNote(this.notes[name]);
		tap.name = `Note-${name}-${note.id}`;
		const scale = this.const.noteHeight / tap.height;
		tap.scale.set(scale);
		tap.x = this.getLaneX(note.lane) - 0.1 * 0.06 * this.const.width;
		tap.y = this.getYInCanvas(height) - this.const.noteHeight / 2;
		tap.width = (note.width + 0.2) * 0.06 * this.const.width / scale;
		tap.interactive = true;
		this.container.note.addChild(tap);
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
		this.container.slide.addChild(line);
	}

	private drawVisibleNote(note: PJSK.INoteSlideVisible, height: number, critical = false): void {
		const sprite = new PIXI.Sprite(this.notes[`slide_node${critical ? '_critical' : ''}`]);
		sprite.name = `Visible-${note.id}`;
		if (note.lane !== undefined) {
			const scale = this.const.noteHeight / sprite.height;
			sprite.scale.set(scale);
			sprite.x = this.getLaneX(note.lane + (note.width / 2)) - (sprite.width / 2);
			sprite.y = this.getYInCanvas(height) - (sprite.height / 2);
			this.container.slide.addChild(sprite);
		}
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
				this.drawVisibleNote({
					id: note.id,
					type: PJSK.NoteType.SlideVisible,
					beat: note.beat,
					width: start.width + (end.width - start.width) * easing(progress),
					lane: start.lane + (end.lane - start.lane) * easing(progress),
				}, height, slide.critical);
			}
			else if (height > this.scrollBottom + this.const.height + this.const.noteHeight) break;
		}
	}

	private drawSlide(): void {
		for (let i = 0; i < this.map.slides.length; i++) {
			const slide = this.map.slides[i];
			if (this.getHeightByBeat(slide.notes[0].beat) > this.scrollBottom + this.const.height + this.const.noteHeight) return;
			for (let j = 0; j < slide.notes.length; j++) {
				const note = slide.notes[j];
				const next = slide.notes[j + 1];
				const height = this.getHeightByBeat(note.beat);
				let nextCurve: PJSK.INoteSlideNote = next;
				let nextCurveIndex = j;
				if (next && next.lane === undefined) {
					nextCurveIndex = j + 1 + slide.notes.slice(j + 1).findIndex(v => v.lane !== undefined);
					nextCurve = slide.notes[nextCurveIndex];
				}
				if (note.lane !== undefined && nextCurve &&
					this.getHeightByBeat(note.beat) < this.scrollBottom + this.const.height + this.const.noteHeight &&
					this.getHeightByBeat(nextCurve.beat) > this.scrollBottom - this.const.noteHeight) {
					const nextHeight = this.getHeightByBeat(nextCurve.beat);
					this.drawCurve(note, nextCurve, height, nextHeight, slide.critical);
					if (next.lane === undefined) this.drawSkippedVisibleNote(slide, note, j + 1, nextCurveIndex);
				}
				if (height >= this.scrollBottom - this.const.noteHeight &&
					height <= this.scrollBottom + this.const.height + this.const.noteHeight) {
					if ([PJSK.NoteType.SlideStart, PJSK.NoteType.SlideEndDefault].includes(note.type)) {
						this.drawBaseNote(note, slide.critical ? 'critical' : 'slide', height);
					}
					else if (note.type === PJSK.NoteType.SlideEndFlick) {
						this.drawBaseNote(note, (note.critical || slide.critical) ? 'critical' : 'flick', height);
						this.drawFlickArrow({
							...note,
							critical: note?.critical || slide.critical
						}, height);
					}
					else if (note.type === PJSK.NoteType.SlideInvisible) this.drawInvisibleNote(note, height, slide.critical);
					else if (note.type === PJSK.NoteType.SlideVisible) {
						this.drawVisibleNote(note, height, slide.critical);
					}
				}
			}
		}
	}

	private drawNote(): void {
		for (let i = 0; i < this.map.notes.length; i++) {
			const note = this.map.notes[i];
			const height = this.getHeightByBeat(note.beat);
			if (height >= this.scrollBottom - this.const.noteHeight && height <= this.scrollBottom + this.const.height + this.const.noteHeight) {
				if (note.type) this.drawFlickArrow(note, height);
				this.drawBaseNote(note, note.critical ? 'critical' : (note.type ? 'flick' : 'tap'), height);
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
}
