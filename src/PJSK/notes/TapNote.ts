import { NineSlicePlane, Texture } from 'pixi.js';

export default class SingleNote extends NineSlicePlane {
	constructor(texture: Texture, public id: string) {
		super(texture, 91, 0, 91, 0);
		this.interactive = true;
	}
}
