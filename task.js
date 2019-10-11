const { promisify } = require('util');
const execa = require('execa');
const slugify = require('slugify');
const replaceString = require('replace-string');
const path = require('path');
const cpy = require('cpy');
const fs = require('fs');

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

const JavascriptCopyFiles = async (fromPath, toPath) => {
	const pkgName = slugify(path.basename(process.cwd()));
	console.log(pkgName);

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

const JavascriptInstallDependencies = async () => {
	await execa('npm', [
		'install',
		'meow',
		'ink',
		'react',
		'prop-types',
		'import-jsx'
	]);

	return execa('npm', [
		'install',
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
	]);
}

const TypescriptCopyFiles = (fromPath, toPath) => {

}

const TypescriptInstallDependencies = () => {

}

module.exports = {
	JavascriptCopyFiles,
	JavascriptInstallDependencies,
	TypescriptCopyFiles,
	TypescriptInstallDependencies
}
