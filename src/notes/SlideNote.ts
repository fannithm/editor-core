import { NineSlicePlane, Texture } from "pixi.js";
import { INoteSlideNote, INoteSlide } from "@fannithm/const/src/pjsk";
import { UUID } from "@fannithm/const/js/const";

export default class SlideNote extends NineSlicePlane {
	public id: UUID;
	public slideId: UUID;
	constructor(texture: Texture, note: INoteSlideNote, slide: INoteSlide) {
		super(texture, 91, 0, 91, 0);
		this.interactive = true;
		this.id = note.id;
		this.slideId = slide.id;
	}
}
