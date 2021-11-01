import ts from 'rollup-plugin-ts';
import filesize from 'rollup-plugin-filesize';

const external = ['pixi.js', '@fannithm/const', '@fannithm/utils', 'uuid', 'bezier-easing'];

export default [
	{
		input: 'src/index.ts',
		output: [
			{
				file: 'dist/fannithm-editor-core.cjs',
				format: 'cjs'
			},
			{
				file: 'dist/fannithm-editor-core.mjs',
				format: 'es'
			}
		],
		external,
		plugins: [
			ts(),
			filesize()
		]
	},
	{
		input: 'src/index.ts',
		output: {
			file: 'index.d.ts'
		},
		external,
		plugins: [
			ts({
				tsconfig: config => ({
					...config,
					declaration: true,
					declarationDir: './',
					emitDeclarationOnly: true
				})
			})
		]
	}
];
