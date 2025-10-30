import {sdk} from '@radio4000/sdk'
import {clearSession, loadSession} from '../../lib/auth.js'
import {formatJSON} from '../../lib/formatters.js'

export default {
	description: 'Sign out from Radio4000',

	handler: async () => {
		const session = await loadSession()

		if (!session) {
			console.error('Not logged in')
			return formatJSON({success: false, message: 'Not logged in'})
		}

		// Sign out from Supabase (invalidate session on server)
		try {
			await sdk.supabase.auth.setSession({
				access_token: session.access_token,
				refresh_token: session.refresh_token
			})
			await sdk.auth.signOut()
		} catch {
			// If server signout fails, still clear local session
		}

		// Clear local session
		await clearSession()

		console.error('Signed out successfully')
		console.error('Session cleared from ~/.config/radio4000/config.json')

		return formatJSON({success: true, message: 'Signed out successfully'})
	},

	examples: ['r4 auth logout']
}
