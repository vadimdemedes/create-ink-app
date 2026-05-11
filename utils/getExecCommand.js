/**
 * Creates an executable command string for the given package manager and arguments.
 * @param {"npm" | "yarn" | "pnpm"} packageManager - The package manager to use (e.g. 'npm', 'yarn').
 * @returns {string} The executable command string.
 */
const getExecCommand = packageManager => {
	switch (packageManager) {
		case 'npm':
			return 'npx';
		case 'yarn':
			return 'yarn';
		case 'pnpm':
			return 'pnpm';
		default:
			throw new Error(`Unknown package manager: ${packageManager}`);
	}
};

export default getExecCommand;
