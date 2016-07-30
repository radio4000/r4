#!/usr/bin/env node

const spawn = require('child_process').spawn;
const commandExists = require('command-exists');
const ora = require('ora');
const chalk = require('chalk');
const urlRegex = require('url-regex');
const findTracks = require('./src/find-tracks');
const downloadTracks = require('./src/download-tracks');

const init = () => {
	commandExists('youtube-dl', (err, commandExists) => {
		if (!commandExists || err) {
			console.log('You need to install youtube-dl to use this. See https://rg3.github.io/youtube-dl/');
			return;
		}
	});
	const url = process.argv[2];
	if (!url) {
		console.log(chalk.red('Uh oh. You have to pass the full URL to the radio.'));
		console.log('Like this: r4dl https://radio4000.com/name-of-your-radio');
		return;
	}
	if (!urlRegex().test(url)) {
		console.log(chalk.red(`What you wrote doesn't look like a real URL. Try this format:`));
		console.log('r4dl https://radio4000.com/name-of-your-radio');
		return;
	}
	const slug = url.split('.com/')[1];
	const spinner = ora(`Looing for tracks from ${url} for you.`);
	spinner.start();
	setTimeout(() => {
		spinner.text = 'This can take quite a while (~1-20 minutes)';
	}, 4000);
	findTracks(url).then(youtubeIds => {
		spinner.stop();
		console.log(`Found ${youtubeIds.length} tracks. Now downloading…`);
		downloadTracks(youtubeIds, slug, () => {
			console.log(chalk.green('Finished downloading. Check the `radio4000-${slug}` folder.'));
			spawn('open', [`radio4000-${slug}`]);
		});
	});
};

init();

module.exports = init;
