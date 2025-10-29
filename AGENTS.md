Hey we're making a new CLI in @cli/ using @cli-framework/ (which we adapt) to our own needs. 
We want it to malleable, composable. Beautiful like lisp, haskell and elixir. 
This is a CLI. Test it, use it with `r4`. Super for debugging. And if it can't debug it, we can extend it.
Run `bun run check` to lint and format all code.

## Development

### Testing
```bash
bun test
bun test cli-framework/
bun test cli/
bun test cli/commands/channel/list.test.js #specific
```

### Running the CLI
```bash
node cli/index.js channel list --limit 10
# If linked with `bun link`, just call it with `r4.
node cli/index.js channel list --help
```

## Architecture

- **cli-framework/** - Reusable CLI framework (routing, parsing, validation)
- **cli/** - R4-specific CLI implementation
- **cli/commands/** - Command definitions (file-per-subcommand)
- **cli/lib/** - Shared utilities (data layer, schema validation)
- See [cli-framework/README.md](cli-framework/README.md) 
