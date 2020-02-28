#!/usr/bin/env node

const os = require('os')
const args = require('args')
const fs = require('fs-extra')
const path = require('path')
const {
	tagsFromString,
	uniqueTagsFromList
} = require('radio4000-sdk')

args
	.option('sorted', 'List all tags, and order them by occurence')
	.option('generate', 'Generate the tags folder structure for a channel')
	.example('r4 tags a-channel', 'List the tags for the channel with the slug "a-channel"')
	.example('r4 tags a-channel --sorted', 'Sorted list (most occurence) of the tags for the channel with the slug "a-channel"')

const flags = args.parse(process.argv, {
	version: false,
	value: 'channel-slug',
	mainColor: ['reset']
})

if (args.sub.length === 0) {
	args.showHelp()
}

let slug = args.sub[0] || ''


// util
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

// With async/await:
async function readChannelData(channelSlug) {
	let channelData
  try {
    channelData = await fs.readJson(`./${channelSlug}/${channelSlug}.json`)
  } catch (error) {
		console.log(`Missing file at ./${channelSlug}/${channelSlug}.json; See command: r4 init --help`)
		return
  }
	return channelData
}

const showChannelTags = (channelData) => {
	if (!channelData || !channelData.tracks.length) return
	const t = uniqueTagsFromList(channelData.tracks)
	t.tags.forEach(tag => console.log(tag))
}

const showSortedChannelTags = (channelData) => {
	if (!channelData || !channelData.tracks.length) return
	const t = uniqueTagsFromList(channelData.tracks)
	t.sortedTags.forEach(tag => console.log(tag[1], tag[0]))
}

const generateFolderStructure = async ({tracks, slug: channelSlug}) => {
	if (tracks && tracks.length < 0) return

	const tagsPath = `./${channelSlug}/tags`
	if (fs.existsSync(tagsPath)) {
		try {
			await fs.remove(tagsPath)
			console.log('Removed old Tag folder')
		} catch (error) {
			console.error('Error de-initing r4 folder', r4ConfigPath, error)
			return
		}
	}

	let tracksWithTags = []
	await asyncForEach(tracks, async (track) => {
		const tags = tagsFromString(track.body)
		if (!tags || !tags.length > 0) return

		const trackPath = `./${channelSlug}/${track.title}.m4a`
		const trackExists = await fs.existsSync(trackPath)

		if (!trackExists) return
		tracksWithTags.push(track)

		const writeTrackAtTag = tags.map(tag => {
			const trackLinkTagPath = `./${channelSlug}/tags/${tag}/${track.title}.m4a`
			return fs.ensureLink(trackPath, trackLinkTagPath)
		})

		try {
			await Promise.all(writeTrackAtTag)
		} catch (error) {
			console.error('Error writing track hard link at tag', error)
			return
		}

	})
	console.log(`Moved ${tracksWithTags.length} tracks to the "./${channelSlug}/tags" folder`)
}

const main = async function() {
	const {
		sorted,
		generate
	} = flags

	const chanelData = await readChannelData(slug)

	if (!chanelData) return

	// when no flats and jut a channel, show all tags
	if (Object.keys(flags).length === 0) {
		return showChannelTags(chanelData)
	}
	// if flag is sorted, show a sorted list of tracks
	if (sorted) {
		return showSortedChannelTags(chanelData)
	}
	// if generate flat, del and generate a tags/traks structure anew
	if (generate) {
		return generateFolderStructure(chanelData)
	}
}

main()
