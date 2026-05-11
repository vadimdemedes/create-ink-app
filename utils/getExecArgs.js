/**
 * Get the executable's args array for the given package manager.
 * @param {"npm" | "yarn" | "pnpm"} packageManager - The package manager to use (e.g. 'npm', 'yarn').
 * @param {string[]} args - The arguments to pass to the package manager.
 * @returns {string[]} The arguments array.
 */
const getExecArgs = (packageManager, args) => {
	switch (packageManager) {
		case 'npm':
			return args;
		case 'yarn':
		case 'pnpm':
			return ['dlx', ...args];
		default:
			throw new Error(`Unknown package manager: ${packageManager}`);
	}
};

export default getExecArgs;
