const spawn = require('child_process').spawn

const downloadTracks = async (tracks, downloadFolderName) => {
	for (let index = 0; index < tracks.length; index++) {
		const currentTrack = tracks[index]
		console.log('Downloading track:', currentTrack.title, currentTrack.url)
		await downloadTrack(currentTrack, downloadFolderName)
  }
}

const downloadTrack = (track, downloadFolderName) => {
	const defaultOptions = [
		'--no-playlist', // If URL points to a video in a playlist, only take the video
		'--no-warnings',
		'--format=bestaudio[ext=m4a]/best[ext=mp4]/best',
		'--extract-audio',
		`--output=./${downloadFolderName}/${track.title} [${track.id}].%(ext)s`,
		'--no-call-home',
		'--ignore-errors', // Continue on errors
		'--audio-quality=0',
		'--add-metadata'
		// 'write-thumbnail ',
	]
	// put media url to download at the end of the options
	const opts = defaultOptions.concat(track.url)

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
