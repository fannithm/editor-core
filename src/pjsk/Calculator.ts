import { PJSK as PJSKConst } from '@fannithm/const';
import { Fraction } from '@fannithm/utils';
import { Editor } from './Editor';
import { v4 } from 'uuid';

export class Calculator {
	constructor(private editor: Editor) {
	}

	getTimeByBeat(beat: Fraction, timeline: string): number {
		let time = 0;
		let bpms = this.map?.bpms.filter(v => v.timeline === timeline);
		if (!bpms || bpms.length === 0) bpms = [{
			beat: [0, 0, 1],
			id: v4(),
			bpm: 120,
			timeline
		}];
		for (let i = 0; i < bpms.length; i++) {
			const bpm = bpms[i];
			const BPMBeat = this.editor.fraction(bpm.beat);
			if (beat.le(BPMBeat)) break;
			const nextBpm = bpms[i + 1];
			const nextBPMBeat = nextBpm ? this.editor.fraction(nextBpm.beat) : null;
			time += (nextBpm
				? (beat.gt(nextBPMBeat)
					? nextBPMBeat.minus(BPMBeat).decimal
					: beat.minus(BPMBeat).decimal)
				: (beat.minus(BPMBeat).decimal)) / bpm.bpm * 60;
		}
		return time;
	}

	getHeightByBeat(beat: Fraction, timeline: string): number {
		return this.editor.const.spaceY + this.getTimeByBeat(beat, timeline) * this.editor.const.heightPerSecond;
	}

	getHeightByTime(time: number): number {
		return this.editor.const.spaceY + time * this.editor.const.heightPerSecond;
	}

	getYInCanvas(height: number): number {
		return this.editor.const.height - (height - this.editor.scrollController.scrollBottom);
	}

	getLaneX(lane: number): number {
		return this.editor.const.width * (lane * 6 + 14) / 100;
	}

	getLaneWidth(lane: number): number {
		return this.editor.const.width * (lane * 6) / 100;
	}

	private get map(): PJSKConst.IMap {
		return this.editor.map;
	}
}
