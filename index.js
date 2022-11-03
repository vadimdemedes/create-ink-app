'use strict';
const {promisify} = require('util');
const path = require('path');
const fs = require('fs');
const makeDir = require('make-dir');
const replaceString = require('replace-string');
const slugify = require('slugify');
const execa = require('execa');
const Listr = require('listr');
const cpy = require('cpy');
const prompts = require('prompts');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const copyWithTemplate = async (from, to, variables) => {
	const dirname = path.dirname(to);
	await makeDir(dirname);

	const source = await readFile(from, 'utf8');
	let generatedSource = source;

	if (typeof variables === 'object') {
		generatedSource = replaceString(source, '%NAME%', variables.name);
	}

	await writeFile(to, generatedSource);
};

/** @return {Promise<'npm' | 'yarn' | 'pnpm'>} */ // eslint-disable-line valid-jsdoc
async function getPackageManagerToUse() {
	return (
		await prompts({
			name: 'packageManager',
			message: 'Which package manager do you use to install dependencies?',
			type: 'select',
			choices: [
				{title: 'npm', value: 'npm'},
				{title: 'yarn', value: 'yarn'},
				{title: 'pnpm', value: 'pnpm'}
			]
		})
	).packageManager;
}

const useTypeScript = process.argv.includes('--typescript');
let templatePath = 'templates/js';

if (useTypeScript) {
	templatePath = 'templates/ts';
}

const fromPath = file => path.join(__dirname, templatePath, file);
const toPath = file => path.join(process.cwd(), file);

const copyTasks = variables => {
	const commonTasks = [
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

	return useTypeScript
		? [
				...commonTasks,
				cpy(fromPath('source/ui.tsx'), toPath('source')),
				copyWithTemplate(
					fromPath('source/cli.tsx'),
					toPath('source/cli.tsx'),
					variables
				),
				cpy(fromPath('source/test.tsx'), toPath('source')),
				cpy(fromPath('tsconfig.json'), process.cwd())
		  ]
		: [
				...commonTasks,
				copyWithTemplate(fromPath('cli.js'), toPath('cli.js'), variables),
				cpy(fromPath('ui.js'), process.cwd()),
				cpy(fromPath('test.js'), process.cwd())
		  ];
};

const dependencies = useTypeScript ? [''] : ['import-jsx'];

const devDependencies = useTypeScript
	? [
			'@ava/typescript',
			'@sindresorhus/tsconfig',
			'@types/react',
			'typescript',
			'@types/node'
	  ]
	: [
			'@ava/babel',
			'@babel/preset-env',
			'@babel/preset-react',
			'@babel/register'
	  ];

/** @returns {Promise<Promise<any>>} */ // eslint-disable-line valid-jsdoc

module.exports = async () => {
	/** @type {'npm' | 'yarn' | 'pnpm'} */
	const pm = await getPackageManagerToUse();

	console.log(pm);

	// eslint-disable-next-line no-return-assign

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
			task: () => {
				return execa.stdout(pm, [
					pm === 'pnpm' ? 'add' : 'install',
					'meow@9',
					'ink@3',
					'react',
					...dependencies
				]);
			}
		},
		{
			title: 'Install dev dependencies',
			task: () => {
				return execa.stdout(pm, [
					pm === 'pnpm' ? 'add' : 'install',
					'--save-dev',
					'xo@0.39.1',
					'ava',
					'ink-testing-library',
					'chalk@4',
					'eslint-config-xo-react',
					'eslint-plugin-react',
					'eslint-plugin-react-hooks',
					...devDependencies
				]);
			}
		},
		{
			title: 'Link executable',
			task: async (_, task) => {
				if (useTypeScript) {
					await execa(pm, ['run', 'build']);
				}

				try {
					await execa(pm, ['link']);
					// eslint-disable-next-line unicorn/prefer-optional-catch-binding
				} catch (_) {
					task.skip(
						`${pm} link${
							pm === 'pnpm' ? ' --global' : ''
						} failed, please try running with sudo or running it manually.`
					);
				}
			}
		}
	]);

	console.log();
	return tasks.run();
};
