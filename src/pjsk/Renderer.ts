import * as PIXI from 'pixi.js';
import { Editor } from './Editor';
import SlideNote from './notes/SlideNote';
import SlideVisibleNote from './notes/SlideVisibleNote';
import SingleNote from './notes/SingleNote';
import { IRenderObjects } from './Parser';
import Cursor from './notes/Cursor';
import { Fraction } from '@fannithm/utils';

export class Renderer {
	private containers: {
		lane: PIXI.Container;
		time: PIXI.Container;
		note: PIXI.Container;
		slide: PIXI.Container;
		arrow: PIXI.Container;
		selection: PIXI.Container;
	};
	public background: PIXI.Graphics;
	public app: PIXI.Application;
	private currentTimeLine: PIXI.Graphics;
	public readonly cursor: Cursor;

	constructor(private editor: Editor) {
		const { width, height } = this.editor.const;
		this.app = new PIXI.Application({
			backgroundAlpha: 0,
			width,
			height,
			antialias: true,
			resolution: this.editor.const.resolution
		});
		this.app.view.style.width = width + 'px';
		this.app.view.style.height = height + 'px';
		this.editor.container.appendChild(this.app.view);
		this.app.stage.sortableChildren = true;
		this.app.stage.interactive = true;
		// cursor
		this.cursor = new Cursor(this.editor.const.cursorLineWidth, this.editor.calculator.getLaneWidth(1.2), this.editor.resourceManager.theme.color.cursor, this.editor.resourceManager.textures);
		this.cursor.visible = false;
		this.cursor.zIndex = 15;
		this.app.stage.addChild(this.cursor);
		this.containers = {
			lane: null,
			time: null,
			note: null,
			slide: null,
			arrow: null,
			selection: null
		};
		this.initContainers();
		this.initLaneContainer();
	}

	initLaneContainer(): void {
		this.containers.lane = new PIXI.Container();
		this.containers.lane.name = 'Lane';
		this.app.stage.addChild(this.containers.lane);
	}

	updateColorTheme(): void {
		// TODO
	}

	parseAndRender(): void {
		this.editor.parser.parse();
		this.render();
	}

	render(): void {
		this.destroyContainers();
		this.initContainers();
		this.renderBeatLines();
		this.renderTexts();
		this.renderNotes();
		this.renderArrows();
		this.renderCurves();
		this.renderVisibleNodes();
		this.renderInvisibleNodes();
		this.renderSelectionBox();
		this.updateCurrentTimeLine();
	}


	renderOnce(): void {
		this.renderBackground();
		this.renderLanes();
		this.renderCurrentTimeLine();
	}

	private renderBackground(): void {
		// background
		this.background = new PIXI.Graphics();
		this.background.name = 'Background';
		this.background.zIndex = -1;
		this.background.interactive = true;
		this.background.beginFill(this.editor.resourceManager.theme.color.background, 1);
		this.background.drawRect(0, 0, this.editor.const.width, this.editor.const.height);
		this.background.endFill();
		this.app.stage.addChild(this.background);
	}

	private renderSelectionBox() {
		const box = this.editor.selectionManager.selectionBox;
		if (box[0] === box[2] || box[1] === box[3]) return;
		const selectionBox = new PIXI.Graphics();
		selectionBox.beginFill(this.editor.resourceManager.theme.color.selectionBox, this.editor.resourceManager.theme.color.selectionBoxAlpha);
		selectionBox.lineStyle(this.editor.const.lineWidth, this.editor.resourceManager.theme.color.selectionBox);
		// TODO max width and max height out of box
		const y = this.editor.calculator.getYInCanvas(box[1]);
		const height = this.editor.calculator.getYInCanvas(box[3]) - y;
		selectionBox.drawRect(box[0], y, box[2] - box[0], height);
		selectionBox.endFill();
		this.containers.selection.addChild(selectionBox);
	}

	private renderSelectionRect(name: string, x: number, y: number, width: number, height: number, color: number = this.editor.resourceManager.theme.color.selectionRect) {
		const rect = new PIXI.Graphics();
		rect.name = name;
		rect.lineStyle(this.editor.const.lineWidth * 4, color);
		rect.drawRect(x, y, width, height);
		this.containers.selection.addChild(rect);
	}

