import convertor from '@fannithm/sus-fannithm-convertor';
import {
	Editor,
	EditorCursorType,
	EventType,
	IResourceLoadErrorEvent,
	IResourceLoadProgressEvent,
	IScrollEvent
} from '../PJSK';
import { CurveType, FlickDirection, IMap } from '@fannithm/const/dist/pjsk';

import './style.css';

(function (window: unknown) {
	function $(s: string) {
		return document.querySelector(s);
	}

	document.addEventListener('DOMContentLoaded', ready);

	async function ready() {
		// initialize editor
		const theme = await (await fetch('pjsk/editor-theme.json')).json();
		const editor = new Editor($('#app') as HTMLDivElement, theme);
		(window as { editor: Editor }).editor = editor;
		const $progress = $('#progress') as HTMLDivElement;
		editor.event.on(EventType.ResourceLoadProgress, ({ loader }: IResourceLoadProgressEvent) => {
			$progress.innerHTML = `Loading ${ loader.progress.toFixed(2) }%`;
		});
		editor.event.on(EventType.ResourceLoadError, ({ error }: IResourceLoadErrorEvent) => {
			console.error('load error:', error);
		});
		await editor.resourceManager.loadResource();
		$progress.style.display = 'none';

		const setMap = (map: IMap) => {
			editor.map = map;
			editor.audioManager.totalTime = 180;
			editor.scrollController.scrollTo(0);
		};
		// load official map
		const $id = $('#id') as HTMLInputElement;
		const $diff = $('#diff') as HTMLSelectElement;

		$('#load').addEventListener('click', async () => {
			const res = await fetch(`https://assets.pjsek.ai/file/pjsekai-assets/startapp/music/music_score/${ $id.value.padStart(4, '0') }_01/${ $diff.value }`);
			const map = convertor(await res.text());
			setMap(map);
		});

		// input sus file
		const $container = $('#container') as HTMLDivElement;
		const $text = $('#text') as HTMLTextAreaElement;

		$('#input').addEventListener('click', () => {
			$container.style.display = $container.style.display === 'none' ? 'block' : 'none';
		});
		$('#draw').addEventListener('click', () => {
			$container.style.display = 'none';
			if (!$text.value) return;
			const map = convertor($text.value);
			setMap(map);
		});

		// zoom in/out
		const scaleEditor = (scale: number) => {
			editor.const.heightPerSecondRaw *= scale;
		};
		$('#add').addEventListener('click', () => {
			scaleEditor(1.5);
		});
		$('#minus').addEventListener('click', () => {
			scaleEditor(1 / 1.5);
		});

		// update scroll bottom input box
		const $bottom = $('#bottom') as HTMLInputElement;
		editor.event.on(EventType.Scroll, (event: IScrollEvent) => {
			$bottom.value = event.newScrollBottom.toString();
		});
		// scroll manually
		$('#scroll').addEventListener('click', () => {
			editor.scrollController.scrollTo(parseInt($bottom.value));
		});

		// change beat slice
		$('#slice').addEventListener('change', function () {
			editor.beatSlice = parseInt(this.value);
		});

		// load audio
		$('#music').addEventListener('input', function () {
			const file = this.files[0];
			editor.audioManager.loadAudio(file);
		});

		// play bgm
		$('#play').addEventListener('click', () => {
			editor.audioManager.play();
		});

		// pause bgm
		$('#pause').addEventListener('click', () => {
			editor.audioManager.pause();
		});

		// stop bgm
		$('#stop').addEventListener('click', () => {
			editor.audioManager.stop();
		});

		// toggle follow
		$('#follow').addEventListener('input', function () {
			editor.audioManager.follow = this.checked;
		});

		// delete note
		$('#delete').addEventListener('click', () => {
			editor.selectionManager.deleteNotesBySelection(editor.selectionManager.selection);
		});

		// import map from local file
		const file = document.createElement('input');
		file.type = 'file';
		file.accept = '.json';
		$('#import').addEventListener('click', () => {
			file.click();
		});
		file.addEventListener('change', async () => {
			setMap(JSON.parse(await file.files[0].text()));
		});

		// download map
		$('#export').addEventListener('click', () => {
			const map = JSON.stringify(editor.map);
			const file = new Blob([map], { type: 'application/json' });
			const url = URL.createObjectURL(file);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'map.json';
			a.click();
			URL.revokeObjectURL(url);
		});

		// change note cursor
		const changeNoteType = (type: EditorCursorType) => {
			return () => {
				editor.cursorManager.type = type;
			};
		};

		$('#note-default').addEventListener('click', changeNoteType(EditorCursorType.Default));
		$('#note-tap').addEventListener('click', changeNoteType(EditorCursorType.Tap));
		$('#note-flick').addEventListener('click', changeNoteType(EditorCursorType.Flick));
		$('#note-slide').addEventListener('click', changeNoteType(EditorCursorType.Slide));
		$('#note-bpm').addEventListener('click', changeBPM);

		function changeBPM() {
			const bpm = parseFloat(prompt('Please enter the BPM value:', '120'));
			if (isNaN(bpm) || bpm <= 0) {
				alert('Invalid BPM value!');
				return;
			}
			editor.cursorManager.bpm = bpm;
			editor.cursorManager.type = EditorCursorType.BPM;
		}

		// key bindings
		document.addEventListener('keydown', event => {
			switch (event.key) {
				case '1':
					editor.cursorManager.type = EditorCursorType.Default;
					break;
				case '2':
					editor.cursorManager.type = EditorCursorType.Tap;
					break;
				case '3':
					editor.cursorManager.type = EditorCursorType.Flick;
					break;
				case '4':
					editor.cursorManager.type = EditorCursorType.Slide;
					break;
				case 'b':
					changeBPM();
					break;
				case 'q':
					editor.cursorManager.width--;
					break;
				case 'e':
					editor.cursorManager.width++;
					break;
				case 'c':
					editor.cursorManager.critical = !editor.cursorManager.critical;
					break;
				case 'r':
					if (editor.cursorManager.type === EditorCursorType.Flick ||
						(editor.cursorManager.type === EditorCursorType.Slide && editor.cursorManager.slideHeadPlaced && editor.cursorManager.flickEnd)) {
						editor.cursorManager.direction = {
							[FlickDirection.Up]: FlickDirection.Right,
							[FlickDirection.Right]: FlickDirection.Left,
							[FlickDirection.Left]: FlickDirection.Up
						}[editor.cursorManager.direction];
					}
					break;
				case 'x':
					if (editor.cursorManager.type === EditorCursorType.SlideNode) {
						editor.cursorManager.nodeVisible = !editor.cursorManager.nodeVisible;
					}
					break;
				case 'v':
					if ((editor.cursorManager.type === EditorCursorType.Slide && editor.cursorManager.slideHeadPlaced) || editor.cursorManager.type === EditorCursorType.SlideNode) {
						editor.cursorManager.curve = {
							[CurveType.Linear]: CurveType.EaseIn,
							[CurveType.EaseIn]: CurveType.EaseOut,
							[CurveType.EaseOut]: CurveType.Linear
						}[editor.cursorManager.curve];
					}
					break;
				case 'f':
					if (editor.cursorManager.type === EditorCursorType.Slide && editor.cursorManager.slideHeadPlaced) {
						editor.cursorManager.flickEnd = !editor.cursorManager.flickEnd;
					}
					break;
				case 'Escape':
					if (editor.cursorManager.type === EditorCursorType.Slide && editor.cursorManager.slideHeadPlaced) {
						editor.cursorManager.endSlidePlacement();
					}
					break;
				case 'Delete':
					editor.selectionManager.deleteNotesBySelection(editor.selectionManager.selection);
					break;
			}
		});

		// load test map
		const res = await fetch('pjsk/test/map/test.json');
		const map = await res.json();
		setMap(map);

		// start editor
		editor.start();
	}
})(window);
