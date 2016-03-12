/* global document */
const Nightmare = require('nightmare');

const findTracks = (url) => {
	return new Nightmare({show: false})
		.goto(url)
		.wait('.Channel-outlet')
		.wait(6000) // Waiting for .Track is not reliable. Neither is this. But yea.
		.evaluate(() => {
			const elements = document.querySelectorAll('.Track');
			// YouTube IDs are stored as `data-pid` attributes.
			// A full URL is needed (https://github.com/rg3/youtube-dl/#how-do-i-download-a-video-starting-with-a--)
			const ids = Array.from(elements).map(e => `http://www.youtube.com/watch?v=${e.getAttribute('data-pid')}`);
			return ids;
		})
		.end();
};

module.exports = findTracks;
