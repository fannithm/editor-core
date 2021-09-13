import PIXI from 'pixi.js';
import { Editor } from './Editor';
import { IRenderObjects } from './Parser';

export class Renderer {
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
	}

	renderOnce(): void {
		this.renderLanes();
		this.renderSelectArea();
	}

	renderSelectArea(): void {
		this.selectArea = new PIXI.Graphics();
		this.selectArea.name = 'SelectArea';
		this.selectArea.beginFill(this.editor.color.background, 1);
		this.selectArea.drawRect(0, 0, this.editor.const.width, this.editor.const.height);
		this.selectArea.zIndex = -1;
		this.selectArea.interactive = true;
		this.selectArea.endFill();
		this.app.stage.addChild(this.selectArea);
	}

	renderLanes(): void {
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

	private renderTexts() {
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

