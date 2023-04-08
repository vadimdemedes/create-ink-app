import process from 'node:process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import makeDir from 'make-dir';
import replaceString from 'replace-string';
import slugify from 'slugify';
import {execa} from 'execa';
import Listr from 'listr';

const copyWithTemplate = async (from, to, variables) => {
	const dirname = path.dirname(to);
	await makeDir(dirname);

	const source = await fs.readFile(from, 'utf8');
	let generatedSource = source;

	if (typeof variables === 'object') {
		generatedSource = replaceString(source, '%NAME%', variables.name);
	}

	await fs.writeFile(to, generatedSource);
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
								await copyWithTemplate(
									fromPath('_package.json'),
									toPath(projectDirectoryPath, 'package.json'),
									variables,
								);

								await copyWithTemplate(
									fromPath('../_common/readme.md'),
									toPath(projectDirectoryPath, 'readme.md'),
									variables,
								);

								await fs.copyFile(
									fromPath('../_common/_editorconfig'),
									toPath(projectDirectoryPath, '.editorconfig'),
								);

								await fs.copyFile(
									fromPath('../_common/_gitattributes'),
									toPath(projectDirectoryPath, '.gitattributes'),
								);

								await fs.copyFile(
									fromPath('../_common/_gitignore'),
									toPath(projectDirectoryPath, '.gitignore'),
								);

								await fs.copyFile(
									fromPath('../_common/_prettierignore'),
									toPath(projectDirectoryPath, '.prettierignore'),
								);
							},
						},
						{
							title: 'JavaScript files',
							enabled: () => !typescript,
							async task() {
								await makeDir(toPath(projectDirectoryPath, 'source'));

								await fs.copyFile(
									fromPath('source/app.js'),
									toPath(projectDirectoryPath, 'source/app.js'),
								);

								await copyWithTemplate(
									fromPath('source/cli.js'),
									toPath(projectDirectoryPath, 'source/cli.js'),
									variables,
								);

								await fs.copyFile(
									fromPath('test.js'),
									toPath(projectDirectoryPath, 'test.js'),
								);
							},
						},
						{
							title: 'TypeScript files',
							enabled: () => typescript,
							async task() {
								await makeDir(toPath(projectDirectoryPath, 'source'));

								await fs.copyFile(
									fromPath('source/app.tsx'),
									toPath(projectDirectoryPath, 'source/app.tsx'),
								);

								await copyWithTemplate(
									fromPath('source/cli.tsx'),
									toPath(projectDirectoryPath, 'source/cli.tsx'),
									variables,
								);

								await fs.copyFile(
									fromPath('test.tsx'),
									toPath(projectDirectoryPath, 'test.tsx'),
								);

								await fs.copyFile(
									fromPath('tsconfig.json'),
									toPath(projectDirectoryPath, 'tsconfig.json'),
								);
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
