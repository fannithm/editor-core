import * as PIXI from 'pixi.js';
import { IMap, MapBeat } from '@fannithm/const/dist/pjsk';
import { Fraction } from '@fannithm/utils';
import { EventHandler } from './EventHandler';
import { AudioManager } from './AudioManager';
import { Calculator } from './Calculator';
import { Constants } from './Constants';
import { EventEmitter } from './EventEmitter';
import { Parser } from './Parser';
import { Renderer } from './Renderer';
import { ScrollController } from './ScrollController';
import { TimeLineManager } from './TimeLineManager';
import { SelectionManager } from './SelectionManager';
import { CursorManager } from './CursorManager';
import { IEditorTheme, ResourceManager } from './ResourceManager';

/**
 * ## Usage
 * ### Load resource first
 * See {@link Editor.loadResource}
 * ```js
 * await PJSK.Editor.loadResource((loader, resource) => {
 * 	console.log(`${loader.progress}% loading: ${resource.url}`);
 * });
 * ```
 * ### Initialize
 * See {@link Editor.constructor}
 * ```js
 * const editor = new PJSK.Editor.loadResource(document.getElementById("container"), map, time);
 * editor.map = map;
 * editor.time = time;
 * ```
 */
export class Editor {
	private _map: IMap;
	private _beatSlice = 1;
	public event: EventEmitter;
	public handler: EventHandler;
	public const: Constants;
	public renderer: Renderer;
	public parser: Parser;
	public calculator: Calculator;
	public scrollController: ScrollController;
	public audioManager: AudioManager;
	public timeLineManager: TimeLineManager;
	public selectionManager: SelectionManager;
	public cursorManager: CursorManager;
	public resourceManager: ResourceManager;

	/**
	 * @param container Editor container for containing canvas element.
	 * @param theme Editor theme config
	 */
	constructor(public container: HTMLElement, theme: IEditorTheme) {
		this.resourceManager = new ResourceManager(this, theme);
		this.const = new Constants(this);
		this.event = new EventEmitter(this);
		this.handler = new EventHandler(this);
		this.parser = new Parser(this);
		this.calculator = new Calculator(this);
		this.scrollController = new ScrollController(this);
		this.audioManager = new AudioManager(this);
		this.renderer = new Renderer(this);
		this.timeLineManager = new TimeLineManager();
		this.selectionManager = new SelectionManager(this);
		this.cursorManager = new CursorManager(this);
	}

	start(): void {
		this.handler.listen();
		this.renderer.parseAndRender();
		this.renderer.renderOnce();
	}

	destroy(): void {
		this.event.dispatchDestroyEvent();
		this.renderer.destroyContainers();
		this.renderer.app.destroy(true, {
			children: true,
			texture: true,
			baseTexture: true
		});
		this.audioManager.destroy();
	}

	set map(map: IMap) {
		this._map = map;
		if (!this.timeLineManager.visible.some(v => this.map.timelines.map(t => t.id).includes(v))) {
			this.timeLineManager.visible = [this.map.timelines[0].id];
		}
		this.renderer.parseAndRender();
	}

	get map(): IMap {
		return this._map;
	}

	set beatSlice(slice: number) {
		this._beatSlice = slice;
		this.renderer.parseAndRender();
	}

	get beatSlice(): number {
		return this._beatSlice;
	}

	fraction(beat: MapBeat): Fraction {
		return new Fraction([1, ...beat]);
	}
}
