import Editor from "./Editor";
import PIXI from 'pixi.js';
import { IRenderObjects } from ".";
import Parser from "./Parser";

export default class Renderer {
	private containers: {
		lane: PIXI.Container;
		time: PIXI.Container;
		note: PIXI.Container;
		slide: PIXI.Container;
		arrow: PIXI.Container;
		selection: PIXI.Container;
	};
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
		this.initContainers();
		this.initLaneContainer();
	}

	initLaneContainer(): void {
		this.containers.lane = new PIXI.Container();
		this.containers.lane.name = 'Lane';
		this.app.stage.addChild(this.containers.lane);
	}

	render(): void {
		this.destroyContainers();
		this.initContainers();
		this.renderBeatLines();
	}

	private renderBeatLines(): void {
		const index = this.parser();
		for (let i = 0; i < this.renderObjects.beatLines.length; i++) {
			const line = new PIXI.Graphics();
			const _beat = this.fractionToDecimal(beat);
			line.name = `Beat-${_beat}-line`;
			line.lineStyle(this.const.lineWidth, color, alpha);
			line.moveTo(this.getLaneX(0), 0);
			line.lineTo(drawText ? this.const.width : this.calculator.getLaneX(12), 0);
			line.y = this.calculator.getYInCanvas(height);
			this.containers.time.addChild(line);
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
		for (const name in this.containers) {
			if (Object.hasOwnProperty.call(this.containers, name)) {
				(this.containers[name] as PIXI.Container).destroy({
					children: true
				});
			}
		}
	}

	// get const(): Constants {
	// 	return this.editor.const;
	// }

	// get calculator(): Calculator {
	// 	return this.editor.calculator;
	// }

	get parser(): Parser {
		return this.editor.parser;
	}

	get renderObjects(): IRenderObjects {
		return this.editor.parser.renderObjects;
	}
}

