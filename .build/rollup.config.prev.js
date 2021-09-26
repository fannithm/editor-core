import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import html2 from 'rollup-plugin-html2';
import spritesmith from '@zz5840/rollup-plugin-sprite';
import postcss from 'rollup-plugin-postcss';
import filesize from 'rollup-plugin-filesize';
import { uglify } from 'rollup-plugin-uglify';

export default {
	input: 'src/test/test.ts',
	output: {
		dir: 'dist',
		entryFileNames: 'bundle-[hash].js',
		format: 'iife',
		globals: {
			'pixi.js': 'PIXI'
		}
	},
	external: ['pixi.js'],
	plugins: [
		resolve({
			customResolveOptions: {
				moduleDirectories: ['node_modules']
			}
		}),
		commonjs(),
		html2({
			template: 'src/test/index.html',
			externals: {
				before: [
					{ tag: 'script', src: 'https://unpkg.com/pixi.js@6.0.4/dist/browser/pixi.min.js' }
				]
			},
			minify: {
				removeComments: true,
				collapseWhitespace: true,
				keepClosingSlash: true
			}
		}),
		spritesmith({
			src: {
				cwd: './src/images/notes/',
				glob: '*.png'
			},
			target: {
				image: './dist/images/sprite.png',
				css: './dist/images/sprite.json',
				format: 'json_texture'
			},
			spritesmithOptions: {
				padding: 4
			}
		}),
		postcss(),
		typescript(),
		uglify(),
		filesize()
	]
};
