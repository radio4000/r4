#!/usr/bin/env node

const args = require('args')
// const downloadTracks = require('src/download-tracks')

args
	.command('slug', 'The Radio4000 channel to download tracks of')
	.option('destination', 'the path of the folder to download ')

const flags = args.parse(process.argv)
const slug = args.sub[0]

console.log(slug, flags)

if (!slug) {
	args.showHelp();
}