	private renderLanes(): void {
		for (let i = 0; i < this.renderObjects.lanes.length; i++) {
			const object = this.renderObjects.lanes[i];
			const line = new PIXI.Graphics();
			line.name = object.name;
			line.lineStyle(this.editor.const.lineWidth, object.color, object.alpha);
			line.moveTo(0, 0);
			line.lineTo(0, this.editor.const.height);
			line.x = object.x;
			this.containers.lane.addChild(line);
		}
	}

	private renderBeatLines(): void {
		const lines = this.renderObjects.beatLines.filter(
			v => v.scrollHeight >= this.editor.scrollController.scrollBottom - this.editor.const.noteHeight &&
				v.scrollHeight <= this.editor.scrollController.scrollBottom + this.editor.const.height + this.editor.const.noteHeight
		);
		for (let i = 0; i < lines.length; i++) {
			const object = lines[i];
			const line = new PIXI.Graphics();
			line.name = object.name;
			line.lineStyle(this.editor.const.lineWidth, object.color, object.alpha);
			line.moveTo(object.x, 0);
			line.lineTo(object.x + object.width, 0);
			line.y = this.editor.calculator.getYInCanvas(object.scrollHeight);
			this.containers.time.addChild(line);
		}
	}

	private renderCurrentTimeLine(): void {
		this.currentTimeLine = new PIXI.Graphics();
		this.currentTimeLine.name = 'CurrentTime-line';
		this.currentTimeLine.lineStyle(this.editor.const.lineWidth, this.editor.resourceManager.theme.color.currentTimeLine, 1);
		this.currentTimeLine.moveTo(0, 0);
		this.currentTimeLine.lineTo(this.editor.const.width * 0.8, 0);
		this.currentTimeLine.x = this.editor.const.width * 0.1;
		this.currentTimeLine.y = this.editor.calculator.getYInCanvas(0);
		this.currentTimeLine.zIndex = 5;
		this.app.stage.addChild(this.currentTimeLine);
	}

	private renderTexts(): void {
		const texts = this.renderObjects.texts.filter(
			v => v.scrollHeight >= this.editor.scrollController.scrollBottom &&
				v.scrollHeight <= this.editor.scrollController.scrollBottom + this.editor.const.height + this.editor.const.fontSize
		);
		for (let i = 0; i < texts.length; i++) {
			const object = texts[i];
			const text = new PIXI.Text(object.text, {
				fontSize: object.fontSize,
				fill: object.color
			});
			text.name = object.name;
			text.x = object.x - { left: 0, center: 0.5, right: 1 }[object.alignX || 'left'] * text.width;
			text.y = this.editor.calculator.getYInCanvas(object.scrollHeight) - {
				top: 0,
				middle: 0.5,
				bottom: 1
			}[object.alignY || 'bottom'] * text.height;
			this.containers.time.addChild(text);
		}
	}

