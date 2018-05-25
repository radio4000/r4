import test from 'ava'
import scrapeTracks from './lib/scrape-tracks'
import downloadTracks from './lib/download-tracks'
import r4dl from './r4dl'

test('all functions are there', t => {
	t.plan(3)
	t.is(typeof r4dl, 'function')
	t.is(typeof scrapeTracks, 'function')
	t.is(typeof downloadTracks, 'function')
})

test('can get all youtube ids from a channel', async t => {
	t.plan(2)
	const testUrl = 'https://radio4000.com/the-blueprint'
	const tracks = await scrapeTracks(testUrl)
	t.truthy(tracks.length)
	t.true(typeof tracks[1] === 'string')
})

// @todo test downloadTracks
