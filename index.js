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

const fromPath = file => path.join(__dirname, 'template', file);
const toPath = file => path.join(process.cwd(), file);

module.exports = () => {
	const pkgName = slugify(path.basename(process.cwd()));

	const tasks = new Listr([
		{
			title: 'Copy files',
			task: async () => {
				const variables = {
					name: pkgName
				};

				return Promise.all([
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
				]);
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
					'import-jsx'
				]);

				return execa('npm', [
					'install',
					'--save-dev',
					'xo',
					'ava',
					'@ava/babel',
					'ink-testing-library',
					'chalk',
					'@babel/preset-env',
					'@babel/preset-react',
					'@babel/register',
					'eslint-config-xo-react',
					'eslint-plugin-react',
					'eslint-plugin-react-hooks'
				]);
			}
		},
		{
			title: 'Link executable',
			task: () => execa('npm', ['link'])
		}
	]);

	console.log();
	return tasks.run();
};
