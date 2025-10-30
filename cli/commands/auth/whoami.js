import {getCurrentUser, isSessionExpired, loadSession} from '../../lib/auth.js'
import {formatJSON} from '../../lib/formatters.js'

export default {
	description: 'Show current authenticated user',

	handler: async () => {
		const session = await loadSession()

		if (!session) {
			console.error('Not authenticated. Run: r4 auth login')
			return formatJSON({
				authenticated: false,
				message: 'Not authenticated'
			})
		}

		const expired = isSessionExpired(session)
		if (expired) {
			console.error('Session expired. Run: r4 auth login')
			return formatJSON({
				authenticated: false,
				message: 'Session expired'
			})
		}

		const user = await getCurrentUser()

		if (!user) {
			console.error('Failed to fetch user')
			return formatJSON({
				authenticated: false,
				message: 'Failed to fetch user'
			})
		}

		console.error(`Logged in as ${user.email} (${user.id})`)

		return formatJSON({
			authenticated: true,
			user: {
				id: user.id,
				email: user.email,
				created_at: user.created_at
			},
			session: {
				expires_at: session.expires_at,
				created_at: session.created_at
			}
		})
	},

	examples: ['r4 auth whoami']
}
