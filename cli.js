#!/usr/bin/env node
import process from 'node:process';
import path from 'node:path';
import meow from 'meow';
import createInkApp from './index.js';

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
		importMeta: import.meta,
		flags: {
			typescript: {
				type: 'boolean',
			},
		},
	},
);

const projectDirectoryPath = path.resolve(process.cwd(), cli.input[0] || '.');

try {
	console.log();
	await createInkApp(projectDirectoryPath, cli.flags);

	const pkgName = path.basename(projectDirectoryPath);
	const relativePath = path.relative(process.cwd(), projectDirectoryPath);

	console.log(
		[
			'',
			`Ink app created in ${relativePath ?? 'the current directory'}:`,
			relativePath ? `  $ cd ${relativePath}` : undefined,
			relativePath ? '' : undefined,
			'Build:',
			'  $ npm run build',
			'',
			'Watch and rebuild:',
			'  $ npm run dev',
			'',
			'Run:',
			`  $ ${pkgName}`,
			'',
		]
			.filter(line => line !== undefined)
			.map(line => `  ${line}`)
			.join('\n'),
	);
} catch (error) {
	console.error(error.stack);
	process.exit(1);
}
