# CLI Implementation Plan

### Backlog

 [ ] Improve download command output
  - Separate progress info from JSON output
  - Add --json-only or --quiet flag
- [ ] Tags command: `r4 tags <slug> [--limit N]`
  - Show usage statistics (tag name + count)
  - Output: formatted table by default, --format json
  - Data: works with v1+v2 combined
- [ ] Add `--output <file>` flag to save directly to file
- [ ] Add `--format` flag: json (default), table, tsv (extends --sql)

### Download Improvements

- [ ] Add concurrency control (p-limit) for batch downloads
- [ ] Add retry logic for failed downloads
- [ ] Add premium/poToken support for YouTube Music
