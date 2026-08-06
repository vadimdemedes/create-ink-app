import React from 'react';
import chalk from 'chalk';
import test from 'ava';
import {render} from 'ink-testing-library';
import App from './dist/app.js';

test('greet unknown user', t => {
	const {lastFrame} = render(React.createElement(App));

	t.is(lastFrame(), `Hello, ${chalk.green('Stranger')}`);
});

test('greet user with a name', t => {
	const {lastFrame} = render(React.createElement(App, {name: 'Jane'}));

	t.is(lastFrame(), `Hello, ${chalk.green('Jane')}`);
});
