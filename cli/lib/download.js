import {spawn} from 'node:child_process'
import {existsSync} from 'node:fs'
import {mkdir} from 'node:fs/promises'
import ffmetadata from 'ffmetadata'
import filenamify from 'filenamify'
import getArtistTitle from 'get-artist-title'

/**
 * Download pipeline for Radio4000 tracks
 * Pure functional approach - each function does one thing well
 */

// ============================================================================
// Pipeline: Prepare → Filter → Download → Report
// ============================================================================

/**
 * Prepare tracks with filesystem metadata
 * Enriches track objects with file paths and existence status
 */
export function prepareTracks(tracks, folderPath) {
	return tracks.map((track) => ({
		...track,
		filename: toFilename(track),
		filepath: toFilepath(track, folderPath),
		fileExists: existsSync(toFilepath(track, folderPath))
	}))
}

/**
 * Filter tracks into download pipeline stages
 * Returns categorized track lists for reporting and processing
 */
export function filterTracks(tracks, {force = false} = {}) {
	const unavailable = tracks.filter((t) => t.mediaNotAvailable)
	const existing = tracks.filter((t) => t.fileExists)
	const toDownload = force
		? tracks
		: tracks.filter((t) => !t.mediaNotAvailable && !t.fileExists)

	return {unavailable, existing, toDownload}
}

/**
 * Download a batch of tracks with progress reporting
 * Returns summary of successes and failures
 */
export async function downloadBatch(tracks, folderPath, options = {}) {
	const {dryRun = false, debug = false, writeMetadata = true} = options
	const successes = []
	const failures = []

	for (const [index, track] of tracks.entries()) {
		const progress = `[${index + 1}/${tracks.length}]`

		try {
			if (dryRun) {
				console.log(progress, 'Would download:', track.title)
				successes.push(track)
				continue
			}

			await downloadTrack(track, folderPath, {debug})

			// Write metadata if enabled
			if (writeMetadata) {
				await writeTrackMetadata(track, {debug})
			}

			console.log(progress, 'Downloaded:', track.filepath)
			successes.push(track)
		} catch (error) {
			console.error(progress, 'Failed:', track.title)
			debug && console.error(error.message)
			failures.push({track, error: error.message})
		}
	}

	return {successes, failures}
}

/**
 * Complete download pipeline for a channel
 * Orchestrates: prepare → filter → download → report
 */
export async function downloadChannel(tracks, folderPath, options = {}) {
	const {force = false, dryRun = false, debug = false} = options

	// Ensure folder exists
	if (!dryRun) {
		await mkdir(folderPath, {recursive: true})
	}

	// Pipeline: Prepare
	const prepared = prepareTracks(tracks, folderPath)

	// Pipeline: Filter
	const {unavailable, existing, toDownload} = filterTracks(prepared, {force})

	// Report what we found
	console.log('Total tracks:', tracks.length)
	console.log('  Unavailable:', unavailable.length)
	console.log('  Already exists:', existing.length)
	console.log('  To download:', toDownload.length)
	console.log()

	// Pipeline: Download
	const {successes, failures} = await downloadBatch(toDownload, folderPath, {
		dryRun,
		debug,
		writeMetadata: options.writeMetadata !== false // default true
	})

	// Pipeline: Report
	return {
		total: tracks.length,
		unavailable: unavailable.length,
		existing: existing.length,
		downloaded: successes.length,
		failed: failures.length,
		failures
	}
}

// ============================================================================
// Core Download Functions
// ============================================================================

/**
 * Download a single track using yt-dlp
 * Spawns yt-dlp process and handles output/errors
 */
export async function downloadTrack(track, folderPath, {debug = false} = {}) {
	const filename = toFilename(track)
	const extension = toExtension(track)

	const args = [
		'--extract-audio',
		`--format=bestaudio[ext=${extension}]/best[ext=mp4]/best`,
		'--embed-metadata',
		'--no-playlist',
		`--paths=${folderPath}`,
		`--output=${filename}.%(ext)s`,
		track.url
	]

	if (!debug) {
		args.push('--quiet')
	}

	return spawnYtDlp(args, {debug})
}

