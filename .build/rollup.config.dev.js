import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import eslint from '@rollup/plugin-eslint';
import serve from 'rollup-plugin-serve';
import html2 from 'rollup-plugin-html2'
import spritesmith from "@zz5840/rollup-plugin-sprite";
import livereload from 'rollup-plugin-livereload';
import postcss from 'rollup-plugin-postcss';

export default {
	input: 'src/test.ts',
	watch: {
		include: 'src/**/*'
	},
	output: {
		file: 'build/bundle.js',
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
			template: 'src/index.html',
			externals: {
				before: [
					{ tag: 'script', src: 'https://unpkg.com/pixi.js@6.0.4/dist/browser/pixi.js' }
				]
			}
		}),
		spritesmith({
			src: {
				cwd: "./src/images/notes/",
				glob: "*.png"
			},
			target: {
				image: "./build/images/sprite.png",
				css: "./build/images/sprite.json",
				format: "json_texture"
			},
			spritesmithOptions: {
				padding: 4
			}
		}),
		postcss(),
		eslint(),
		typescript(),
		serve({
			contentBase: ['build', 'public'],
			host: '0.0.0.0',
			port: 8081
		}),
		livereload()
	]
}
