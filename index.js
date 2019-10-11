'use strict';
const path = require('path');
const execa = require('execa');
const Listr = require('listr');
const { JavascriptCopyFiles, JavascriptInstallDependencies } = require('./task');

const defaults = {
	template: 'javascript'
};

const toPath = file => path.join(process.cwd(), file);

const getTemplateInput = (input) => {
	if (input.length < 1) {
		return defaults.template;
	}

	return input.shift();
};

module.exports = (input) => {
	const template = getTemplateInput(input);
	const fromPath = file => path.join(__dirname, `template/${template}`, file);

	const tasks = new Listr([
		{
			title: 'Copy files',
			task: () => JavascriptCopyFiles(fromPath, toPath)
		},
		{
			title: 'Install dependencies',
			task: () => JavascriptInstallDependencies()
		},
		{
			title: 'Link executable',
			task: () => execa('npm', ['link'])
		}
	]);

	console.log();
	return tasks.run();
};
