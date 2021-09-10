import { NineSlicePlane, Texture } from "pixi.js";
import { PJSK, UUID } from "@fannithm/const";

export default class SingleNote extends NineSlicePlane {
	public id: UUID;
	constructor(texture: Texture, note: PJSK.INoteTap | PJSK.INoteFlick) {
		super(texture, 91, 0, 91, 0);
		this.interactive = true;
		this.id = note.id;
	}
}
