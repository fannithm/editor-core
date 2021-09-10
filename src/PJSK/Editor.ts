import { IMap, MapBeat } from "@fannithm/const/dist/pjsk";
import { Fraction } from "@fannithm/utils";
import AudioManager from "./AudioManager";
import Calculator from "./Calculator";
import ColorTheme from "./ColorTheme";
import Constants from "./Constants";
import EventEmitter from "./EventEmitter";
import Parser from "./Parser";
import Renderer from "./Renderer";
import ScrollController from "./ScrollController";

export default class Editor {
	private _map: IMap;
	private _beatSlide: number;
	public event: EventEmitter;
	public const: Constants;
	public renderer: Renderer;
	public parser: Parser;
	public calculator: Calculator;
	public scrollController: ScrollController;
	public audioManager: AudioManager;
	public color: ColorTheme;

	constructor(public container: HTMLElement) {
		this.const = new Constants(this);
		this.color = new ColorTheme();
		this.event = new EventEmitter();
		this.parser = new Parser(this);
		this.calculator = new Calculator(this);
		this.scrollController = new ScrollController(this);
		this.audioManager = new AudioManager();
		this.renderer = new Renderer(this);
	}

	destroy(): void {
		this.event.dispatchDestroyEvent();
		this.renderer.destroyContainers();
		this.renderer.app.destroy(true, {
			children: true
		});
	}

	set map(map: IMap) {
		this._map = map;
	}

	get map(): IMap {
		return this._map;
	}

	set beatSlice(slice: number) {
		this.beatSlice = slice;
	}

	get beatSlice(): number {
		return this._beatSlide;
	}

	public fraction(beat: MapBeat): Fraction {
		return new Fraction([1, ...beat]);
	}
}