	private renderNotes(): void {
		const notes = this.renderObjects.notes.filter(
			v => v.scrollHeight >= this.editor.scrollController.scrollBottom - this.editor.const.noteHeight &&
				v.scrollHeight <= this.editor.scrollController.scrollBottom + this.editor.const.height + this.editor.const.noteHeight
		);
		for (let i = 0; i < notes.length; i++) {
			const object = notes[i];
			const note = object.slideId === undefined
				? new SingleNote(this.editor.resourceManager.textures[object.texture], object.id)
				: new SlideNote(this.editor.resourceManager.textures[object.texture], object.id, object.slideId);
			note.name = object.name;
			const scale = this.editor.const.noteHeight / note.height;
			note.scale.set(scale);
			note.x = object.x;
			note.y = this.editor.calculator.getYInCanvas(object.scrollHeight) - this.editor.const.noteHeight / 2;
			note.width = object.width / scale;
			note.alpha = object.alpha;
			// note.on('click', slide === undefined ? this.singleClickHandler.bind(this) : this.slideClickHandler.bind(this));
			// overlapped note
			if (notes.some(v => v.id !== object.id && v.id !== 'CursorNote' && object.id !== 'CursorNote' &&
				v.rawLane <= object.rawLane && v.rawWidth >= object.rawWidth && v.rawLane + v.rawWidth >= object.rawLane + object.rawWidth &&
				v.scrollHeight === object.scrollHeight)) {
				this.renderSelectionRect(`WarningRect-${ object.id }`, note.x, note.y, object.width, this.editor.const.noteHeight, this.editor.resourceManager.theme.color.warningRect);
			}
			// selection
			if ((this.editor.selectionManager.selection.single.includes(object.id) ||
				this.editor.selectionManager.tempSelection.single.includes(object.id) ||
				this.editor.selectionManager.selection.slide[object.slideId]?.includes(object.id) ||
				this.editor.selectionManager.tempSelection.slide[object.slideId]?.includes(object.id))) {
				this.renderSelectionRect(`SelectionRect-${ object.id }`, note.x, note.y, object.width, this.editor.const.noteHeight);
			}
			this.containers.note.addChild(note);
		}
	}

	private renderArrows(): void {
		const arrows = this.renderObjects.arrows.filter(
			v => v.scrollHeight >= this.editor.scrollController.scrollBottom - this.editor.const.arrowHeight &&
				v.scrollHeight <= this.editor.scrollController.scrollBottom + this.editor.const.height + this.editor.const.arrowHeight
		);
		for (let i = 0; i < arrows.length; i++) {
			const object = arrows[i];
			const arrow = new PIXI.Sprite(this.editor.resourceManager.textures[object.texture]);
			arrow.name = object.name;
			const scale = object.width / arrow.width;
			const arrowHeight = arrow.height * scale;
			arrow.alpha = object.alpha;
			arrow.scale.set(scale);
			arrow.x = object.x;
			arrow.y = this.editor.calculator.getYInCanvas(object.scrollHeight) - arrowHeight;
			this.containers.arrow.addChild(arrow);
		}
	}

	private renderCurves(): void {
		const curves = this.renderObjects.curves.filter(
			v => v.startScrollHeight <= this.editor.scrollController.scrollBottom + this.editor.const.height
				&& v.endScrollHeight >= this.editor.scrollController.scrollBottom
		);
		for (let i = 0; i < curves.length; i++) {
			const object = curves[i];
			if (object.points.length < 2) continue;
			const curve = new PIXI.Graphics();
			curve.name = object.name;
			curve.beginFill(object.color, object.alpha);
			curve.moveTo(object.points[0].x, this.editor.calculator.getYInCanvas(object.points[0].scrollHeight));
			for (let j = 1; j < object.points.length; j++) {
				curve.lineTo(object.points[j].x, this.editor.calculator.getYInCanvas(object.points[j].scrollHeight));
			}
			curve.endFill();
			this.containers.slide.addChild(curve);
		}
	}

	private renderVisibleNodes(): void {
		const nodes = this.renderObjects.visibleNodes.filter(
			v => v.scrollHeight >= this.editor.scrollController.scrollBottom - this.editor.const.noteHeight &&
				v.scrollHeight <= this.editor.scrollController.scrollBottom + this.editor.const.height + this.editor.const.noteHeight
		);
		for (let i = 0; i < nodes.length; i++) {
			const object = nodes[i];
			const sprite = new SlideVisibleNote(this.editor.resourceManager.textures[object.texture], object.id, object.slideId);
			sprite.alpha = object.alpha;
			sprite.name = object.name;
			const scale = this.editor.const.noteHeight / sprite.height;
			sprite.scale.set(scale);
			sprite.x = object.x + (object.width - sprite.width) / 2;
			sprite.y = this.editor.calculator.getYInCanvas(object.scrollHeight) - (sprite.height / 2);
			// sprite.on('click', this.slideClickHandler.bind(this));
			this.containers.slide.addChild(sprite);
			if (this.editor.selectionManager.selection.slide[object.slideId]?.includes(object.id) ||
				this.editor.selectionManager.tempSelection.slide[object.slideId]?.includes(object.id)) {
				const padding = this.editor.calculator.getLaneWidth(0.1);
				this.renderSelectionRect(`SelectionRect-${ object.id }`, object.x - padding, sprite.y, object.width + padding * 2, this.editor.const.noteHeight);
			}
		}

	}

