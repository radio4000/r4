import * as config from '../../lib/config.js'
import {formatJSON} from '../../lib/formatters.js'

export default {
	description: 'Clear local session',

	async run() {
		await config.update({auth: {session: null}})
		return formatJSON({cleared: true})
	},

	examples: ['r4 auth logout']
}
