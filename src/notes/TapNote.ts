import { NineSlicePlane, Texture } from "pixi.js";
import { INoteTap, INoteFlick } from "@fannithm/const/src/pjsk";
import { UUID } from "@fannithm/const/js/const";

export default class SingleNote extends NineSlicePlane {
	public id: UUID;
	constructor(texture: Texture, note: INoteTap | INoteFlick) {
		super(texture, 91, 0, 91, 0);
		this.interactive = true;
		this.id = note.id;
	}
}
