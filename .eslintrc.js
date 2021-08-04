module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	env: {
		browser: true,
		amd: true,
		node: true
	},
	plugins: [
		'@typescript-eslint',
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	]
}
