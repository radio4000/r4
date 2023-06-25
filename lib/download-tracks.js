const spawn = require('child_process').spawn
const fs = require('fs')
const ffmetadata = require('ffmetadata')
const sanitizeFilename = require('sanitize-filename')
const getArtistTitle = require('get-artist-title')
const {mediaUrlParser} = require('media-url-parser')

const downloadTracks = async (tracks, downloadFolderName, options = {}) => {
	const {debugOutput, forceDownload, forceMediaAvailableCheck} = options

	console.log(tracks.length, 'tracks')

	// For each track to download, download and edit its data
	// We first save the track by its r4-id, so it is easier to manipulate
	// Finally we rename it to the user defined title in r4
	for (let index = 0; index < tracks.length; index++) {
		const currentTrack = tracks[index]
		const parsedTrack = mediaUrlParser(currentTrack.url)

		const fileExtension = function() {
			if (parsedTrack.provider === 'soundcloud') return 'mp3'
			return 'm4a'
		}()

		const trackFilePath = `./${downloadFolderName}/${currentTrack.id}.${fileExtension}`
		const fileName = sanitizeFilename(currentTrack.title)
		const newTrackFilePath = `./${downloadFolderName}/${fileName}.${fileExtension}`

		const mediaNotAvailable = currentTrack.mediaNotAvailable
		const fileExists = fs.existsSync(newTrackFilePath)

		const shouldDownload = () => {
			if (forceDownload) return true
			if (forceMediaAvailableCheck && !fileExists) {
				debugOutput && console.log('Media available check forced', newTrackFilePath)
				return true
			}
			if (mediaNotAvailable) {
				debugOutput && console.log('Media marked as not available, skiping download', newTrackFilePath)
				return false
			}
			if (fileExists) {
				debugOutput && console.log('Track exists, not downloading', newTrackFilePath)
				return false
			}
			// if not stated otherwise, should always fetch missing local media
			return true
		}

		if (shouldDownload()) {
			const trackToDownload = {
				origin: currentTrack.url,
				destination: trackFilePath,
				extension: fileExtension,
				debug: debugOutput
			}

			/* eslint-disable no-await-in-loop */
			// https://eslint.org/docs/rules/no-await-in-loop#when-not-to-use-it
			try {
				if (debugOutput) {
					console.log('Fetching', trackToDownload.origin, newTrackFilePath)
				}
				await downloadTrack(trackToDownload)
			} catch (error) {
				console.log('Warning: could not download track', newTrackFilePath, error)
				// This is to skip the following code of this for loop occurence
				// So not add metadata etc.
				continue
			}

			try {
				await addTrackMetadata({
					trackFilePath,
					newTrackFilePath,
					track: currentTrack,
					debug: debugOutput
				})
			} catch (error) {
				console.log(`Error editing metadata for ${fileExtension} file`, error)
			}

			try {
				await renameTrack(trackFilePath, newTrackFilePath)
			} catch (error) {
				debugOutput && console.log(`Error renaming ${fileExtension} track`, error)
			}
			/* eslint-enable no-await-in-loop */

			// Index + 1, since we start from 0 till tracks.length in the for loop abv
			console.log(`${index + 1}/${tracks.length}`, 'Saved', newTrackFilePath)
		}
	}
}

// Add meta data
// And overwrite the one we don't want
const addTrackMetadata = async ({trackFilePath, newTrackFilePath, track, debug}) => {
	let description
	let artistTitle = getArtistTitle(track.title) || []
	const [artist, title] = artistTitle

	if (!artistTitle) {
		debug && console.log('Could not find media artist/title from track.title')
	}

	// Create a description
	if (track.body || track.discogsUrl) {
		const discogsUrl = track.discogsUrl || ''
		description = `${track.body}; ${discogsUrl}`.trim()
	}

	// See https://www.npmjs.com/package/ffmetadata#metadata
	// Seems `comment` as empty string is necessary,
	// To overwrite descriptions
	const newMetaData = {
		artist,
		title,
		description: description || '',
		comment: ''
	}

	// Return a promise to be be manage async
	return new Promise(resolve => {
		return ffmetadata.write(trackFilePath, newMetaData, metaDataWriteError => {
			if (metaDataWriteError) return metaDataWriteError
			return resolve()
		})
	})
}

// Rename file to ./channel/r4-track-title.ext
// This will overwite wxisting file
const renameTrack = async (oldTrackFilePath, newTrackFilePath) => {
	await fs.renameSync(oldTrackFilePath, newTrackFilePath)
}

// Use youtube-dl on a media
// and save it to a provided location
// Doc: origin=url, destination=path minus ext, extension=file extension, debug=shouldDebug
const downloadTrack = ({origin, destination, extension, debug}) => {
	const defaultOptions = [
		'--extract-audio', // audio-only
		// '--audio-format m4a',
		'-f "ba[ext=m4a]/b[ext=mp4] / ba/b"',
		// '--audio-quality=0', // not specifying a quality should result in highest possible
		'--embed-metadata',
		'--no-playlist', // If URL points to a playlist, download only the video
		// '--no-warnings',
		// `--format=bestaudio[ext=${extension}]/best[ext=mp4]/best`,
		// '--ignore-errors', // Continue on errors
		`--paths=${destination}`,
	]
	// Put media url to download at the end of the options
	const opts = defaultOptions.concat(origin)

	return new Promise((resolve, reject) => {
		const cmd = spawn('yt-dlp', opts)
		cmd.stdout.on('data', data => {
			if (debug) {
				console.log(`${data}`)
			}
		})
		cmd.stderr.on('data', data => {
			if (debug) {
				console.error(`${data}`)
			}
			reject(data)
		})
		cmd.on('close', () => {
			resolve(cmd)
		})
	})
}

module.exports = downloadTracks
