'use strict';
const {promisify} = require('util');
const path = require('path');
const fs = require('fs');
const replaceString = require('replace-string');
const slugify = require('slugify');
const execa = require('execa');
const Listr = require('listr');
const cpy = require('cpy');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const copyWithTemplate = async (from, to, variables) => {
	const source = await readFile(from, 'utf8');
	let generatedSource = source;

	if (typeof variables === 'object') {
		generatedSource = replaceString(source, '%NAME%', variables.name);
	}

	await writeFile(to, generatedSource);
};

const useTsx = process.argv.includes('--tsx');
let templatePath = 'templates/js';

if (useTsx) {
	templatePath = 'templates/ts';
}

const fromPath = file => path.join(__dirname, templatePath, file);
const toPath = file => path.join(process.cwd(), file);

const copyTasks = variables => {
	const commonCopies = [
		copyWithTemplate(
			fromPath('_package.json'),
			toPath('package.json'),
			variables
		),
		copyWithTemplate(
			fromPath('../_common/readme.md'),
			toPath('readme.md'),
			variables
		),
		cpy(
			[
				fromPath('../_common/.editorconfig'),
				fromPath('../_common/.gitattributes'),
				fromPath('../_common/.gitignore')
			],
			process.cwd()
		)
	];

	return useTsx
		? [
				...commonCopies,
				cpy(fromPath('source/ui.tsx'), toPath('source')),
				cpy(fromPath('source/cli.tsx'), toPath('source')),
				cpy(fromPath('source/test.tsx'), toPath('source')),
				cpy(fromPath('tsconfig.json'), process.cwd())
		  ]
		: [
				...commonCopies,
				copyWithTemplate(fromPath('cli.js'), toPath('cli.js'), variables),
				cpy(fromPath('ui.js'), process.cwd()),
				cpy(fromPath('test.js'), process.cwd())
		  ];
};

const dependencies = useTsx ? [''] : ['import-jsx'];

const devDependencies = useTsx
	? ['@ava/typescript', '@sindresorhus/tsconfig', '@types/react', 'typescript']
	: [
			'@ava/babel',
			'@babel/preset-env',
			'@babel/preset-react',
			'@babel/register'
	  ];

module.exports = () => {
	const pkgName = slugify(path.basename(process.cwd()));

	const tasks = new Listr([
		{
			title: 'Copy files',
			task: async () => {
				const variables = {
					name: pkgName
				};

				return Promise.all(copyTasks(variables));
			}
		},
		{
			title: 'Install dependencies',
			task: async () => {
				await execa('npm', [
					'install',
					'meow',
					'ink',
					'react',
					...dependencies
				]);

				return execa('npm', [
					'install',
					'--save-dev',
					'xo',
					'ava',
					'ink-testing-library',
					'chalk',
					'eslint-config-xo-react',
					'eslint-plugin-react',
					'eslint-plugin-react-hooks',
					...devDependencies
				]);
			}
		},
		{
			title: 'Link executable',
			task: async () => {
				if (useTsx) {
					await execa('npm', ['run', 'build']);
				}

				return execa('npm', ['link']);
			}
		}
	]);

	console.log();
	return tasks.run();
};
