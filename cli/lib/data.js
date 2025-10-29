import {readFile} from 'node:fs/promises'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {sdk} from '@radio4000/sdk'
import fuzzysort from 'fuzzysort'
import {getValidSession} from './auth.js'
import {channelSchema, trackSchema} from './schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// V1 data paths
const V1_CHANNELS_PATH = resolve(__dirname, '../data/channels_v1.json')
const V1_TRACKS_PATH = resolve(__dirname, '../data/tracks_v1.json')

// Cache for v1 data
let v1ChannelsCache = null
let v1TracksCache = null

// ===== HELPERS =====

const parse = (schema, source) => (item) => schema.parse({...item, source})

const tryParse = (schema, source) => (item) => {
	try {
		return parse(schema, source)(item)
	} catch {
		return null
	}
}

const v2WithV1Fallback = async (v2Fn, v1Data, combiner) => {
	try {
		const v2Result = await v2Fn()
		return combiner ? combiner(v2Result, v1Data) : v2Result
	} catch {
		return v1Data
	}
}

const channelNotFound = (slugs) => {
	const error = new Error(
		`Channel${slugs.length > 1 ? 's' : ''} not found: ${slugs.join(', ')}`
	)
	error.code = 'CHANNEL_NOT_FOUND'
	error.statusCode = 404
	return error
}

const rejectV1Mutation = (type, id) => {
	throw new Error(
		`Cannot modify v1 ${type}: ${id}. This is a read-only archived ${type}.`
	)
}

const limit = (items, n) => (n ? items.slice(0, n) : items)

// ===== V1 DATA LOADERS =====

export async function loadV1Channels() {
	if (v1ChannelsCache) return v1ChannelsCache
	const content = await readFile(V1_CHANNELS_PATH, 'utf-8')
	v1ChannelsCache = JSON.parse(content).map(parse(channelSchema, 'v1'))
	return v1ChannelsCache
}

export async function loadV1Tracks() {
	if (v1TracksCache) return v1TracksCache
	const content = await readFile(V1_TRACKS_PATH, 'utf-8')
	v1TracksCache = JSON.parse(content)
		.map(tryParse(trackSchema, 'v1'))
		.filter(Boolean)
	return v1TracksCache
}

// ===== AUTH HELPERS =====

export async function getAuthToken() {
	const session = await getValidSession()
	return session?.access_token || null
}

export async function requireAuth() {
	const session = await getValidSession()

	if (!session) {
		throw new Error('Authentication required. Run: r4 auth login')
	}

	// Set the session in SDK
	await sdk.supabase.auth.setSession({
		access_token: session.access_token,
		refresh_token: session.refresh_token
	})

	return session.access_token
}

// ===== CHANNEL OPERATIONS =====

export async function listChannels(options = {}) {
	const v1Channels = await loadV1Channels()

	return v2WithV1Fallback(
		async () => {
			const {data, error} = await sdk.channels.readChannels()
			if (error) throw new Error(error)
			return data.map(parse(channelSchema, 'v2'))
		},
		limit(v1Channels, options.limit),
		(v2Channels, v1) => {
			const v2Slugs = new Set(v2Channels.map((ch) => ch.slug))
			return limit(
				[...v2Channels, ...v1.filter((ch) => !v2Slugs.has(ch.slug))],
				options.limit
			)
		}
	)
}

export async function getChannel(slug) {
	try {
		const {data, error} = await sdk.channels.readChannel(slug)
		if (error) throw new Error(error)
		return parse(channelSchema, 'v2')(data)
	} catch {
		const channel = (await loadV1Channels()).find((ch) => ch.slug === slug)
		if (!channel) throw new Error(`Channel not found: ${slug}`)
		return channel
	}
}

export async function createChannel(data) {
	await requireAuth()
	const {data: channel, error} = await sdk.channels.createChannel(data)
	if (error) throw new Error(error)
	return parse(channelSchema, 'v2')(channel)
}

export async function updateChannel(slug, updates) {
	await requireAuth()
	const channel = await getChannel(slug)
	if (channel.source === 'v1') rejectV1Mutation('channel', slug)

	const {data, error} = await sdk.channels.updateChannel(channel.id, updates)
	if (error) throw new Error(error)
	return parse(channelSchema, 'v2')(data)
}

export async function deleteChannel(slug) {
	await requireAuth()
	const channel = await getChannel(slug)
	if (channel.source === 'v1') rejectV1Mutation('channel', slug)

	const {error} = await sdk.channels.deleteChannel(channel.id)
	if (error) throw new Error(error)
	return {success: true, slug}
}

// ===== TRACK OPERATIONS =====

const fetchChannelTracks = async (slug) => {
	const {data, error} = await sdk.channels.readChannelTracks(slug)
	if (error) throw new Error(error)
	return data
}

const logInvalidTracks = (tracks) => {
	if (tracks.length === 0) return
	console.error(`Warning: Skipped ${tracks.length} invalid track(s):`)
	tracks.forEach((t) => {
		console.error(`  "${t.title}"`)
		console.error(`    URL: ${t.url}`)
		console.error(`    Reason: ${t.error}`)
		console.error(`    Fix: r4 track edit ${t.id}`)
	})
}

