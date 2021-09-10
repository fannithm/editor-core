import { Sprite, Texture } from "pixi.js";
import { PJSK, UUID } from "@fannithm/const";

export default class SlideVisibleNote extends Sprite {
	public id: UUID;
	public slideId: UUID;
	constructor(texture: Texture, note: PJSK.INoteSlideVisible, slide: PJSK.INoteSlide) {
		super(texture);
		this.interactive = true;
		this.id = note.id;
		this.slideId = slide.id;
	}
}
