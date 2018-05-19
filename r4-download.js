#!/usr/bin/env node

const args = require('args')
const {createBackup} = require('radio4000-sdk')
const downloadTracks = require('./src/download-tracks')

args
	.option('destination', 'the path of the folder to download ')
	.examples([{
		usage: 'r4 download 200ok',
		description: 'To download a Radio4000 channel with the slug "200ok"'
	}])

const flags = args.parse(process.argv, {
	version: false,
	value: 'channel-slug'
})
const slug = args.sub[0]

if (!slug) {
	args.showHelp();
}

console.log(`Downloading channel: ${slug}…`)

createBackup(slug)
	.then(backup => backup.tracks.map(t => t.ytid))
	.then(ids => ids.map(id => `http://www.youtube.com/watch?v=${id}`))
	.then(urls => {
		const folderName = slug
		downloadTracks(urls, folderName, (cmd) => {
			console.log('DONE')
		})
	})
	.then(err => {
		console.log(err)
	})
