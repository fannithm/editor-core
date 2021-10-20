import { Editor } from './Editor';
import * as PIXI from 'pixi.js';
import { EventType } from './EventEmitter';

export class ResourceManager {
	public theme: IEditorTheme;
	public textures: Record<string, PIXI.Texture>;
	public loader = new PIXI.Loader();

	constructor(private editor: Editor, theme: IEditorTheme) {
		this.theme = {
			...theme,
			color: Object.assign({}, Editor.DefaultThemeColor, theme.color)
		};
	}

	loadResource(): Promise<void> {
		return new Promise<void>(resolve => {
			this.loader.add(Object.entries(this.theme.image).concat(Object.entries(this.theme.audio)).map(([name, url]) => {
				return { name, url };
			})).load(() => {
				this.textures = this.loader.resources.sprite.textures;
				resolve();
			});

			this.loader.onProgress.add((loader, resource) => {
				this.editor.event.emit(EventType.ResourceLoadProgress, {
					loader,
					resource
				});
			});
			this.loader.onError.add((error, loader, resource) => {
				this.editor.event.emit(EventType.ResourceLoadError, {
					error,
					loader,
					resource
				});
			});
		});
	}
}

export interface IEditorTheme {
	color?: IEditorThemeColor;
	image: IEditorThemeImage;
	audio: IEditorThemeAudio;
}

export interface IEditorThemeColor {
	background: number;
	primeLane: number;
	primeLaneAlpha: number;
	secondaryLane: number;
	secondaryLaneAlpha: number;
	bpmLine: number;
	timeText: number;
	currentTimeLine: number;
	beatLineWhole: number;
	beatLineWholeAlpha: number;
	beatLineHalf: number;
	beatLineHalfAlpha: number;
	beatLineThird: number;
	beatLineThirdAlpha: number;
	beatLineQuarter: number;
	beatLineQuarterAlpha: number;
	slideCurve: number;
	slideCurveAlpha: number;
	slideInvisibleNode: number;
	slideCriticalCurve: number;
	slideCriticalCurveAlpha: number;
	slideCriticalInvisibleNode: number;
	selectionBox: number;
	selectionBoxAlpha: number;
	selectionRect: number;
	warningRect: number;
	cursor: number;
}

export interface IEditorThemeImage {
	sprite: string;
}

export interface IEditorThemeAudio {
	tap: string;
	flick: string;
	slide: string;
	node: string;
	tap_critical: string;
	flick_critical: string;
	slide_critical: string;
	node_critical: string;
}
