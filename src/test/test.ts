import convertor from '@fannithm/sus-fannithm-convertor';
import './style.css';
import { Editor, EventType, EditorCursorType, IScrollEvent } from '../PJSK';
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

		const $app = $('#app') as HTMLButtonElement;
		const editor = new Editor($app);
		console.log(editor);

		const $load = $('#load') as HTMLButtonElement;
		const $id = $('#id') as HTMLInputElement;
		const $diff = $('#diff') as HTMLSelectElement;
		const setMap = (map: IMap) => {
			editor.map = map;
			editor.beatSlice = 1;
			editor.audioManager.totalTime = 180;
			editor.scrollController.scrollTo(0);
		};
		$load.addEventListener('click', async () => {
			const res = await fetch(`https://assets.pjsek.ai/file/pjsekai-assets/startapp/music/music_score/${ $id.value.padStart(4, '0') }_01/${ $diff.value }`);
			const map = convertor(await res.text());
			setMap(map);
		});

		const $input = $('#input') as HTMLButtonElement;
		const $container = $('#container') as HTMLDivElement;
		const $text = $('#text') as HTMLTextAreaElement;
		const $draw = $('#draw') as HTMLButtonElement;

		$input.addEventListener('click', () => {
			$container.style.display = $container.style.display === 'none' ? 'block' : 'none';
		});
		$draw.addEventListener('click', () => {
			$container.style.display = 'none';
			if (!$text.value) return;
			const map = convertor($text.value);
			setMap(map);
		});

		const $add = $('#add') as HTMLInputElement;
		const $minus = $('#minus') as HTMLSelectElement;
		const scaleEditor = (scale: number) => {
			editor.const.heightPerSecondRaw *= scale;
		};
		$add.addEventListener('click', () => {
			scaleEditor(1.5);
		});
		$minus.addEventListener('click', () => {
			scaleEditor(1 / 1.5);
		});

		const $bottom = $('#bottom') as HTMLInputElement;
		const $scroll = $('#scroll') as HTMLButtonElement;
		editor.event.on(EventType.Scroll, (event: IScrollEvent) => {
			$bottom.value = event.newScrollBottom.toString();
		});
		$scroll.addEventListener('click', () => {
			editor.scrollController.scrollTo(parseInt($bottom.value));
		});

		const $slice = $('#slice') as HTMLSelectElement;
		$slice.addEventListener('change', () => {
			editor.beatSlice = parseInt($slice.value);
		});

		const $music = $('#music') as HTMLInputElement;
		const $play = $('#play') as HTMLButtonElement;
		const $pause = $('#pause') as HTMLButtonElement;
		const $stop = $('#stop') as HTMLButtonElement;
		const $follow = $('#follow') as HTMLInputElement;

		$music.addEventListener('input', () => {
			const file = $music.files[0];
			editor.audioManager.loadAudio(file);
		});

		$play.addEventListener('click', () => {
			editor.audioManager.play();
		});

		$pause.addEventListener('click', () => {
			editor.audioManager.pause();
		});

		$stop.addEventListener('click', () => {
			editor.audioManager.stop();
		});

		$follow.addEventListener('input', () => {
			editor.audioManager.follow = $follow.checked;
		});

		const $delete = $('#delete') as HTMLButtonElement;

		$delete.addEventListener('click', () => {
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

		const res = await fetch('map/lzn.json');
		const map = await res.json();
		setMap(map);
	}
})();

