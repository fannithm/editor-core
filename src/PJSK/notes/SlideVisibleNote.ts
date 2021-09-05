import { Sprite, Texture } from "pixi.js";
import { INoteSlide, INoteSlideVisible } from "@fannithm/const/src/pjsk";
import { UUID } from "@fannithm/const/js/const";

export default class SlideVisibleNote extends Sprite {
	public id: UUID;
	public slideId: UUID;
	constructor(texture: Texture, note: INoteSlideVisible, slide: INoteSlide) {
		super(texture);
		this.interactive = true;
		this.id = note.id;
		this.slideId = slide.id;
	}
}