/**
 * Spawn yt-dlp process
 * Returns a promise that resolves/rejects based on exit code
 */
function spawnYtDlp(args, {debug = false} = {}) {
	return new Promise((resolve, reject) => {
		const process = spawn('yt-dlp', args)
		const errors = []

		if (debug) {
			process.stdout.on('data', (data) => {
				console.log('[yt-dlp]', data.toString())
			})
		}

		process.stderr.on('data', (data) => {
			errors.push(data.toString())
		})

		process.on('close', (code) => {
			if (code === 0) {
				resolve()
			} else {
				reject(
					new Error(errors.join('\n') || `yt-dlp exited with code ${code}`)
				)
			}
		})

		process.on('error', reject)
	})
}

// ============================================================================
// Metadata Utilities
// ============================================================================

/**
 * Write metadata to downloaded track file
 * Extracts artist/title and embeds track description
 */
export async function writeTrackMetadata(track, {debug = false} = {}) {
	if (!track.filepath || !existsSync(track.filepath)) {
		throw new Error(`File not found: ${track.filepath}`)
	}

	// Extract artist and title from track.title
	const artistTitle = getArtistTitle(track.title)
	const [artist, title] = artistTitle || [null, null]

	if (!artistTitle && debug) {
		console.log('Could not parse artist/title from:', track.title)
	}

	// Build description from track body and discogs URL
	let description = ''
	if (track.body || track.discogs_url) {
		const parts = [track.body, track.discogs_url].filter(Boolean)
		description = parts.join('; ')
	}

	// Metadata to write
	const metadata = {
		artist: artist || '',
		title: title || track.title,
		description: description || '',
		comment: '' // Empty comment overwrites yt-dlp defaults
	}

	return new Promise((resolve, reject) => {
		ffmetadata.write(track.filepath, metadata, (error) => {
			if (error) {
				return reject(error)
			}
			resolve()
		})
	})
}

// ============================================================================
// Filename Utilities
// ============================================================================

/**
 * Extract YouTube video ID from URL
 * Supports various YouTube URL formats
 */
export function extractYouTubeId(url) {
	if (!url) return null

	const patterns = [
		/(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\/?\?(?:\S*?&?v=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/
	]

	for (const pattern of patterns) {
		const match = url.match(pattern)
		if (match) return match[1]
	}

	return null
}

/**
 * Detect media provider from URL
 * Returns 'youtube', 'soundcloud', or null
 */
export function detectMediaProvider(url) {
	if (!url) return null
	if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
	if (url.includes('soundcloud.com')) return 'soundcloud'
	return null
}

/**
 * Create safe filename from track (no path, no extension)
 * This is the canonical filename function
 * Format: "Track Title [youtube-id]"
 */
export function toFilename(track) {
	if (!track.title || typeof track.title !== 'string') {
		throw new Error(`Invalid track title: ${JSON.stringify(track.title)}`)
	}

	// Sanitize title first
	const cleanTitle = filenamify(track.title, {
		maxLength: 180 // Leave room for ID suffix
	})

	// Add YouTube ID suffix if available (for uniqueness)
	const ytId = extractYouTubeId(track.url)
	if (ytId) {
		return `${cleanTitle} [${ytId}]`
	}

	return cleanTitle
}

/**
 * Get file extension based on media provider
 * SoundCloud uses mp3, YouTube/others use m4a
 */
export function toExtension(track) {
	if (track.extension) {
		return track.extension
	}

	const provider = detectMediaProvider(track.url)
	return provider === 'soundcloud' ? 'mp3' : 'm4a'
}

/**
 * Create full filepath for track
 * Combines folder, filename, and extension
 */
export function toFilepath(track, folderPath) {
	const filename = toFilename(track)
	const extension = toExtension(track)
	return `${folderPath}/${filename}.${extension}`
}
