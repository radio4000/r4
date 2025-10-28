import {listChannels} from '../../lib/data.js'

export default {
	description: 'List all channels (from v2 API or bundled v1 data)',

	options: {
		limit: {
			type: 'number',
			description: 'Limit number of results (default: 100)',
			default: 100
		},
		sql: {
			type: 'boolean',
			description: 'Output as SQL statements',
			default: false
		}
	},

	handler: async (input) => {
		// Use default limit of 100 if not specified
		const limit = input.limit ?? 100

		return {
			data: await listChannels({limit}),
			format: input.sql ? 'sql' : 'json',
			formatOptions: input.sql ? {table: 'channels'} : undefined
		}
	},

	examples: [
		'r4 channel list',
		'r4 channel list --limit 10',
		'r4 channel list --limit 100 --sql'
	]
}
