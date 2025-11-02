import {deleteTrack} from '../../lib/data.js'
import {formatOutput} from '../../lib/formatters.js'
import {parse} from '../../utils.js'

export default {
	description: 'Delete one or more tracks',

	async run(argv) {
		const {values, positionals} = parse(argv, {
			sql: {type: 'boolean'}
		})

		if (positionals.length === 0) {
			throw new Error('At least one track ID is required')
		}

		const ids = positionals
		const results = await Promise.all(ids.map((id) => deleteTrack(id)))
		const format = values.sql ? 'sql' : 'json'
		const data = results.length === 1 ? results[0] : results
		const formatOptions = format === 'sql' ? {table: 'tracks'} : undefined
		return formatOutput(data, format, formatOptions)
	},

	examples: ['r4 track delete abc123', 'r4 track delete abc123 def456 ghi789']
}
