import * as PIXI from 'pixi.js';
import { Editor } from './Editor';

export class AudioManager {
	private _totalTime = 10;
	private _follow = false;
	private audio: HTMLAudioElement;
	private audioContext: AudioContext;
	private audioSource: MediaElementAudioSourceNode;
	playTicker: PIXI.Ticker;
	private _playing = false;

	constructor(private editor: Editor) {
		this.playTicker = new PIXI.Ticker();
		this.playTicker.autoStart = false;
	}

	private async getBuffer(url: string): Promise<AudioBuffer> {
		const res = await fetch(url);
		const buffer = await res.arrayBuffer();
		return this.audioContext.decodeAudioData(buffer);
	}

	loadAudio(file: File): void {
		this.audio = new Audio();
		this.audioContext = new AudioContext();
		this.audio.addEventListener('loadeddata', () => {
			this.editor.renderer.parseAndRender();
		});
		this.audio.addEventListener('ended', () => {
			this._playing = false;
		});
		this.audio.src = URL.createObjectURL(file);
		this.audioSource = this.audioContext.createMediaElementSource(this.audio);
		this.audioSource.connect(this.audioContext.destination);
	}

	async play(): Promise<void> {
		if (!this.audio || this.playing) return;
		await this.audio.play();
		this._playing = true;
		this.playTicker.start();
	}

	stop(): void {
		this.pause();
		this.currentTime = 0;
		this.editor.renderer.updateCurrentTimeLine();
	}

	pause(): void {
		if (!this.playing || !this.audioSource) return;
		this.audio.pause();
		this._playing = false;
		this.playTicker.stop();
	}

	destroy(): void {
		this.stop();
	}

	public get currentTime(): number {
		return this.audio?.currentTime || 0;
	}

	public set currentTime(time: number) {
		if (this.audio) this.audio.currentTime = time;
	}

	public get totalTime(): number {
		return this.audio?.duration || this._totalTime;
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
