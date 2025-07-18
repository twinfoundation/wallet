// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { exec, spawn } from 'node:child_process';
import fs from 'node:fs/promises';

/**
 * Load a JSON file.
 * @param filePath The path to load as JSON.
 * @returns The loaded JSON.
 */
export async function loadJson(filePath) {
	const content = await fs.readFile(filePath, 'utf8');

	return JSON.parse(content);
}

/**
 * Save a JSON file.
 * @param filePath The path to save the object as JSON.
 * @param obj The object to save as JSON.
 */
export async function saveJson(filePath, obj) {
	await fs.writeFile(filePath, `${JSON.stringify(obj, undefined, '\t')}\n`, 'utf8');
}

/**
 * Run a shell app.
 * @param app The app to run in the shell.
 * @param args The args for the app.
 * @param cwd The working directory to execute the command in.
 * @returns Promise to wait for command execution to complete.
 */
export async function runShellCmd(app, args, cwd) {
	return new Promise((resolve, reject) => {
		process.stdout.write(`${app} ${args.join(' ')}\n`);

		const osCommand = process.platform.startsWith('win') ? `${app}.cmd` : app;

		const sp = spawn(osCommand, args, {
			stdio: 'inherit',
			shell: true,
			cwd
		});

		sp.on('exit', (exitCode, signals) => {
			if (Number.parseInt(exitCode, 10) !== 0 || signals?.length) {
				reject(new Error('Run failed'));
			} else {
				resolve();
			}
		});
	});
}

/**
 * Execute a command asynchronously.
 * @param command The command to execute
 * @returns The stdout output
 */
export function execAsync(command) {
	return new Promise((resolve, reject) => {
		exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
			if (error) {
				reject(error);
			} else {
				resolve(stdout.trim());
			}
		});
	});
}

/**
 * Does the specified file exist.
 * @param filename The filename to check for existence.
 * @returns True if the file exists.
 */
export async function fileExists(filename) {
	try {
		const stats = await fs.stat(filename);
		return stats.isFile();
	} catch {
		return false;
	}
}

/**
 * Does the specified directory exist.
 * @param directory The directory to check for existence.
 * @returns True if the directory exists.
 */
export async function directoryExists(directory) {
	try {
		const stats = await fs.stat(directory);
		return stats.isDirectory();
	} catch {
		return false;
	}
}

/**
 * Is the file/directory a symbolic link.
 * @param item The item to check if it's a symbolic link.
 * @returns True if the item is a symbolic link.
 */
export async function isSymbolicLink(item) {
	try {
		const stats = await fs.lstat(item);
		return stats.isSymbolicLink();
	} catch {
		return false;
	}
}
