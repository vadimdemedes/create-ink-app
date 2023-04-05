import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import makeDir from 'make-dir';
import replaceString from 'replace-string';
import slugify from 'slugify';
import {execa} from 'execa';
import Listr from 'listr';
import cpy from 'cpy';

const copyFile = promisify(fs.copyFile);
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

const createInkApp = (
	projectDirectoryPath = process.cwd(),
	{typescript, silent},
) => {
	const pkgName = slugify(path.basename(projectDirectoryPath));

	const execaInDirectory = (file, args, options = {}) =>
		execa(file, args, {
			...options,
			cwd: projectDirectoryPath,
		});

	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	const templatePath = typescript ? 'templates/ts' : 'templates/js';

	const fromPath = file =>
		path.join(path.resolve(__dirname, templatePath), file);

	const toPath = (rootPath, file) => path.join(rootPath, file);

	const tasks = new Listr(
		[
			{
				title: 'Copy files',
				task() {
					const variables = {
						name: pkgName,
					};

					return new Listr([
						{
							title: 'Common files',
							async task() {
								return Promise.all([
									copyWithTemplate(
										fromPath('_package.json'),
										toPath(projectDirectoryPath, 'package.json'),
										variables,
									),
									copyWithTemplate(
										fromPath('../_common/readme.md'),
										toPath(projectDirectoryPath, 'readme.md'),
										variables,
									),
									copyFile(
										fromPath('../_common/_.gitignore'),
										toPath(projectDirectoryPath, '.gitignore'),
									),
									cpy(
										[
											fromPath('../_common/.editorconfig'),
											fromPath('../_common/.gitattributes'),
											fromPath('../_common/.prettierignore'),
										],
										projectDirectoryPath,
										{flat: true},
									),
								]);
							},
						},
						{
							title: 'JavaScript files',
							enabled: () => !typescript,
							async task() {
								return Promise.all([
									cpy(
										fromPath('source/app.js'),
										toPath(projectDirectoryPath, 'source'),
									),
									copyWithTemplate(
										fromPath('source/cli.js'),
										toPath(projectDirectoryPath, 'source/cli.js'),
										variables,
									),
									cpy(fromPath('test.js'), projectDirectoryPath, {flat: true}),
								]);
							},
						},
						{
							title: 'TypeScript files',
							enabled: () => typescript,
							async task() {
								return Promise.all([
									cpy(
										fromPath('source/app.tsx'),
										toPath(projectDirectoryPath, 'source'),
									),
									copyWithTemplate(
										fromPath('source/cli.tsx'),
										toPath(projectDirectoryPath, 'source/cli.tsx'),
										variables,
									),
									cpy(
										[fromPath('test.tsx'), fromPath('tsconfig.json')],
										projectDirectoryPath,
										{flat: true},
									),
								]);
							},
						},
					]);
				},
			},
			{
				title: 'Install dependencies',
				async task() {
					await execaInDirectory('npm', ['install']);
				},
			},
			{
				title: 'Format code',
				task() {
					return execaInDirectory('npx', ['prettier', '--write', '.']);
				},
			},
			{
				title: 'Build',
				task() {
					return execaInDirectory('npm', ['run', 'build']);
				},
			},
			{
				title: 'Link executable',
				async task(_, task) {
					try {
						await execaInDirectory('npm', ['link']);
					} catch {
						task.skip('`npm link` failed, try running it yourself');
					}
				},
			},
		],
		{
			renderer: silent ? 'silent' : 'default',
		},
	);

	return tasks.run();
};

export default createInkApp;
