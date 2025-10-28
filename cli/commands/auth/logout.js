import {sdk} from '@radio4000/sdk'
import {clearSession, loadSession} from '../../lib/auth.js'

export default {
	description: 'Sign out from Radio4000',

	handler: async () => {
		const session = await loadSession()

		if (!session) {
			console.error('Not logged in')
			return {
				data: {success: false, message: 'Not logged in'},
				format: 'json'
			}
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
		console.error(
			'Session cleared from ~/.config/radio4000/cli/credentials.json'
		)

		return {
			data: {success: true, message: 'Signed out successfully'},
			format: 'json'
		}
	},

	examples: ['r4 auth logout']
}
