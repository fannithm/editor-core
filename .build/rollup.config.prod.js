import typescript from '@rollup/plugin-typescript';
import filesize from 'rollup-plugin-filesize';

export default {
	input: 'src/index.ts',
	output: [
		{
			file: 'dist/fannithm-editor-core.mjs',
			format: 'cjs'
		},
		{
			file: 'dist/fannithm-editor-core.cjs',
			format: 'es'
		}
	],
	external: ['pixi.js', '@fannithm/const/dist/pjsk', '@fannithm/utils', 'uuid', 'bezier-easing'],
	plugins: [
		typescript(),
		filesize()
	]
};
