# NAME

r4 - Radio4000 command-line interface

# SYNOPSIS

```
r4 <command> <subcommand> [<args>] [flags]
r4 help
r4 version
```

# DESCRIPTION

r4 is a command-line interface for interacting with Radio4000 channels and tracks.

# COMMANDS

## Authentication
- `r4 auth login` - Authenticate with Radio4000
- `r4 auth logout` - Sign out from Radio4000
- `r4 auth whoami` - Show current authenticated user

## Channel Operations
- `r4 channel create` - Create a new channel
- `r4 channel delete` - Delete one or more channels
- `r4 channel list` - List all channels (from v2 API or bundled v1 data)
- `r4 channel update` - Update one or more channels
- `r4 channel view` - View detailed information about one or more channels

## Track Operations
- `r4 track create` - Create a new track
- `r4 track delete` - Delete one or more tracks
- `r4 track list` - List all tracks, optionally filtered by channel(s)
- `r4 track update` - Update one or more tracks
- `r4 track view` - View detailed information about one or more tracks

## General
- `r4 download` - Download all tracks from a channel
- `r4 help` - Show help information
- `r4 search` - Search channels and tracks
- `r4 version` - Show version information

# FLAGS

- `--limit <n>` - Limit number of results
- `--sql` - Output as SQL statements (instead of JSON)
- `--channel <slug>` - Filter tracks by channel slug

# DATA SOURCES

Read operations (list/view) use smart fallback:
1. Query v2 API (Supabase)
2. Fall back to bundled v1 data (read-only, ~600 channels)

Write operations (create/update/delete) only work with v2.

# AUTHENTICATION

Set `R4_AUTH_TOKEN` environment variable or use `r4 auth login`

# EXAMPLES

```bash
# List and view
r4 channel list --limit 100
r4 channel view acapulco oskar
r4 track list
r4 track list --channel acapulco

# Create and update
r4 channel create mysounds --name "My Sounds"
r4 track create --url "..." --title "Song" --channel mysounds

# Export to SQLite
r4 channel list --limit 1000 --sql | sqlite3 channels.db

# Pipe and transform
r4 track list --channel foo | jq '.[] | .title'
r4 channel list --limit 10 | jq '.[].slug'

# Download
r4 download acapulco --folder ~/Music
```

# INSTALLATION

For downloads to work, make sure `youtube-dl` (https://github.com/rg3/youtube-dl/) and `ffmpeg` are installed on your system.

## From npm

```bash
npm i -g r4
```

## From repo directly

```bash
npm i -g github:radio4000/r4
```

# DEVELOPMENT

```bash
git clone git@github.com:radio4000/r4.git
cd r4
npm link
```

Linking makes `r4` use your local copy. If you are changing the path or adding a new binary, remember to run `npm unlink` and `npm link` in the project.

Run tests with `bun test` or `npm test`.
Check code formatting with `bun run check`.

# ADVANCED USAGE

If you have `jq` installed, you can download the tracks of a channel with this one-liner:

```bash
curl https://api.radio4000.com/v1/channels/-JYZtdQfLSl6sUpyIJx6/tracks | jq -r '.[] | .url' | youtube-dl -ixa /dev/stdin --audio-format mp3
```

If you don't have `jq`, but have `python`, try this:

```bash
curl https://api.radio4000.com/v1/channels/-JYZtdQfLSl6sUpyIJx6/tracks | python -m json.tool | grep -oP '"url": "\K(.+)",' | youtube-dl -a /dev/stdin --extract-audio --audio-format mp3
```

# SEE ALSO

- https://radio4000.com
- https://github.com/radio4000/r4
