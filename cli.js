#!/usr/bin/env node
'use strict';
const meow = require('meow');
const createInkApp = require('.');

const cli = meow(`
	Usage
		$ mkdir my-cli
		$ cd my-cli
	  $ create-ink-app --typescript

	Flags
		--help
		--typescript, --ts    Generate a TypeScript-based project

	Commands
		create-ink-app

	Examples
		$ create-ink-app
		$ create-ink-app --typescript
`, {
	flags: {
		typescript: {
			type: 'boolean',
			default: false,
			alias: 'ts'
		}
	}
});

createInkApp(cli.flags).catch(error => {
	console.error(error.stack);
	process.exit(1);
});
