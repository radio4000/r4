#!/usr/bin/env node

const args = require('args')
// const downloadTracks = require('src/download-tracks')

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

console.log(slug, flags)

if (!slug) {
	args.showHelp();
}
