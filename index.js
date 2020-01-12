'use strict';
const path = require('path');
const execa = require('execa');
const Listr = require('listr');
const {javascriptCopyFiles, javascriptInstallDependencies,
	typescriptCopyFiles, typescriptInstallDependencies, typescriptCompile} = require('./task');

const defaults = {
	template: 'javascript'
};

const toPath = file => path.join(process.cwd(), file);

const getTemplateFlag = typescript => {
	if (!typescript) {
		return defaults.template;
	}

	return 'typescript';
};

module.exports = flags => {
	const template = getTemplateFlag(flags.typescript);
	const fromPath = file => path.join(__dirname, `template/${template}`, file);

	const tasks = new Listr([
		{
			title: 'Copy files',
			task: () => javascriptCopyFiles(fromPath, toPath),
			enabled: () => template === 'javascript'
		},
		{
			title: 'Copy files',
			task: () => typescriptCopyFiles(fromPath, toPath),
			enabled: () => template === 'typescript'
		},
		{
			title: 'Install dependencies',
			task: () => javascriptInstallDependencies(),
			enabled: () => template === 'javascript'
		},
		{
			title: 'Install dependencies',
			task: () => typescriptInstallDependencies(),
			enabled: () => template === 'typescript'
		},
		{
			title: 'Compile typescript',
			task: () => typescriptCompile(),
			enabled: () => template === 'typescript'
		},
		{
			title: 'Link executable',
			task: () => execa('npm', ['link'])
		}
	]);

	console.log();
	return tasks.run();
};
