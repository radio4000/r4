#!/usr/bin/env node

'use strict'

const args = require('args')
const prompts = require('prompts')
const {createBackup, findChannels} = require('radio4000-sdk')
const downloadTracks = require('./src/download-tracks')

args
	.option('destination', 'the path of the folder to download')
	.option('search', 'search for a radio')
	.examples([{
		usage: 'r4 download 200ok',
		description: 'Download a Radio4000 channel with the slug "200ok"'
	}])

const flags = args.parse(process.argv, {
	version: false,
	value: 'channel-slug'
})

let slug = args.sub[0]

const main = async function() {
	if (flags.search) {
		const channels = await findChannels()
		const question = {
			type: 'autocomplete',
			name: 'slug',
			message: 'Search and select a radio',
			choices: channels.map(c => ({
				title: c.title,
				value: c.slug
			}))
		}
		const answer = await prompts(question)
		slug = answer.slug
	}

	if (!slug) args.showHelp()

	console.log(`Downloading channel: ${slug}…`)

	try {
		const backup = await createBackup(slug)
		const urls = backup.tracks
			.map(track => `http://www.youtube.com/watch?v=${track.ytid}`)
		await downloadTracks(urls, slug)
		console.log('DONE')
	} catch (err) {
		console.log(err)
	}
}

main()

// createBackup(slug)
// 	.then(backup => backup.tracks.map(t => t.ytid))
// 	.then(ids => ids.map(id => `http://www.youtube.com/watch?v=${id}`))
// 	.then(urls => {
// 		const folderName = slug
// 		downloadTracks(urls, folderName, (cmd) => {
// 			console.log('DONE')
// 		})
// 	})
// 	.then(err => {
// 		console.log(err)
// 	})
