import {mkdir, readFile, unlink, writeFile} from 'node:fs/promises'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {sdk} from '@radio4000/sdk'

const CREDS_DIR = join(homedir(), '.config', 'radio4000', 'cli')
const CREDS_FILE = join(CREDS_DIR, 'credentials.json')

/**
 * Save authentication session to disk
 */
export async function saveSession(session) {
	await mkdir(CREDS_DIR, {recursive: true})

	const credentials = {
		access_token: session.access_token,
		refresh_token: session.refresh_token,
		expires_at: session.expires_at,
		user: {
			id: session.user.id,
			email: session.user.email
		},
		created_at: new Date().toISOString()
	}

	await writeFile(CREDS_FILE, JSON.stringify(credentials, null, 2))
	return credentials
}

/**
 * Load authentication session from disk
 */
export async function loadSession() {
	try {
		const content = await readFile(CREDS_FILE, 'utf-8')
		return JSON.parse(content)
	} catch {
		return null
	}
}

/**
 * Clear saved authentication session
 */
export async function clearSession() {
	try {
		await unlink(CREDS_FILE)
		return true
	} catch {
		return false
	}
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session) {
	if (!session?.expires_at) return true
	return Date.now() / 1000 > session.expires_at
}

/**
 * Get valid session (auto-refresh if needed)
 */
export async function getValidSession() {
	const session = await loadSession()
	if (!session) return null

	// If not expired, use as-is
	if (!isSessionExpired(session)) {
		return session
	}

	// Try to refresh
	const {data, error} = await sdk.supabase.auth.setSession({
		access_token: session.access_token,
		refresh_token: session.refresh_token
	})

	if (error || !data.session) {
		// Refresh failed, clear invalid session
		await clearSession()
		return null
	}

	// Save refreshed session
	await saveSession(data.session)
	return data.session
}

/**
 * Get current authenticated user (returns null if not logged in)
 */
export async function getCurrentUser() {
	const session = await getValidSession()
	if (!session) return null

	const {data, error} = await sdk.supabase.auth.getUser(session.access_token)
	if (error) return null

	return data.user
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
	const session = await getValidSession()
	return session !== null
}
