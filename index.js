#!/usr/bin/env node

const spawn = require('child_process').spawn;
const ora = require('ora');
const chalk = require('chalk');
const findTracks = require('./src/find-tracks');
const downloadTracks = require('./src/download-tracks');

const init = () => {
	const url = process.argv[2];

	if (!url) {
		console.log(chalk.red('You have to pass a valid and complete Radio4000 channel URL'));
		console.log('Like this: `r4dl <url>`');
		return;
	}

	const spinner = ora(`Fetching ${url} for you.`);
	spinner.start();
	setTimeout(() => {
		spinner.color = 'yellow';
		spinner.text = 'This can take quite a while (~1-20 minutes)';
	}, 4000);

	findTracks(url).then(youtubeIds => {
		spinner.stop();
		console.log(chalk.yellow(`Found all ${youtubeIds.length} tracks. Now downloading…`));

		downloadTracks(youtubeIds, () => {
			console.log(chalk.green('. Check the `downloads` folder.'));
			spawn('open', ['downloads']);
		});
	});
};

init();

module.exports = init;
