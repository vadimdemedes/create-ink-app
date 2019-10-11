#!/usr/bin/env node
'use strict';
const meow = require('meow');
const createInkApp = require('.');

const cli = meow(`
	Usage
		$ mkdir my-cli
		$ cd my-cli
	  $ create-ink-app <template>

	Flags
		--help

	Commands
		create-ink-app <template>

	Examples
		$ create-ink-app typescript
`);

createInkApp(cli.input).catch(error => {
	console.error(error.stack);
	process.exit(1);
});
