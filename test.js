import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs/promises';
import test from 'ava';
import {execa} from 'execa';
import stripAnsi from 'strip-ansi';
import {temporaryDirectoryTask} from 'tempy';
import createInkApp from './index.js';

const temporaryProjectTask = async (type, callback) => {
	await temporaryDirectoryTask(async temporaryDirectory => {
		const projectDirectory = path.join(temporaryDirectory, `test-${type}-app`);

		try {
			await callback(projectDirectory);
		} finally {
			await execa('npm', ['unlink', '--global', `test-${type}-app`], {
				cwd: projectDirectory,
			});
		}
	});
};

// For some reason CI hangs when NODE_ENV is present in shebang,
// so this super ugly hack removes it when tests are run in CI,
// which results in development build of React being used.
const fixCli = async projectDirectory => {
	if (process.env.CI !== 'true') {
		return;
	}

	const cliPath = path.join(projectDirectory, 'dist', 'cli.js');
	const source = await fs.readFile(cliPath, 'utf8');
	const fixedSource = source.replace('NODE_ENV=production ', '');
	await fs.writeFile(cliPath, fixedSource);
};

test.serial('javascript app', async t => {
	await temporaryProjectTask('js', async projectDirectory => {
		await createInkApp(projectDirectory, {
			typescript: false,
			silent: true,
		});

		const result = await execa('test-js-app');
		t.is(stripAnsi(result.stdout).trim(), 'Hello, Stranger');

		await t.notThrowsAsync(
			execa('npm', ['test'], {
				cwd: projectDirectory,
			}),
		);
	});
});

test.serial('typescript app', async t => {
	await temporaryProjectTask('ts', async projectDirectory => {
		await createInkApp(projectDirectory, {
			typescript: false,
			silent: true,
		});

		await fixCli(projectDirectory);

		const result = await execa('test-ts-app');
		t.is(stripAnsi(result.stdout).trim(), 'Hello, Stranger');

		await t.notThrowsAsync(
			execa('npm', ['test'], {
				cwd: projectDirectory,
			}),
		);
	});
});
