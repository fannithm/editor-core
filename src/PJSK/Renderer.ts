import PIXI from 'pixi.js';
import { Editor } from './Editor';
import SlideNote from './notes/SlideNote';
import SlideVisibleNote from './notes/SlideVisibleNote';
import SingleNote from './notes/TapNote';
import { IRenderObjects } from './Parser';

export class Renderer {
	private textures: Record<string, PIXI.Texture>;
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
	// private cursor: Cursor

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
		// this.app.stage.addChild(this.editor.container.cursor);
		// this.container.cursor.visible = false;
		// this.container.cursor.zIndex = 15;
		this.app.stage.sortableChildren = true;
		this.app.stage.interactive = true;
		this.containers = {
			lane: null,
			time: null,
			note: null,
			slide: null,
			arrow: null,
			selection: null
		}
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
	}

	renderOnce(): void {
		this.renderLanes();
		this.renderSelectArea();
	}

	private renderSelectArea(): void {
		this.selectArea = new PIXI.Graphics();
		this.selectArea.name = 'SelectArea';
		this.selectArea.beginFill(this.editor.color.background, 1);
		this.selectArea.drawRect(0, 0, this.editor.const.width, this.editor.const.height);
		this.selectArea.zIndex = -1;
		this.selectArea.interactive = true;
		this.selectArea.endFill();
		this.app.stage.addChild(this.selectArea);
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

	private renderTexts(): void {
		const texts = this.renderObjects.texts.filter(
			v => v.scrollHeight >= this.editor.scrollController.scrollBottom &&
				v.scrollHeight <= this.editor.scrollController.scrollBottom + this.editor.const.height + this.editor.const.fontSize
		);
		for (let i = 0; i < texts.length; i++) {
			const object = texts[i];
			const text = new PIXI.Text(object.text, {
				fontSize: object.fontSize,
				fill: object.color,
			});
			text.name = object.name;
			text.x = object.x - { left: 0, center: 0.5, right: 1 }[object.alignX || 'left'] * text.width;
			text.y = this.editor.calculator.getYInCanvas(object.scrollHeight) - { top: 0, middle: 0.5, bottom: 1 }[object.alignY || 'bottom'] * text.height;
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
				start = [object.endX + object.endWidth, this.editor.calculator.getYInCanvas(object.endScrollHeight)]
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

