#!/usr/bin/env node
'use strict';
const createInkApp = require('.');

require('./parse')();

createInkApp().catch(error => {
	console.error(error.stack);
	process.exit(1);
});
