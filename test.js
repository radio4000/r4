import test from 'ava';
const findTracks = require('./src/find-tracks');
const downloadTracks = require('./src/download-tracks');
const r4dl = require('./index');

test('all functions are there', t => {
	t.is(typeof r4dl, 'function');
	t.is(typeof findTracks, 'function');
	t.is(typeof downloadTracks, 'function');
});

test('findTracks returns an array of strings', async t => {
	const testUrl = 'https://radio4000.com/ifeveryoneelseforgets';
	const tracks = await findTracks(testUrl);
	t.truthy(tracks.length);
});
