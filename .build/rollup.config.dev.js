import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import serve from 'rollup-plugin-serve';
import html2 from 'rollup-plugin-html2';
import spritesmith from 'rollup-plugin-sprite';
import livereload from 'rollup-plugin-livereload';
import postcss from 'rollup-plugin-postcss';

import pkg from '../package.json';

export default {
	input: 'src/test/test.ts',
	watch: {
		include: 'src/**/*'
	},
	output: {
		file: '.temp/bundle.js',
		format: 'iife',
		globals: {
			'pixi.js': 'PIXI'
		}
	},
	external: ['pixi.js'],
	plugins: [
		resolve(),
		commonjs(),
		html2({
			template: 'src/test/index.html',
			externals: {
				before: [
					{
						tag: 'script',
						src: `https://unpkg.com/pixi.js@${ pkg.devDependencies['pixi.js'] }/dist/browser/pixi.js`
					}
				]
			}
		}),
		spritesmith({
			src: {
				cwd: 'src/pjsk/images/',
				glob: '*.png'
			},
			target: {
				image: '.temp/pjsk/image/sprite.png',
				css: '.temp/pjsk/image/sprite.json',
				format: 'json_texture'
			},
			cssImageRef: './sprite.png',
			spritesmithOptions: {
				padding: 4
			}
		}),
		postcss(),
		typescript(),
		serve({
			contentBase: ['.temp', 'public'],
			host: '0.0.0.0',
			port: 8081
		}),
		livereload()
	]
};
