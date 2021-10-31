import ts from 'rollup-plugin-ts';
import filesize from 'rollup-plugin-filesize';

export default [
	{
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
			ts(),
			filesize()
		]
	},
	{
		input: 'src/index.ts',
		output: {
			file: 'index.d.ts'
		},
		external: ['pixi.js', '@fannithm/const/dist/pjsk', '@fannithm/utils', 'uuid', 'bezier-easing'],
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
