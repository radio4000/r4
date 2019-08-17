const fs = require('fs')
const ffmetadata = require('ffmetadata')
const sanitizeFilename = require("sanitize-filename");
const spawn = require('child_process').spawn
const getArtistTitle = require('get-artist-title')

const downloadTracks = async (tracks, downloadFolderName) => {
	const fileExtension = 'm4a'

	// for each track to download, download and edit its data
	for (let index = 0; index < tracks.length; index++) {
		const currentTrack = tracks[index]
		const trackFilePath = `./${downloadFolderName}/${currentTrack.id}.${fileExtension}`
		const fileName = sanitizeFilename(currentTrack.title)
		const newTrackFilePath = `./${downloadFolderName}/${fileName}.${fileExtension}`

		console.log('Downloading track:', currentTrack.title, currentTrack.url)

		await downloadTrack(currentTrack.url, trackFilePath, fileExtension)

		await addTrackMetadata(trackFilePath, newTrackFilePath, currentTrack)

		await renameTrack(trackFilePath, newTrackFilePath)

		console.log('Downloaded track:', newTrackFilePath)
  }
}

// add meta data
// and overwrite the one we don't want
const addTrackMetadata = async (trackFilePath, newTrackFilePath, track) => {
	const [ artist, title ] = getArtistTitle(track.title)

	var newMetaData = {
		artist,
		title,
		description: track.body || '',
		comment: ''
	}

	// return a promise to be be manage async
	return new Promise(resolve => {
		return ffmetadata.write(trackFilePath, newMetaData, (metaDataWriteError) => {
			if (metaDataWriteError) {
				console.error('Error writing metadata', metaDataError)
			}
			resolve()
		})
	})
}

// rename file to ./channel/r4-track-title.ext
// this will overwite wxisting file
const renameTrack = async (oldTrackFilePath, newTrackFilePath) => {
	await fs.renameSync(oldTrackFilePath, newTrackFilePath)
}

// use youtube-dl on a media
// and save it to a provided location
const downloadTrack = (trackUrl, trackFilePath, fileExt) => {
	const defaultOptions = [
		'--no-playlist', // If URL points to a video in a playlist, only take the video
		'--no-warnings',
		`--format=bestaudio[ext=${fileExt}]/best[ext=mp4]/best`,
		'--extract-audio',
		`--output=${trackFilePath}`,
		'--no-call-home',
		'--ignore-errors', // Continue on errors
		'--audio-quality=0',
		'--add-metadata'
		// 'write-thumbnail ',
	]
	// put media url to download at the end of the options
	const opts = defaultOptions.concat(trackUrl)

	return new Promise(resolve => {
		const cmd = spawn('youtube-dl', opts)
		cmd.stdout.on('data', data => {
			console.log(`${data}`)
		})

		cmd.stderr.on('data', data => {
			console.error(`${data}`)
		})

		cmd.on('close', () => {
			resolve(cmd)
		})
	})
}


module.exports = downloadTracks
