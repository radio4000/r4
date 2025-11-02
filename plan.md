# R4 Improvement Plan

Ideas and tasks for later.

## Feature Ideas

- Maintain a local cache of fetched tracks somehow to avoid fetching all tracks tons of times
- Add premium/poToken support for YouTube Music. e.g. if you have a premium account you can dl the tracks via that which gives you 256kb

## CLI Issues (based on testing + comparison with `bun` CLI)

### Design Inspirations from Bun

#### Command presentation (very nice!)
- Two-column layout: `command   description   example`
  ```
  run       ./my-script.ts       Execute a file with Bun
            lint                 Run a package.json script
  ```
- Shows concrete examples in third column (genius!)
- Groups related commands visually (spacing)

#### What we could adopt:
1. **Add example column** to our help output
   - `channel list   acapulco              List all channels`
   - `track list     --channel acapulco    List tracks in channel`

2. **Command aliases** mentioned inline
   - `install   (bun i)`
   - `add       (bun a)`
   - We could show: `channel list (r4 ch ls)` if we add aliases

3. **Better grouping** - Bun groups by workflow:
   - "Run stuff" commands first
   - "Package management" commands together
   - "Project creation" commands together

   We group by resource (channel/track), which is fine, but consider workflow ordering

4. **Bottom-of-help contextual info**
   - `bun run` shows: "package.json scripts (3 found):" with actual scripts
   - We could show: "Connected to: v2 API" or "Using bundled v1 data"
   - Or: "Auth: logged in as user@example.com" vs "Auth: not logged in"

5. **Hint about subcommand help**
   - `<command> --help    Print help text for command`
   - Very clear signposting!

### Improvements to Consider

#### Per-command help: Missing flags documentation
**Current state:**
- ✅ Usage line shown (`r4 channel list [options]`)
- ✅ Description shown
- ✅ Examples shown
- ❌ Available flags/options not documented

**Issue:** `r4 channel list --help` doesn't show that `--limit` and `--format` flags exist. Users have to guess or read the code.

**Design challenge:**
- Option A: Manually add `options: [{name: '--limit', description: '...'}, ...]` to each command's metadata
- Option B: Auto-generate from `parse()` options (would need description field added to parse config)
- Option C: Create a helper function that commands can use to document their flags

**Example of what help should show:**
```
Usage: r4 channel list [options]

List all channels (from v2 API or bundled v1 data)

Options:
  --limit <n>       Limit number of results (default: 100)
  --format <type>   Output format: text, json, sql (auto: tty=text, pipe=json)

Examples:
  r4 channel list
  r4 channel list --limit 10
```

### Bugs Found (Nov 2025 Testing)

#### Unknown flags silently ignored
**Issue:** `r4 channel list --unknown-flag` works without warning
- Typos like `--limt` instead of `--limit` go unnoticed
- Should validate and error on unknown flags

#### `--limit` validation missing
**Issue:** Invalid limit values are silently ignored
- `r4 channel list --limit 0` → returns default results
- `r4 channel list --limit -5` → returns default results
- Should validate numeric values and warn/error on invalid inputs

#### `track list` requires `--channel` but help says otherwise
**Issue:** Inconsistent behavior and documentation
- Running `r4 track list` errors: "--channel is required"
- But help text says: "track list    List all tracks"
- Either make it work without channel OR fix help text to say "List tracks for specified channel(s)"

#### `--format` flag availability unclear
**Issue:** Not documented which commands support `--format`
- Works on `track list` (json, m3u)
- Accepted on `channel list` but seems to always output JSON
- Need to document which commands support which formats, or make it consistent

### Nice to Have

#### Shell completions
Generate completion scripts for bash/zsh/fish
- Low priority but would improve UX

### Standard flags to consider (from clig.dev)
- `--quiet` / `-q` - Suppress non-essential output
- `--debug` / `-d` - Show debug information
- `--dry-run` / `-n` - For delete commands, show what would happen without doing it

### Future ideas
- Progress spinners (only when TTY) for long operations
- stdin support (`-` flag) for piping data in
- Config file at `~/.config/r4/config.json` (follow XDG spec)
- Dangerous operation prompts (delete commands should confirm)

## CLI Framework Improvements

Ideas for the framework itself:
- Add mutually exclusive options support (e.g., `exclusive: ['channels', 'tracks']`)
- TTY-aware formatters: composable middleware (text vs json vs table)
