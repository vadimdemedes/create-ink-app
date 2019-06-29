#!/usr/bin/env node
'use strict';
const meow = require('meow');
const createInkApp = require('.');

meow(`
	Usage
		$ mkdir my-cli
		$ cd my-cli
	  $ create-ink-app
`);

createInkApp().catch(error => {
	console.error(error.stack);
	process.exit(1);
});
