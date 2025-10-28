# Claude Code Notes

## Development

### Testing
```bash
# Run all tests
bun test

# Run framework tests only
bun test cli-framework/

# Run CLI command tests
bun test cli/

# Run specific test file
bun test cli/commands/channel/list.test.js
```

### Running the CLI
```bash
# Direct execution
node cli/index.js channel list --limit 10

# Via package.json script (if configured)
bun run r4 channel list --limit 10

# Test help
node cli/index.js channel list --help
```

## Architecture

- **cli-framework/** - Reusable CLI framework (routing, parsing, validation)
- **cli/** - R4-specific CLI implementation
- **cli/commands/** - Command definitions (file-per-subcommand)
- **cli/lib/** - Shared utilities (data layer, schema validation)

## Backlog

See [cli-framework/README.md](cli-framework/README.md#future-enhancements) for planned features.