#!/usr/bin/env node
'use strict';
const meow = require('meow');
const createInkApp = require('.');

meow(`
	Options
		--typescript											Use TypeScript React template
		-pm=<npm,yarn,pnpm> --package-manager=<npm,yarn,pnpm>	Which package manager to use for installing dependencies? (optional)

	Usage
		$ mkdir my-cli
		$ cd my-cli
	  $ create-ink-app
`);

createInkApp().catch(error => {
	console.error(error.stack);
	process.exit(1);
});
