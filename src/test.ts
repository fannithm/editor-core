import { PJSKMapEditor } from ".";
import convertor from '@fannithm/sus-fannithm-convertor';
import './style.css';

(function () {
	document.addEventListener('DOMContentLoaded', ready);
	let mapEditor = null as null | PJSKMapEditor;
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

		function setHeightPerSecond(action: string) {
			if (mapEditor === null) return;
			const height = mapEditor.getHeightPerSecond();
			mapEditor.setHeightPerSecond(action === '+' ? height * 1.2 : height / 1.2);
		}

		$add.addEventListener('click', () => {
			setHeightPerSecond('+')
		});
		$minus.addEventListener('click', () => {
			setHeightPerSecond('-')
		});
		$input.addEventListener('click', () => {
			$container.style.display = $container.style.display === 'none' ? 'block' : 'none';
		});
		$draw.addEventListener('click', () => {
			$container.style.display = 'none';
			const map = convertor($text.value);
			if (mapEditor !== null) {
				mapEditor.destroy();
				mapEditor = null;
			}
			mapEditor = new PJSKMapEditor(document.getElementById('app'), map, 180);
			mapEditor.event.addEventListener('scroll', (event: CustomEvent) => {
				$bottom.value = event.detail.scrollBottom;
			});
			mapEditor.scrollTo(0);
		});
		await PJSKMapEditor.loadResource((loader, resource) => {
			console.log(`${loader.progress}% loading: ${resource.url}`);
		});
		$scroll.addEventListener('click', () => {
			const bottom = parseInt($bottom.value);
			mapEditor && mapEditor.scrollTo(bottom);
		});
		$load.addEventListener('click', async () => {
			const res = await fetch(`https://assets.pjsek.ai/file/pjsekai-assets/startapp/music/music_score/${$id.value.padStart(4, '0')}_01/${$diff.value}`);
			const map = convertor(await res.text());
			// const res = await fetch('map/test.json');
			// const map = await res.json();
			if (mapEditor !== null) {
				mapEditor.destroy();
				mapEditor = null;
			}
			mapEditor = new PJSKMapEditor(document.getElementById('app'), map, 180);
			mapEditor.event.addEventListener('scroll', (event: CustomEvent) => {
				$bottom.value = event.detail.scrollBottom;
			});
			mapEditor.scrollTo(0);
		});
		$id.value = '135';
		$load.click();
	}
})();


