#!/usr/bin/env node

const args = require('args')

args
	.command('download', 'Download a channel')
	// .option('slug', 'something')
	.examples([{
		usage: 'r4 download 200ok',
		description: 'download a Radio4000 channel with the slug "200ok"'
	}])

const flags = args.parse(process.argv)

args.showHelp()
