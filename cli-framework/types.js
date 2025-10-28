import {z} from 'zod'

/**
 * Schema for argument definition
 * Defines positional arguments that commands accept
 */
export const ArgSchema = z.object({
	name: z.string().min(1),
	description: z.string(),
	required: z.boolean().optional().default(false),
	multiple: z.boolean().optional().default(false) // accepts multiple values
})

/**
 * Schema for option definition (flags)
 * Based on Node.js util.parseArgs format
 */
export const OptionSchema = z.object({
	type: z.enum(['boolean', 'string', 'number']),
	description: z.string(),
	required: z.boolean().optional(), // mark option as required
	default: z.union([z.boolean(), z.string(), z.number()]).optional(),
	short: z.string().length(1).optional(), // short flag like -h
	conflicts: z.array(z.string()).optional(), // conflicting options
	parse: z.function().optional() // custom parser for validation/transformation
})

/**
 * Schema for command definition
 * This is what each command file should export
 */
export const CommandSchema = z.object({
	description: z.string(),
	args: z.array(ArgSchema).optional().default([]),
	options: z.record(z.string(), OptionSchema).optional().default({}),
	validate: z.any().optional(), // Zod schema for validation (can't validate Zod with Zod easily)
	handler: z.function(),
	examples: z.array(z.string()).optional(),
	hidden: z.boolean().optional().default(false) // hide from help
})

/**
 * Custom error types for CLI
 */
export class CLIError extends Error {
	constructor(type, message, context = {}) {
		super(message)
		this.name = 'CLIError'
		this.type = type
		this.context = context
		Error.captureStackTrace(this, this.constructor)
	}
}

/**
 * Error types
 */
export const ErrorTypes = {
	UNKNOWN_COMMAND: 'unknown_command',
	MISSING_ARGUMENT: 'missing_argument',
	INVALID_ARGUMENT: 'invalid_argument',
	CONFLICTING_OPTIONS: 'conflicting_options',
	HANDLER_ERROR: 'handler_error',
	INVALID_COMMAND_DEFINITION: 'invalid_command_definition',
	HELP_REQUESTED: 'help_requested'
}

/**
 * Format command help text
 * @param {Object} command - The command definition
 * @param {string} commandName - The command name/path (e.g., 'channel view')
 * @returns {string} Formatted help text
 */
export function formatCommandHelp(command, commandName = '') {
	let output = ''

	// Description
	if (command.description) {
		output += `${command.description}\n\n`
	}

	// Usage
	output += 'USAGE\n'
	let usage = `  r4 ${commandName}`

	if (command.args && command.args.length > 0) {
		for (const arg of command.args) {
			const argName = arg.multiple ? `<${arg.name}>...` : `<${arg.name}>`
			usage += ` ${arg.required ? argName : `[${argName}]`}`
		}
	}

	if (command.options && Object.keys(command.options).length > 0) {
		usage += ' [options]'
	}

	output += `${usage}\n\n`

	// Arguments
	if (command.args && command.args.length > 0) {
		output += 'ARGUMENTS\n'
		for (const arg of command.args) {
			const required = arg.required ? '(required)' : '(optional)'
			const multiple = arg.multiple ? ' - accepts multiple values' : ''
			output += `  ${arg.name}  ${arg.description} ${required}${multiple}\n`
		}
		output += '\n'
	}

	// Options
	if (command.options && Object.keys(command.options).length > 0) {
		output += 'OPTIONS\n'
		for (const [name, opt] of Object.entries(command.options)) {
			const shortFlag = opt.short ? `-${opt.short}, ` : '    '
			const defaultVal =
				opt.default !== undefined ? ` (default: ${opt.default})` : ''
			output += `  ${shortFlag}--${name}  ${opt.description}${defaultVal}\n`
		}
		output += '\n'
	}

	// Examples
	if (command.examples && command.examples.length > 0) {
		output += 'EXAMPLES\n'
		for (const example of command.examples) {
			output += `  ${example}\n`
		}
	}

	return output.trim()
}

/**
 * Format a CLIError for display
 * @param {CLIError} error - The error to format
 * @returns {string} Formatted error message
 */
export function formatCLIError(error) {
	if (error.type === ErrorTypes.HELP_REQUESTED && error.context?.command) {
		return formatCommandHelp(
			error.context.command,
			error.context.commandName || ''
		)
	}

	if (error.type === ErrorTypes.UNKNOWN_COMMAND && error.context?.available) {
		let output = ''

		// If there's an unknown command (actual mistake), show it
		if (error.context.unknownCommand) {
			output += `Unknown command: ${error.context.unknownCommand}\n\n`
		}

		// Show available options
		const label = error.context.commandPath
			? 'Available subcommands:'
			: 'Available commands:'
		const commands = error.context.available
			.map((cmd) => `  ${cmd.name}`)
			.join('\n')
		output += `${label}\n${commands}`

		return output
	}

	// Actual errors
	let output = `Error: ${error.message}`
	if (error.context && Object.keys(error.context).length > 0) {
		output += `\nContext: ${JSON.stringify(error.context, null, 2)}`
	}
	return output
}

/**
 * Validate a command definition
 * @param {unknown} commandDef - The command definition to validate
 * @returns {object} The validated command definition
 * @throws {CLIError} If validation fails
 */
export function validateCommandDefinition(commandDef) {
	try {
		return CommandSchema.parse(commandDef)
	} catch (error) {
		throw new CLIError(
			ErrorTypes.INVALID_COMMAND_DEFINITION,
			`Invalid command definition: ${error.message}`,
			{zodError: error}
		)
	}
}
