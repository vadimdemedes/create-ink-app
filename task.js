const {promisify} = require('util');
const path = require('path');
const fs = require('fs');
const execa = require('execa');
const slugify = require('slugify');
const replaceString = require('replace-string');
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

const javascriptCopyFiles = async (fromPath, toPath) => {
	const pkgName = slugify(path.basename(process.cwd()));

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
};

const javascriptInstallDependencies = async () => {
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
};

const typescriptCopyFiles = async (fromPath, toPath) => {
	const pkgName = slugify(path.basename(process.cwd()));

	const variables = {
		name: pkgName
	};

	if (!fs.existsSync('src')) {
		fs.mkdirSync('src');
	}

	return Promise.all([
		copyWithTemplate(fromPath('_package.json'), toPath('package.json'), variables),
		copyWithTemplate(fromPath('readme.md'), toPath('readme.md'), variables),
		copyWithTemplate(fromPath('src/cli.tsx'), toPath('src/cli.tsx'), variables),
		cpy([
			fromPath('/src/ui.tsx'),
			fromPath('src/test.tsx')
		], toPath('src')),
		cpy([
			fromPath('tsconfig.json'),
			fromPath('.editorconfig'),
			fromPath('.gitattributes'),
			fromPath('.gitignore'),
			fromPath('.babelrc')
		], process.cwd())
	]);
};

const typescriptInstallDependencies = async () => {
	await execa('npm', [
		'install',
		'ink',
		'meow',
		'react'
	]);

	return execa('npm', [
		'install',
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
	]);
};

const typescriptCompile = async () => {
	return execa('npm', [
		'run',
		'compile'
	]);
};

module.exports = {
	javascriptCopyFiles,
	javascriptInstallDependencies,
	typescriptCopyFiles,
	typescriptInstallDependencies,
	typescriptCompile
};
