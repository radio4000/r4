#!/usr/bin/env node

const args = require('args')
const fs = require('fs-extra')
const path = require('path')

args
	.option('verbose', 'More outputs to the console')
	.example('r4 clean a-channel', 'Download the channel with the slug "a-channel"')

const flags = args.parse(process.argv, {
	version: false,
	value: 'channel-slug',
	mainColor: ['reset']
})

let slug = args.sub[0]

const cleanPath = async (folderPath) => {
	// Remove '' empty string for all files without extension
	const extToClean = ['', '.part', '.ytdl']

	const filesToClean = fs.readdirSync(folderPath).filter(file => {
		const extname = path.extname(file)
		if (extToClean.includes(extname)) {
			return true
		}
		return false
	})

	if (!filesToClean.length) {
		console.log('No file had to be cleaned; checked for', extToClean)
		return true
	}

	filesToClean.forEach(filePath =>{
		const pathToUnlink = folderPath + filePath
		fs.unlink(pathToUnlink)
		console.log('Cleaned', pathToUnlink)
	})
	console.log(`Cleaned ${filesToClean.length} files`)
}

const main = async function() {
	const pathToClean = `./${slug}`
	console.log('Cleaning folder path', pathToClean)

	try {
		if (fs.existsSync(pathToClean)) {
			cleanPath(pathToClean)
		} else {
			console.log('No channel folder at', pathToClean)
		}
	} catch (error) {
	}
}

main()
