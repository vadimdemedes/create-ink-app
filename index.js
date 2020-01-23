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

const getTemplateFlag = typescript => {
	if (!typescript) {
		return 'javascript';
	}

	return 'typescript';
};

const install = async ({typescript}) => {
	const unpack = dependencies => {
		return Promise.all(dependencies.map(async group => {
			await execa('npm', ['install', ...group]);
		}));
	};

	const jsDependencies = [
		[
			'meow',
			'ink',
			'react',
			'prop-types',
			'import-jsx'
		],
		[
			'--save-dev',
			'xo',
			'ava',
			'ink-testing-library',
			'chalk',
			'@babel/preset-react',
			'@babel/register',
			'eslint-config-xo-react',
			'eslint-plugin-react',
			'eslint-plugin-react-hooks'
		]
	];

	const tsDependencies = [
		[
			'ink',
			'meow',
			'react'
		],
		[
			'--save-dev',
			'xo',
			'ava',
			'chalk',
			'@babel/preset-react',
			'@babel/register',
			'@types/node',
			'@types/react',
			'@typescript-eslint/eslint-plugin',
			'@typescript-eslint/parser',
			'eslint-config-xo',
			'eslint-config-xo-react',
			'eslint-config-xo-typescript',
			'eslint-plugin-react',
			'eslint-plugin-react-hooks',
			'ink-testing-library',
			'ts-node',
			'typescript',
			'xo'
		]
	];

	return typescript ? unpack(tsDependencies) : unpack(jsDependencies);
};

const copyFiles = ({typescript}) => {
	const template = getTemplateFlag(typescript);
	const fromPath = file => path.join(__dirname, `template/${template}`, file);
	const toPath = file => path.join(process.cwd(), file);
	const pkgName = slugify(path.basename(process.cwd()));
	const variables = {
		name: pkgName
	};

	const jsFiles = [
		copyWithTemplate(fromPath('_package.json'), toPath('package.json'), variables),
		copyWithTemplate(fromPath('readme.md'), toPath('readme.md'), variables),
		copyWithTemplate(fromPath('cli.js'), toPath('cli.js'), variables),
		cpy(fromPath('ui.js'), process.cwd()),
		cpy(fromPath('test.js'), process.cwd()),
		cpy([
			fromPath('.editorconfig'),
			fromPath('.gitattributes'),
			fromPath('.gitignore')
		], process.cwd())
	];

	const tsFiles = [
		fs.mkdirSync('src'),
		copyWithTemplate(fromPath('_package.json'), toPath('package.json'), variables),
		copyWithTemplate(fromPath('readme.md'), toPath('readme.md'), variables),
		copyWithTemplate(fromPath('src/cli.tsx'), toPath('src/cli.tsx'), variables),
		cpy([
			fromPath('src/ui.tsx'),
			fromPath('src/test.tsx')
		], toPath('src')),
		cpy([
			fromPath('tsconfig.json'),
			fromPath('.editorconfig'),
			fromPath('.gitattributes'),
			fromPath('.gitignore'),
			fromPath('.babelrc')
		], process.cwd())
	];

	return typescript ? Promise.all(tsFiles) : Promise.all(jsFiles);
};

module.exports = flags => {
	const tasks = new Listr([
		{
			title: 'Copy files',
			task: async () => copyFiles(flags)
		},
		{
			title: 'Install dependencies',
			task: async () => install(flags)
		},
		{
			title: 'Compile typescript',
			task: () => execa('npm', ['run', 'build']),
			enabled: () => flags.typescript
		},
		{
			title: 'Link executable',
			task: () => execa('npm', ['link'])
		}
	]);

	console.log();
	return tasks.run();
};
