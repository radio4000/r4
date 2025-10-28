/**
 * Prototype: Test Supabase email OTP auth in Node.js CLI
 *
 * Run: node prototype-magic-link.js your@email.com
 *
 * NOTE: You need to configure the OTP email template in Supabase dashboard:
 * Auth > Email Templates > Magic Link
 * Add: <p>Your code: {{ .Token }}</p>
 */

import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createInterface} from 'node:readline/promises'
import {sdk} from '@radio4000/sdk'

const CREDS_DIR = join(homedir(), '.r4')
const CREDS_FILE = join(CREDS_DIR, 'credentials.json')

async function sendOtpCode(email) {
	console.log(`\nSending verification code to: ${email}`)

	// Use the Supabase client directly since SDK doesn't expose OTP yet
	const {error} = await sdk.supabase.auth.signInWithOtp({
		email,
		options: {
			shouldCreateUser: false // Only allow existing users
		}
	})

	if (error) {
		console.error('Error:', error.message)
		return false
	}

	console.log('\n✓ Verification code sent!')
	console.log('Check your email for a 6-digit code.\n')
	return true
}

async function promptForCode() {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout
	})

	const code = await rl.question('Enter the 6-digit code from your email: ')
	rl.close()

	return code.trim()
}

async function verifyOtpCode(email, token) {
	console.log('\nVerifying code...')

	const {data, error} = await sdk.supabase.auth.verifyOtp({
		email,
		token,
		type: 'email'
	})

	if (error) {
		console.error('Error:', error.message)
		return null
	}

	if (!data.session) {
		console.error('No session returned - code may be invalid or expired')
		return null
	}

	console.log('✓ Code verified!')
	return data.session
}

async function saveSession(session) {
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
	console.log(`\nCredentials saved to: ${CREDS_FILE}`)
	console.log(`User: ${session.user.email}`)
}

async function loadSession() {
	try {
		const content = await readFile(CREDS_FILE, 'utf-8')
		return JSON.parse(content)
	} catch {
		return null
	}
}

async function testExistingSession() {
	const creds = await loadSession()
	if (!creds) {
		console.log('No saved credentials found')
		return false
	}

	console.log('\nTesting existing session...')
	console.log(`Saved user: ${creds.user.email}`)

	// Try to use the token
	const {data, error} = await sdk.supabase.auth.setSession({
		access_token: creds.access_token,
		refresh_token: creds.refresh_token
	})

	if (error) {
		console.error('Session invalid:', error.message)
		return false
	}

	console.log('✓ Session is valid!')
	console.log(`User ID: ${data.user.id}`)
	return true
}

// Main flow
async function main() {
	const args = process.argv.slice(2)
	const command = args[0]

	// Test existing session
	if (command === 'test') {
		await testExistingSession()
		process.exit(0)
	}

	// Login flow
	if (!command || !command.includes('@')) {
		console.log('Usage:')
		console.log('  node prototype-magic-link.js your@email.com')
		console.log('  node prototype-magic-link.js test')
		process.exit(1)
	}

	const email = command

	// Step 1: Send OTP code
	const sent = await sendOtpCode(email)
	if (!sent) {
		process.exit(1)
	}

	// Step 2: Prompt user to enter code
	const code = await promptForCode()
	if (!code) {
		console.error('No code entered')
		process.exit(1)
	}

	// Step 3: Verify code and get session
	const session = await verifyOtpCode(email, code)
	if (!session) {
		console.error('\n✗ Login failed')
		process.exit(1)
	}

	// Step 4: Save session
	await saveSession(session)
	console.log('\n✓ Login successful!')
}

main()
