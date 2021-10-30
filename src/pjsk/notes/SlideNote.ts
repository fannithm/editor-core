import { NineSlicePlane, Texture } from 'pixi.js';

export default class SlideNote extends NineSlicePlane {
	constructor(texture: Texture, public id: string, public slideId: string) {
		super(texture, 91, 0, 91, 0);
		this.interactive = true;
	}
}
