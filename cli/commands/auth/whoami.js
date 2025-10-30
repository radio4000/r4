import {loadSession} from '../../lib/auth.js'
import {formatJSON} from '../../lib/formatters.js'

export default {
	description: 'Show current session',

	handler: async () => {
		const session = await loadSession()
		return formatJSON(session)
	},

	examples: ['r4 auth whoami']
}
