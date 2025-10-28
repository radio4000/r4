import {z} from 'zod'
import {getChannel} from '../../lib/data.js'

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

	options: {
		sql: {
			type: 'boolean',
			description: 'Output as SQL statements',
			default: false
		}
	},

	validate: z.object({
		slug: z.union([z.string(), z.array(z.string())])
	}),

	handler: async (input) => {
		const slugs = Array.isArray(input.slug) ? input.slug : [input.slug]
		const channels = await Promise.all(slugs.map((slug) => getChannel(slug)))

		return {
			data: channels.length === 1 ? channels[0] : channels,
			format: input.sql ? 'sql' : 'json',
			formatOptions: input.sql ? {table: 'channels'} : undefined
		}
	},

	examples: [
		'r4 channel view ko002',
		'r4 channel view ko002 oskar',
		'r4 channel view ko002 --sql'
	]
}
