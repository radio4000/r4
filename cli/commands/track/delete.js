import {deleteTrack} from '../../lib/data.js'

export default {
	description: 'Delete one or more tracks',

	args: [
		{
			name: 'id',
			description: 'Track ID(s) to delete',
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

	handler: async (input) => {
		const ids = Array.isArray(input.id) ? input.id : [input.id]
		const results = await Promise.all(ids.map((id) => deleteTrack(id)))

		return {
			data: results.length === 1 ? results[0] : results,
			format: input.sql ? 'sql' : 'json',
			formatOptions: input.sql ? {table: 'tracks'} : undefined
		}
	},

	examples: ['r4 track delete abc123', 'r4 track delete abc123 def456 ghi789']
}
