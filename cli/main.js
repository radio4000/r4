#!/usr/bin/env node
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {executeCommand} from '../cli-framework/index.js'
import {formatCLIError} from '../cli-framework/utils/help.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
	const argv = process.argv.slice(2)

	try {
		const result = await executeCommand({
			commandsDir: resolve(__dirname, 'commands'),
			argv,
			context: {
				cwd: process.cwd()
			}
		})

		// Commands return formatted strings, framework just prints
		if (result) {
			console.log(result)
		}
		process.exit(0)
	} catch (error) {
		// Handle errors - use framework's error formatter
		const output = formatCLIError(error)

		// Print to stdout for help and menu-like messages, stderr for actual errors
		if (
			error.type === 'help_requested' ||
			(error.type === 'unknown_command' && error.context?.available)
		) {
			console.log(output)
			process.exit(0) // Help is not an error
		} else {
			console.error(output)
			process.exit(1)
		}
	}
}

main()
