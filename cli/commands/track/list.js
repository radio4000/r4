import {listTracks} from '../../lib/data.js'

export default {
	description: 'List tracks for specified channel(s)',

	options: {
		channel: {
			type: 'string',
			description: 'Channel slug to filter by (can be used multiple times)',
			multiple: true,
			required: true
		},
		limit: {
			type: 'number',
			description: 'Limit number of results'
		},
		sql: {
			type: 'boolean',
			description: 'Output as SQL statements',
			default: false
		}
	},

	handler: async ({flags}) => {
		const channelSlugs = flags.channel && [flags.channel].flat()

		const tracks = await listTracks({
			channelSlugs,
			limit: flags.limit
		})

		return {
			data: tracks,
			format: flags.sql ? 'sql' : 'json',
			formatOptions: flags.sql ? {table: 'tracks'} : undefined
		}
	},

	examples: [
		'r4 track list --channel ko002',
		'r4 track list --channel ko002 --limit 5',
		'r4 track list --channel ko002 --channel oskar',
		'r4 track list --channel ko002 --sql'
	]
}
