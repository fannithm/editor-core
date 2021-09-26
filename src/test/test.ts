import convertor from '@fannithm/sus-fannithm-convertor';
import { PJSK } from '..';
import './style.css';
import { EventType, IScrollEvent } from '../PJSK';
import { IMap } from '@fannithm/const/dist/pjsk';

(function () {
	document.addEventListener('DOMContentLoaded', ready);

	async function ready() {
		console.log('ready');

		await PJSK.Editor.loadResource((loader, resource) => {
			console.log(`${ loader.progress }% loading: ${ resource.url }`);
		});

		const $app = document.getElementById('app') as HTMLButtonElement;
		const editor = new PJSK.Editor($app);
		console.log(editor);

		const $load = document.getElementById('load') as HTMLButtonElement;
		const $id = document.getElementById('id') as HTMLInputElement;
		const $diff = document.getElementById('diff') as HTMLSelectElement;
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

		const $input = document.getElementById('input') as HTMLButtonElement;
		const $container = document.getElementById('container') as HTMLDivElement;
		const $text = document.getElementById('text') as HTMLTextAreaElement;
		const $draw = document.getElementById('draw') as HTMLButtonElement;

		$input.addEventListener('click', () => {
			$container.style.display = $container.style.display === 'none' ? 'block' : 'none';
		});
		$draw.addEventListener('click', () => {
			$container.style.display = 'none';
			if (!$text.value) return;
			const map = convertor($text.value);
			setMap(map);
		});

		const $add = document.getElementById('add') as HTMLInputElement;
		const $minus = document.getElementById('minus') as HTMLSelectElement;
		const scaleEditor = (scale: number) => {
			editor.const.heightPerSecondRaw *= scale;
		};
		$add.addEventListener('click', () => {
			scaleEditor(1.5);
		});
		$minus.addEventListener('click', () => {
			scaleEditor(1 / 1.5);
		});

		const $bottom = document.getElementById('bottom') as HTMLInputElement;
		const $scroll = document.getElementById('scroll') as HTMLButtonElement;
		editor.event.on(EventType.Scroll, (event: IScrollEvent) => {
			$bottom.value = event.newScrollBottom.toString();
		});
		$scroll.addEventListener('click', () => {
			editor.scrollController.scrollTo(parseInt($bottom.value));
		});

		const $music = document.getElementById('music') as HTMLInputElement;
		const $play = document.getElementById('play') as HTMLButtonElement;
		const $pause = document.getElementById('pause') as HTMLButtonElement;
		const $stop = document.getElementById('stop') as HTMLButtonElement;
		const $follow = document.getElementById('follow') as HTMLInputElement;

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

		const $delete = document.getElementById('delete') as HTMLButtonElement;

		$delete.addEventListener('click', () => {
			editor.selectionManager.deleteNotesBySelection(editor.selectionManager.selection);
		});

		const res = await fetch('map/lzn.json');
		const map = await res.json();
		setMap(map);
	}
})();