	private renderInvisibleNodes(): void {
		const nodes = this.renderObjects.invisibleNodes.filter(
			v => v.scrollHeight >= this.editor.scrollController.scrollBottom - this.editor.const.noteHeight &&
				v.scrollHeight <= this.editor.scrollController.scrollBottom + this.editor.const.height + this.editor.const.noteHeight
		);
		for (let i = 0; i < nodes.length; i++) {
			const object = nodes[i];
			const line = new PIXI.Graphics();
			line.name = object.name;
			line.lineStyle(this.editor.const.invisibleLineWidth, object.color, 1);
			line.alpha = object.alpha;
			line.moveTo(object.x, 0);
			line.lineTo(object.x + object.width, 0);
			line.y = this.editor.calculator.getYInCanvas(object.scrollHeight);
			// TODO select invisible note when clicking
			// line.interactive = true;
			// line.on('click', this.slideClickHandler.bind(this));
			this.containers.slide.addChild(line);
			if (this.editor.selectionManager.selection.slide[object.slideId]?.includes(object.id) ||
				this.editor.selectionManager.tempSelection.slide[object.slideId]?.includes(object.id)) {
				const height = this.editor.const.noteHeight;
				const padding = this.editor.calculator.getLaneWidth(0.2);
				this.renderSelectionRect(`SelectionRect-${ object.id }`, object.x - padding, line.y - height / 2, object.width + padding * 2, height);
			}
		}
	}

	updateCursorPosition(beat: Fraction, lane: number): void {
		const height = this.editor.calculator.getHeightByBeat(beat, this.editor.timeLineManager.prime);
		if (height > this.editor.const.maxHeight - this.editor.const.spaceY || lane < 0 || lane > 11) {
			this.cursor.visible = false;
			return;
		}
		this.cursor.x = this.editor.calculator.getLaneX(lane - 0.1);
		this.cursor.y = this.editor.calculator.getYInCanvas(height);
		this.cursor.visible = true;
	}

	updateCurrentTimeLine(): void {
		if (!this.currentTimeLine) return;
		const height = this.editor.calculator.getHeightByTime(this.editor.audioManager.currentTime);
		const visible = height >= this.editor.scrollController.scrollBottom && height <= this.editor.scrollController.scrollBottom + this.editor.const.height;
		this.currentTimeLine.visible = visible;
		if (visible) {
			this.currentTimeLine.y = this.editor.calculator.getYInCanvas(height);
		}
	}

	initContainers(): void {
		this.containers.time = new PIXI.Container();
		this.containers.note = new PIXI.Container();
		this.containers.slide = new PIXI.Container();
		this.containers.arrow = new PIXI.Container();
		this.containers.selection = new PIXI.Container();
		this.containers.time.name = 'Time';
		this.containers.note.name = 'Note';
		this.containers.slide.name = 'Slide';
		this.containers.arrow.name = 'Arrow';
		this.containers.selection.name = 'Selection';
		this.containers.time.zIndex = 1;
		this.containers.arrow.zIndex = 2;
		this.containers.slide.zIndex = 3;
		this.containers.note.zIndex = 4;
		this.containers.selection.zIndex = 6;
		this.app.stage.addChild(this.containers.time);
		this.app.stage.addChild(this.containers.note);
		this.app.stage.addChild(this.containers.slide);
		this.app.stage.addChild(this.containers.arrow);
		this.app.stage.addChild(this.containers.selection);
	}

	destroyContainers(): void {
		['time', 'note', 'slide', 'arrow', 'selection'].forEach(name => {
			(this.containers[name] as PIXI.Container).destroy({
				children: true
			});
		});
	}

	get renderObjects(): IRenderObjects {
		return this.editor.parser.renderObjects;
	}
}

