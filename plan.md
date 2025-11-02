# R4 Improvement Plan

Ideas and tasks for later.

---- READY TO PICK UP -----

## Progress spinners (only when TTY) - 1-2h
- Create cli/lib/spinner.js with TTY detection
- Add to channel/track list commands
- Use frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
- Guard: process.stdout.isTTY, no-op if false

## stdin support (`-` flag) - 1-2h
- Create cli/lib/stdin.js with readStdin()
- Update track list/download to accept `-` for channel slugs
- Standard Unix pattern: `r4 channel list | r4 track list -`
- Expect JSON from stdin, parse and extract slugs

## Code review fixes
- Fix formatOption.parse validation in common-options.js (not being called by utils.parse)
- Improve error handling in config.js (differentiate file-not-found from corruption)
- Extract console.error side effects from data.js (return structured errors instead)
- Refactor listTracks() in data.js (too complex, split into smaller functions)
- Add tests for utils.js (routing logic currently untested)
- Standardize error handling (consistent throw vs return patterns)
- Remove process.exit() from utils.js route() (return structured result instead)
- Extract magic numbers to constants (180 chars, 3 preview tracks, 10 max concurrency)
- Add schema validation tests (ensure Zod and SQL schemas stay in sync)

--- IDEAS TO EVALUATE ---

## Local cache - 4-6h
- File-based cache in ~/.cache/radio4000/
- Cache keys: `{resource}:{identifier}` (tracks:channelSlug:mychannel)
- Default TTL: 5 minutes
- Add --no-cache flag to common-options.js
- Add r4 cache clear/stats commands
- Wrap listChannels()/listTracks()

## YouTube premium/poToken - 8h+
- Research yt-dlp cookie auth flow first
- Add youtube.cookies to config.js schema
- Commands: r4 youtube auth <cookies.txt>, r4 youtube status
- Pass --cookies to yt-dlp in download.js
- Document: cookie extraction (browser extension), ToS considerations
- Test with real premium account
- Config file at `~/.config/r4/config.json` (follow XDG spec)
- Dangerous operation prompts (delete commands should confirm)
- Add mutually exclusive options support (e.g., `exclusive: ['channels', 'tracks']`)
- TTY-aware formatters: composable middleware (text vs json vs table)
- Generate completion scripts for bash/zsh/fish for DX

