#!/usr/bin/env node

const args = require('args')

args
	.command('download', 'Download a radio4000.com channel')
	.examples([{
		usage: 'r4 download 200ok',
		description: `To download the channel at https://radio4000.com/200ok`
	}])

const flags = args.parse(process.argv)
const command = args.sub[0]

if (!command) {
	args.showHelp();
}
