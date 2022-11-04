#!/usr/bin/env node
'use strict';
// eslint-disable-next-line capitalized-comments
// const meow = require('meow');
const yargs = require('yargs');
const createInkApp = require('.');

// eslint-disable-next-line capitalized-comments
/* meow(`
	Options
		--typescript											Use TypeScript React template
		-pm=<npm,yarn,pnpm> --package-manager=<npm,yarn,pnpm>	Which package manager to use for installing dependencies? (optional)

	Usage
		$ mkdir my-cli
		$ cd my-cli
	  $ create-ink-app
`); */

require('./parse')();

createInkApp().catch(error => {
	console.error(error.stack);
	process.exit(1);
});
