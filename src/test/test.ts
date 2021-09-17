import convertor from '@fannithm/sus-fannithm-convertor';
import { PJSK } from '..';
import './style.css';
import { EventType } from '../PJSK';
import { ISelectEventDetail } from '../PJSK/old/PJSKEvent';

(function () {
	document.addEventListener('DOMContentLoaded', ready);

	async function ready() {
		console.log('ready');
		const $add = document.getElementById('add') as HTMLInputElement;
		const $minus = document.getElementById('minus') as HTMLSelectElement;
		const $id = document.getElementById('id') as HTMLInputElement;
		const $diff = document.getElementById('diff') as HTMLSelectElement;
		const $load = document.getElementById('load') as HTMLButtonElement;
		const $bottom = document.getElementById('bottom') as HTMLInputElement;
		const $scroll = document.getElementById('scroll') as HTMLButtonElement;
		const $input = document.getElementById('input') as HTMLButtonElement;
		const $container = document.getElementById('container') as HTMLDivElement;
		const $text = document.getElementById('text') as HTMLTextAreaElement;
		const $draw = document.getElementById('draw') as HTMLButtonElement;

		await PJSK.Editor.loadResource((loader, resource) => {
			console.log(`${ loader.progress }% loading: ${ resource.url }`);
		});

		const $app = document.getElementById('app') as HTMLButtonElement;
		const editor = new PJSK.Editor($app);

		$load.addEventListener('click', async () => {
			// const res = await fetch(`https://assets.pjsek.ai/file/pjsekai-assets/startapp/music/music_score/${$id.value.padStart(4, '0')}_01/${$diff.value}`);
			// const map = convertor(await res.text());
			const res = await fetch('map/lzn.json');
			const map = await res.json();
			editor.map = map;
			editor.beatSlice = 1;
			// editor.scrollController.scrollBottom = 31900;
			editor.audioManager.totalTime = 180;
			// const res = await fetch('map/lzn.json');
			// const map = await res.json();
			// mapEditor.event.addEventListener(PJSKEvent.Type.Scroll, (event: PJSKEvent.ScrollEvent) => {
			// 	$bottom.value = event.detail.newScrollBottom.toString();
			// });
			// mapEditor.event.addEventListener(PJSKEvent.Type.Select, (event: PJSKEvent.SelectEvent) => {
			// 	console.log(mapEditor.getNotesBySelection(event.detail.newSelection));
			// });
			editor.scrollController.scrollTo(0);
			console.log(editor);
		});
		$id.value = '135';
		$load.click();
	}
})();


