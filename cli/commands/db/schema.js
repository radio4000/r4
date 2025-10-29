const schemas = {
	channels: `CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT,
  description TEXT,
  url TEXT,
  image TEXT,
  link1href TEXT,
  link1title TEXT,
  link2href TEXT,
  link2title TEXT,
  link3href TEXT,
  link3title TEXT,
  created_at TEXT,
  updated_at TEXT,
  source TEXT
);`,

	tracks: `CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY,
  slug TEXT,
  title TEXT,
  url TEXT,
  description TEXT,
  discogs_url TEXT,
  tags TEXT,
  created_at TEXT,
  updated_at TEXT,
  source TEXT
);`
}

const selectSchemas = (input) => {
	const all = Object.keys(schemas)
	const selected = input.channels || input.tracks ? all.filter((k) => input[k]) : all
	return selected.map((k) => schemas[k])
}

export default {
	description: 'Output SQL CREATE TABLE statements for channels and tracks',

	options: {
		channels: {
			type: 'boolean',
			description: 'Output only channels schema'
		},
		tracks: {
			type: 'boolean',
			description: 'Output only tracks schema'
		}
	},

	handler: async (input) => ({
		data: selectSchemas(input).join('\n\n'),
		format: 'text'
	}),

	examples: [
		'r4 db schema',
		'r4 db schema --channels',
		'r4 db schema --tracks',
		'r4 db schema | sqlite3 my.db'
	]
}
