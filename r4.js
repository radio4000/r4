#!/usr/bin/env node

const args = require('args')

args
	.command('download', 'Download a radio4000.com channel')
	.command('listen', 'Listen to a radio4000.com channel')
	.examples([{
		usage: 'r4 download 200ok',
		description: `Download the channel at https://radio4000.com/200ok`
	},{
		usage: 'r4 listen detecteve',
		description: `Play and listen to the channel at https://radio4000.com/detecteve`
	}])

const flags = args.parse(process.argv, {
	mainColor: ['black']
})

const command = args.sub[0]

if (!command) {
	args.showHelp();
}
