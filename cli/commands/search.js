import {searchAll, searchChannels, searchTracks} from '../lib/data.js'

export default {
	description: 'Search channels and tracks',
	args: [
		{
			name: 'query',
			required: true,
			description: 'Search query'
		}
	],
	options: {
		channels: {
			alias: 'c',
			type: 'boolean',
			description: 'Search only channels',
			default: false
		},
		tracks: {
			alias: 't',
			type: 'boolean',
			description: 'Search only tracks',
			default: false
		},
		limit: {
			type: 'number',
			description: 'Limit number of results per category'
		},
		json: {
			type: 'boolean',
			description: 'Output as JSON',
			default: false
		}
	},
	examples: [
		'r4 search ambient --channels',
		'r4 search ko002 --channels',
		'r4 search "electronic music" --tracks',
		'r4 search ambient --tracks --limit 10'
	],
	async handler({args, flags}) {
		const query = args.query
		const {channels, tracks, limit} = flags

		// Validate: can't specify both channels and tracks
		if (channels && tracks) {
			throw new Error('Cannot specify both --channels and --tracks')
		}

		const options = {limit}

		try {
			if (channels) {
				// Search only channels
				const results = await searchChannels(query, options)
				return {data: results, format: 'json'}
			} else if (tracks) {
				// Search only tracks
				const results = await searchTracks(query, options)
				return {data: results, format: 'json'}
			} else {
				// Search both (default behavior)
				const results = await searchAll(query, options)
				return {data: results, format: 'json'}
			}
		} catch (error) {
			throw new Error(`Search failed: ${error.message}`)
		}
	}
}
