import * as PIXI from 'pixi.js';
import { Editor } from './Editor';
import SlideNote from './notes/SlideNote';
import SlideVisibleNote from './notes/SlideVisibleNote';
import SingleNote from './notes/TapNote';
import { IRenderObjects } from './Parser';
import Cursor from './notes/Cursor';
import { Fraction } from '@fannithm/utils';

export class Renderer {
	private readonly textures: Record<string, PIXI.Texture>;
	private containers: {
		lane: PIXI.Container;
		time: PIXI.Container;
		note: PIXI.Container;
		slide: PIXI.Container;
		arrow: PIXI.Container;
		selection: PIXI.Container;
	};
	public selectArea: PIXI.Graphics;
	public app: PIXI.Application;
	private readonly cursor: Cursor;

	constructor(private editor: Editor) {
		this.textures = PIXI.Loader.shared.resources['images/sprite.json'].textures;
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
		this.cursor = new Cursor(this.editor.const.cursorLineWidth, this.editor.calculator.getLaneWidth(1.2), this.editor.color.cursor);
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
		this.renderSelectArea();
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
		this.renderCurrentTimeLine();
		this.renderTexts();
		this.renderNotes();
		this.renderArrows();
		this.renderCurves();
		this.renderVisibleNodes();
		this.renderInvisibleNodes();
		this.renderSelectionBox();
	}

	renderOnce(): void {
		this.renderLanes();
	}

	private renderSelectArea(): void {
		// select area
		this.selectArea = new PIXI.Graphics();
		this.selectArea.name = 'SelectArea';
		this.selectArea.zIndex = 0;
		this.selectArea.interactive = true;
		this.selectArea.beginFill(this.editor.color.background, 1);
		this.selectArea.drawRect(0, 0, this.editor.const.width, this.editor.const.height);
		this.selectArea.endFill();
		this.app.stage.addChild(this.selectArea);
	}

	private renderSelectionBox() {
		const box = this.editor.selectionManager.selectionBox;
		if (box[0] === box[2] || box[1] === box[3]) return;
		const selectionBox = new PIXI.Graphics();
		selectionBox.beginFill(this.editor.color.selectionBox, this.editor.color.selectionBoxAlpha);
		selectionBox.lineStyle(this.editor.const.lineWidth, this.editor.color.selectionBox);
		// TODO max width and max height out of box
		const y = this.editor.calculator.getYInCanvas(box[1]);
		const height = this.editor.calculator.getYInCanvas(box[3]) - y;
		selectionBox.drawRect(box[0], y, box[2] - box[0], height);
		selectionBox.endFill();
		this.containers.selection.addChild(selectionBox);
	}

	private renderSelectionRect(name: string, x: number, y: number, width: number, height: number) {
		const rect = new PIXI.Graphics();
		rect.name = name;
		rect.lineStyle(this.editor.const.lineWidth * 4, this.editor.color.selectionRect);
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
		const height = this.editor.calculator.getHeightByTime(this.editor.audioManager.currentTime);
		if (height >= this.editor.scrollController.scrollBottom && height <= this.editor.scrollController.scrollBottom + this.editor.const.height) {
			const line = new PIXI.Graphics();
			line.name = 'Time-line';
			line.lineStyle(this.editor.const.lineWidth, this.editor.color.currentTimeLine, 1);
			line.moveTo(0, 0);
			line.lineTo(this.editor.const.width * 0.8, 0);
			line.x = this.editor.const.width * 0.1;
			line.y = this.editor.calculator.getYInCanvas(height);
			this.containers.time.addChild(line);
		}
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
				? new SingleNote(this.textures[object.texture], object.id)
				: new SlideNote(this.textures[object.texture], object.id, object.slideId);
			note.name = object.name;
			const scale = this.editor.const.noteHeight / note.height;
			note.scale.set(scale);
			note.x = object.x;
			note.y = this.editor.calculator.getYInCanvas(object.scrollHeight) - this.editor.const.noteHeight / 2;
			note.width = object.width / scale;
			// note.on('click', slide === undefined ? this.singleClickHandler.bind(this) : this.slideClickHandler.bind(this));
			// selection
			if (this.editor.selectionManager.selection.single.includes(note.id) ||
				this.editor.selectionManager.tempSelection.single.includes(note.id) ||
				this.editor.selectionManager.selection.slide[object.slideId]?.includes(object.id) ||
				this.editor.selectionManager.tempSelection.slide[object.slideId]?.includes(object.id)) {
				this.renderSelectionRect(`SelectionRect-${ note.id }`, note.x, note.y, object.width, this.editor.const.noteHeight);
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
			const arrow = new PIXI.Sprite(this.textures[object.texture]);
			arrow.name = object.name;
			const scale = object.width / arrow.width;
			const arrowHeight = arrow.height * scale;
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
			const curve = new PIXI.Graphics();
			curve.name = object.name;
			if (object.bezier) {
				let start = [object.startX, this.editor.calculator.getYInCanvas(object.startScrollHeight)];
				let end = [object.endX, this.editor.calculator.getYInCanvas(object.endScrollHeight)];
				curve.beginFill(object.color, object.alpha);
				curve.moveTo(start[0], start[1]);
				curve.bezierCurveTo(
					start[0] + object.bezier[0] * (end[0] - start[0]),
					start[1] + object.bezier[1] * (end[1] - start[1]),
					start[0] + object.bezier[2] * (end[0] - start[0]),
					start[1] + object.bezier[3] * (end[1] - start[1]),
					end[0],
					end[1]
				);
				curve.lineTo(object.endX + object.endWidth, this.editor.calculator.getYInCanvas(object.endScrollHeight));
				start = [object.endX + object.endWidth, this.editor.calculator.getYInCanvas(object.endScrollHeight)];
				end = [object.startX + object.startWidth, this.editor.calculator.getYInCanvas(object.startScrollHeight)];
				const [x1, y1, x2, y2] = object.bezier;
				const bezier = [1 - x2, 1 - y2, 1 - x1, 1 - y1];
				curve.bezierCurveTo(
					start[0] + bezier[0] * (end[0] - start[0]),
					start[1] + bezier[1] * (end[1] - start[1]),
					start[0] + bezier[2] * (end[0] - start[0]),
					start[1] + bezier[3] * (end[1] - start[1]),
					end[0],
					end[1]
				);
				curve.endFill();
			} else {
				//
			}
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
			const sprite = new SlideVisibleNote(this.textures[object.texture], object.id, object.slideId);
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
		this.containers.selection.zIndex = 5;
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

