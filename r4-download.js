#!/usr/bin/env node

const args = require('args')
// const downloadTracks = require('src/download-tracks')

args
	.option('slug', 'Enter the slug of a radio')

const flags = args.parse(process.argv)

console.log('download please')

// downloadTracks(flags.name)

