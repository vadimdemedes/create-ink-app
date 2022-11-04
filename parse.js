'use strict';

const yargs = require('yargs');

module.exports = () =>
	yargs
		.scriptName('create-ink-app')
		.usage(
			`$ mkdir my-cli
$ cd my-cli
$ $0
# $0 --typescript to use TypeScript React Template`
		)
		.option('typescript', {
			type: 'boolean',
			description: 'Use TypeScript React template',
			alias: 'ts'
		})
		.option('package-manager', {
			alias: 'P',
			choices: ['npm', 'yarn', 'pnpm'],
			description: 'Package manager to use for installing dependencies'
		})
		.help()
		.parseSync();
