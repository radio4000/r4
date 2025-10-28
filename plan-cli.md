# CLI Implementation Plan

## Status: ✅ Production Ready (v1.0.4)

All core features implemented and tested (2025-10-28).

## Known Issues

- [ ] Download command has mixed output formats (progress, summary, JSON all mixed)
  - Consider --json-only flag or separate verbose mode

## Backlog

### High Priority

- [x] Search command: `r4 search <query> [--channels] [--tracks]` - DONE 2025-10-28
  - Default: search both channels and tracks (grouped output)
  - `--channels`: only search channels
  - `--tracks`: only search tracks
  - Data: combined v1+v2 sources
  - Channels: fuzzy match on slug, name, description
  - Tracks: fuzzy match on title, description
  - Uses fuzzysort library for fuzzy matching
  - Output: grouped text format by default, JSON when using --channels or --tracks flags

- [ ] Improve download command output
  - Separate progress info from JSON output
  - Add --json-only or --quiet flag

### Medium Priority

- [ ] Tags command: `r4 tags <slug> [--limit N]`
  - Aggregate hashtags from track descriptions for a channel
  - Show usage statistics (tag name + count)
  - Output: formatted table by default, JSON with --json
  - Data: works with v1+v2 combined

- [ ] Add `--output/-o <file>` flag to save directly to file

- [ ] Add `--format` flag: json (default), csv, table, tsv (extends --sql)

### Download Improvements

- [ ] Add concurrency control (p-limit) for batch downloads
- [ ] Add retry logic for failed downloads
- [ ] Add premium/poToken support for YouTube Music
