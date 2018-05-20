#!/usr/bin/env node

'use strict'

const args = require('args')
const prompts = require('prompts')
const {findChannels, findChannelBySlug, findTracksByChannel} = require('radio4000-sdk')
const listenToYoutube = require('listen-to-youtube-cli')
const Speaker = require('speaker')

const main = async function() {
	args
		.examples([{
			usage: 'r4 listen 200ok',
			description: 'Listen to the Radio4000 channel with slug "200ok"'
		}])

	const flags = args.parse(process.argv, {
		version: false,
		value: 'channel-slug'
	})

	let slug = args.sub[0]
	if (!slug) {
		// args.showHelp()
		const channels = await findChannels()
		const question = {
			type: 'autocomplete',
			name: 'slug',
			message: 'Search for a radio to play',
			choices: channels.map(c => ({
				title: c.title,
				value: c.slug
			}))
		}
		const answer = await prompts(question)
		slug = answer.slug
	}
	if (!slug) process.exit()

	// Get a track
	const channel = await findChannelBySlug(slug)
	const tracks = await findTracksByChannel(channel.id)
	// const url = 'https://www.youtube.com/watch?v=2pWlGd_tBh8'
	const url = tracks[0].ytid
	console.log(`Listening to ${tracks[0].title} from ${channel.title}. Playback will stop after one track…`)
	const songFinished = await listenToYoutube(url, new Speaker())
	console.log('we are done')
	process.exit()
}

main()

