import * as config from '../../lib/config.js'
import {formatJSON} from '../../lib/formatters.js'

export default {
	description: 'Clear local session',

	handler: async () => {
		await config.update({auth: {session: null}})
		return formatJSON({cleared: true})
	},

	examples: ['r4 auth logout']
}