export async function listTracks(options = {}) {
	const {channelSlugs, limit: maxItems} = options

	if (!channelSlugs?.length) {
		throw new Error(
			'channelSlugs required. Specify at least one channel to list tracks from.'
		)
	}

	const v1Tracks = await loadV1Tracks()
	const v1Slugs = new Set((await loadV1Channels()).map((ch) => ch.slug))

	const validateChannels = (v2Slugs = new Set()) => {
		const missing = channelSlugs.filter(
			(s) => !v1Slugs.has(s) && !v2Slugs.has(s)
		)
		if (missing.length) throw channelNotFound(missing)
	}

	try {
		const {data: v2Data} = await sdk.channels.readChannels()
		const v2Slugs = new Set(v2Data?.map((ch) => ch.slug) || [])
		validateChannels(v2Slugs)

		const rawTracks = (
			await Promise.all(channelSlugs.map(fetchChannelTracks))
		).flat()
		const invalidTracks = []

		const v2Tracks = rawTracks
			.map((tr) => {
				try {
					return parse(trackSchema, 'v2')(tr)
				} catch (error) {
					invalidTracks.push({
						id: tr.id,
						title: tr.title,
						url: tr.url,
						error: error.errors?.[0]?.message || error.message
					})
					return null
				}
			})
			.filter(Boolean)

		logInvalidTracks(invalidTracks)

		return limit(
			[...v2Tracks, ...v1Tracks].filter((tr) => channelSlugs.includes(tr.slug)),
			maxItems
		)
	} catch (error) {
		if (error.code === 'CHANNEL_NOT_FOUND') throw error
		validateChannels()
		return limit(
			v1Tracks.filter((tr) => channelSlugs.includes(tr.slug)),
			maxItems
		)
	}
}

export async function getTrack(id) {
	try {
		const {data, error} = await sdk.tracks.readTrack(id)
		if (error) throw new Error(error)
		return parse(trackSchema, 'v2')(data)
	} catch {
		const track = (await loadV1Tracks()).find((tr) => tr.id === id)
		if (!track) throw new Error(`Track not found: ${id}`)
		return track
	}
}

export async function createTrack(data) {
	await requireAuth()

	const channelId =
		data.channel_id || (data.slug ? (await getChannel(data.slug)).id : null)
	if (!channelId) throw new Error('channel_id or channel slug required')

	const {data: track, error} = await sdk.tracks.createTrack(channelId, data)
	if (error) throw new Error(error)
	return parse(trackSchema, 'v2')(track)
}

export async function updateTrack(id, updates) {
	await requireAuth()
	const track = await getTrack(id)
	if (track.source === 'v1') rejectV1Mutation('track', id)

	const {data, error} = await sdk.tracks.updateTrack(id, updates)
	if (error) throw new Error(error)
	return parse(trackSchema, 'v2')(data)
}

export async function deleteTrack(id) {
	await requireAuth()
	const track = await getTrack(id)
	if (track.source === 'v1') rejectV1Mutation('track', id)

	const {error} = await sdk.tracks.deleteTrack(id)
	if (error) throw new Error(error)
	return {success: true, id}
}

// ===== SEARCH OPERATIONS =====

const fuzzySearch = (query, items, keys, options) =>
	fuzzysort
		.go(query, items, {
			keys,
			threshold: options.threshold || -10000,
			all: false,
			limit: options.limit
		})
		.map((r) => r.obj)

export async function searchChannels(query, options = {}) {
	const v1Channels = await loadV1Channels()
	const keys = ['slug', 'name', 'description']

	return v2WithV1Fallback(
		async () => {
			const {data, error} = await sdk.supabase
				.from('channels')
				.select()
				.textSearch('fts', `'${query}':*`)
			if (error) throw new Error(error.message)
			return data.map(parse(channelSchema, 'v2'))
		},
		fuzzySearch(query, v1Channels, keys, options),
		(v2Results, v1Results) => {
			const v2Slugs = new Set(v2Results.map((ch) => ch.slug))
			return limit(
				[...v2Results, ...v1Results.filter((ch) => !v2Slugs.has(ch.slug))],
				options.limit
			)
		}
	)
}

export async function searchTracks(query, options = {}) {
	const v1Tracks = await loadV1Tracks()
	const keys = ['title', 'description']

	return v2WithV1Fallback(
		async () => {
			const {data, error} = await sdk.supabase
				.from('channel_tracks')
				.select()
				.textSearch('fts', `'${query}':*`)
			if (error) throw new Error(error.message)
			return data.map(parse(trackSchema, 'v2'))
		},
		fuzzySearch(query, v1Tracks, keys, options),
		(v2Results, v1Results) => limit([...v2Results, ...v1Results], options.limit)
	)
}

export async function searchAll(query, options = {}) {
	const [channels, tracks] = await Promise.all([
		searchChannels(query, options),
		searchTracks(query, options)
	])
	return {channels, tracks}
}
