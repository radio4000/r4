import * as config from '../../lib/config.js'
import {formatJSON} from '../../lib/formatters.js'

export default {
	description: 'Show current session',

	async run() {
		const data = await config.load()
		const session = data.auth?.session || null
		return formatJSON(session)
	},

	examples: ['r4 auth whoami']
}
