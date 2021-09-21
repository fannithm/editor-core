import * as PIXI from 'pixi.js';
import { Editor } from './Editor';

export class AudioManager {
	private _currentTime = 0;
	private _totalTime = 10;
	private _follow = false;
	private audioContext: AudioContext;
	private audioSource: AudioBufferSourceNode;
	private playTicker: PIXI.Ticker;
	private _playing = false;

	constructor(private editor: Editor) {
		this.audioContext = new AudioContext();
	}

	private async getBuffer(url: string): Promise<AudioBuffer> {
		const res = await fetch(url);
		const buffer = await res.arrayBuffer();
		return this.audioContext.decodeAudioData(buffer);
	}

	async loadAudio(): Promise<void> {

	}

	async play(file: File): Promise<void> {
		const buffer = await this.getBuffer(URL.createObjectURL(file));
		this.audioSource = this.audioContext.createBufferSource();
		this.audioSource.buffer = buffer;
		if (this.playing || !this.audioSource) return;
		this.audioSource.connect(this.audioContext.destination);
		this.audioSource.start(this.currentTime);
		this._playing = true;
	}

	pause(): void {
		if (!this.playing || !this.audioSource) return;
		this.currentTime = this.audioContext.currentTime;
		this.audioSource.disconnect(this.audioContext.destination);
		this.audioSource.stop();
		this._playing = false;
	}

	resume(): void {
	}

	public get currentTime(): number {
		return this._currentTime;
	}

	public set currentTime(currentTime: number) {
		// TODO scrollBottom
		this._currentTime = currentTime;
		this.editor.renderer.render();
	}

	public get totalTime(): number {
		return this._totalTime;
	}

	public set totalTime(totalTime: number) {
		this._totalTime = totalTime;
		this.editor.renderer.parseAndRender();
	}

	public get follow(): boolean {
		return this._follow;
	}

	public set follow(value: boolean) {
		this._follow = value;
		this.editor.renderer.render();
	}

	get playing(): boolean {
		return this._playing;
	}
}
