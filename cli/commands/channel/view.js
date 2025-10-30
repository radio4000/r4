import {formatOption} from '../../lib/common-options.js'
import {getChannel} from '../../lib/data.js'
import {formatOutput} from '../../lib/formatters.js'
import {formatChannelText} from '../../lib/text-formatters.js'

export default {
	description: 'View detailed information about one or more channels',

	args: [
		{
			name: 'slug',
			description: 'Channel slug(s) to view',
			required: true,
			multiple: true
		}
	],

	options: formatOption,

	handler: async (input) => {
		const slugs = Array.isArray(input.slug) ? input.slug : [input.slug]
		const channels = await Promise.all(slugs.map((slug) => getChannel(slug)))
		const format = input.format || 'json'

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
