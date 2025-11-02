# R4 Improvement Plan

Ideas and tasks for later.

---- READY TO PICK UP -----

## Unknown flags silently ignored: `r4 channel list --unknown-flag` works without warning
- Typos like `--limt` instead of `--limit` go unnoticed
- Should validate and error on unknown flags

## unclear format flag availability `--format`: Not documented which commands support `--format`?
- Works on `track list` (json, m3u)
- Accepted on `channel list` but seems to always output JSON
- Need to document which commands support which formats, or make it consistent

--- IDEAS TO EVALUATE ---

- Maintain a local cache of fetched tracks somehow to avoid fetching all tracks tons of times
- Add premium/poToken support for YouTube Music. e.g. if you have a premium account you can dl the tracks via that which gives you 256kb
- Progress spinners (only when TTY) for long operations
- stdin support (`-` flag) for piping data in
- Config file at `~/.config/r4/config.json` (follow XDG spec)
- Dangerous operation prompts (delete commands should confirm)
- Add mutually exclusive options support (e.g., `exclusive: ['channels', 'tracks']`)
- TTY-aware formatters: composable middleware (text vs json vs table)
- Generate completion scripts for bash/zsh/fish for DX

