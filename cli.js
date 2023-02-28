#!/usr/bin/env node
'use strict';
const path = require('path');
const meow = require('meow');
const createInkApp = require('.');

const cli = meow(
	`
	Options
		--typescript		Use TypeScript React template

	Usage
		$ create-ink-app <project-directory>

	Examples
		$ create-ink-app my-cli
		$ create-ink-app .
`,
	{
		flags: {
			typescript: {
				type: 'boolean'
			}
		}
	}
);

const projectDirectoryPath = path.resolve(process.cwd(), cli.input[0] || '.');

createInkApp(projectDirectoryPath)
	.catch(error => {
		console.error(error.stack);
		process.exit(1);
	})
	.then(() => {
		const pkgName = path.basename(projectDirectoryPath);
		const relativePath = path.relative(process.cwd(), projectDirectoryPath);

		console.log();
		console.log('Ink app created! Get started with:');
		console.log();
		if (relativePath) {
			console.log(`  cd ${relativePath}`);
		}
		console.log(`  ${pkgName}`);
	});
