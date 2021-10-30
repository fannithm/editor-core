import typescript from '@rollup/plugin-typescript';
import spritesmith from 'rollup-plugin-sprite';
import filesize from 'rollup-plugin-filesize';

export default {
	input: 'src/index.ts',
	output: {
		dir: 'dist',
		entryFileNames: 'core.esm.js',
		format: 'es'
	},
	external: ['pixi.js', '@fannithm/const/dist/pjsk', '@fannithm/utils', 'uuid', 'bezier-easing'],
	plugins: [
		spritesmith({
			src: {
				cwd: 'src/pjsk/images/',
				glob: '*.png'
			},
			target: {
				image: './dist/images/pjsk_sprite.png',
				css: './dist/images/pjsk_sprite.json',
				format: 'json_texture'
			},
			cssImageRef: "./pjsk_sprite.png",
			spritesmithOptions: {
				padding: 4
			}
		}),
		typescript(),
		filesize()
	]
};
