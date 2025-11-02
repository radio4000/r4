import {getChannel} from '../../lib/data.js'
import {formatOutput} from '../../lib/formatters.js'
import {formatChannelText} from '../../lib/text-formatters.js'
import {parse} from '../../utils.js'

export default {
	description: 'View detailed information about one or more channels',

	async run(argv) {
		const {values, positionals} = parse(argv, {
			format: {type: 'string'}
		})

		if (positionals.length === 0) {
			throw new Error('At least one channel slug is required')
		}

		const slugs = positionals
		const channels = await Promise.all(slugs.map((slug) => getChannel(slug)))
		const format = values.format || 'json'

		// Custom text formatting for channels
		if (format === 'text') {
			return channels.map(formatChannelText).join('\n\n---\n\n')
		}

		// Use generic formatter for json/sql (unwrap if single result)
		const data = channels.length === 1 ? channels[0] : channels
		return formatOutput(data, format, {table: 'channels'})
	},

	examples: [
		'r4 channel view ko002',
		'r4 channel view ko002 oskar',
		'r4 channel view ko002 --format text',
		'r4 channel view ko002 --format json',
		'r4 channel view ko002 --format sql'
	]
}
