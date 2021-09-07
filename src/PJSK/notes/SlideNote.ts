import { NineSlicePlane, Texture } from "pixi.js";
import { PJSK, UUID } from "@fannithm/const";

export default class SlideNote extends NineSlicePlane {
	public id: UUID;
	public slideId: UUID;
	constructor(texture: Texture, note: PJSK.INoteSlideNote, slide: PJSK.INoteSlide) {
		super(texture, 91, 0, 91, 0);
		this.interactive = true;
		this.id = note.id;
		this.slideId = slide.id;
	}
}
