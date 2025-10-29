import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {homedir} from 'node:os'
import {join} from 'node:path'

const CONFIG_DIR = join(homedir(), '.config', 'radio4000')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

/**
 * Default config structure
 */
const DEFAULT_CONFIG = {
	auth: {
		session: null
	}
}

/**
 * Load config from disk
 */
export async function loadConfig() {
	try {
		const content = await readFile(CONFIG_FILE, 'utf-8')
		return {...DEFAULT_CONFIG, ...JSON.parse(content)}
	} catch {
		return DEFAULT_CONFIG
	}
}

/**
 * Save config to disk
 */
export async function saveConfig(config) {
	await mkdir(CONFIG_DIR, {recursive: true})
	await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))
	return config
}

/**
 * Update config (partial update)
 */
export async function updateConfig(updates) {
	const config = await loadConfig()
	const updated = {
		...config,
		...updates,
		// Deep merge for auth object only
		auth: updates.auth ? {...config.auth, ...updates.auth} : config.auth
	}
	return saveConfig(updated)
}
