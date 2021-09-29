import convertor from '@fannithm/sus-fannithm-convertor';
import './style.css';
import { Editor, EditorCursorType, EventType, IScrollEvent } from '../PJSK';
import { IMap } from '@fannithm/const/dist/pjsk';

(function () {
	function $(s: string) {
		return document.querySelector(s);
	}

	document.addEventListener('DOMContentLoaded', ready);

	async function ready() {
		console.log('ready');

		await Editor.loadResource((loader, resource) => {
			console.log(`${ loader.progress }% loading: ${ resource.url }`);
		});

		const editor = new Editor($('#app') as HTMLDivElement);
		console.log(editor);

		const setMap = (map: IMap) => {
			editor.map = map;
			editor.beatSlice = 1;
			editor.audioManager.totalTime = 180;
			editor.scrollController.scrollTo(0);
		};
		const $id = $('#id') as HTMLInputElement;
		const $diff = $('#diff') as HTMLSelectElement;

		$('#load').addEventListener('click', async () => {
			const res = await fetch(`https://assets.pjsek.ai/file/pjsekai-assets/startapp/music/music_score/${ $id.value.padStart(4, '0') }_01/${ $diff.value }`);
			const map = convertor(await res.text());
			setMap(map);
		});

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

		const scaleEditor = (scale: number) => {
			editor.const.heightPerSecondRaw *= scale;
		};
		$('#add').addEventListener('click', () => {
			scaleEditor(1.5);
		});
		$('#minus').addEventListener('click', () => {
			scaleEditor(1 / 1.5);
		});

		const $bottom = $('#bottom') as HTMLInputElement;
		editor.event.on(EventType.Scroll, (event: IScrollEvent) => {
			$bottom.value = event.newScrollBottom.toString();
		});
		$('#scroll').addEventListener('click', () => {
			editor.scrollController.scrollTo(parseInt($bottom.value));
		});

		$('#slice').addEventListener('change', function () {
			editor.beatSlice = parseInt(this.value);
		});

		$('#music').addEventListener('input', function () {
			const file = this.files[0];
			editor.audioManager.loadAudio(file);
		});

		$('#play').addEventListener('click', () => {
			editor.audioManager.play();
		});

		$('#pause').addEventListener('click', () => {
			editor.audioManager.pause();
		});

		$('#stop').addEventListener('click', () => {
			editor.audioManager.stop();
		});

		$('#follow').addEventListener('input', function () {
			editor.audioManager.follow = this.checked;
		});

		$('#delete').addEventListener('click', () => {
			console.log(editor.selectionManager.getNotesBySelection(editor.selectionManager.selection));
		});

		const changeNoteType = (type: EditorCursorType) => {
			return () => {
				editor.cursorManager.type = type;
			};
		};

		$('#note-default').addEventListener('click', changeNoteType(EditorCursorType.Default));
		$('#note-tap').addEventListener('click', changeNoteType(EditorCursorType.Tap));
		$('#note-flick').addEventListener('click', changeNoteType(EditorCursorType.Flick));
		$('#note-slide').addEventListener('click', changeNoteType(EditorCursorType.Slide));
		$('#note-bpm').addEventListener('click', changeNoteType(EditorCursorType.BPM));

		document.addEventListener('keydown', event => {
			console.log(event.key);
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
				case 'q':
					editor.cursorManager.width--;
					break;
				case 'e':
					editor.cursorManager.width++;
					break;
				case 'c':
					editor.cursorManager.critical = !editor.cursorManager.critical;
					break;
				case 'Delete':
					break;
			}
		});

		const res = await fetch('map/lzn.json');
		const map = await res.json();
		setMap(map);
	}
})();
