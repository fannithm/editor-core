import { IMap } from '@fannithm/const/dist/pjsk';
import { Fraction } from '@fannithm/utils';
import { Editor } from './Editor';

export class Calculator {
	constructor(private editor: Editor) {
	}

	getTimeByBeat(beat: Fraction): number {
		let time = 0;
		const bpms = this.map.bpms.filter(v => v.timeline === this.editor.timeLineManager.prime);
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

	getHeightByBeat(beat: Fraction): number {
		return this.editor.const.spaceY + this.getTimeByBeat(beat) * this.editor.const.heightPerSecond;
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

	private get map(): IMap {
		return this.editor.map;
	}
}
