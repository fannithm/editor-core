import { Sprite, Texture } from 'pixi.js';

export default class SlideVisibleNote extends Sprite {
	constructor(texture: Texture, public id: string, public slideId: string) {
		super(texture);
		this.interactive = true;
	}
}
