# CLI Framework

A lightweight, zero-dependency CLI framework for Node.js with a file-per-subcommand architecture. Built with simplicity, type safety, and testability in mind.

## Features

- **File-per-subcommand**: Each command is a single file with a declarative definition
- **Zero dependencies**: Uses Node.js built-in `util.parseArgs`
- **Type-safe**: Zod schemas for validation
- **Multiple output formats**: JSON, SQL, plain text
- **Auto-generated help**: Help text generated from command definitions
- **Comprehensive testing**: 93 tests with 100% core functionality coverage
- **Simple routing**: Directory structure maps to CLI structure

## Architecture

```
cli-framework/
├── index.js              # Router - command discovery and execution
├── runner.js             # Command runner - parseArgs integration
├── types.js              # Zod schemas and validation
├── utils/
│   ├── output.js         # Output formatters (JSON, SQL, text)
│   └── help.js           # Help text generation
├── example.js            # Working example CLI
└── test-fixtures/        # Test commands
```

## Quick Start

### 1. Define a Command

Create a command file in your commands directory:

```javascript
// src/commands/channel/view.js
export default {
  description: 'View channel details',

  args: [
    {
      name: 'slug',
      description: 'Channel slug to view',
      required: true,
      multiple: false
    }
  ],

  options: {
    json: {
      type: 'boolean',
      description: 'Output as JSON',
      default: true
    },
    sql: {
      type: 'boolean',
      description: 'Output as SQL statements',
      conflicts: ['json']
    }
  },

  handler: async ({ args, flags, context }) => {
    const channel = await getChannel(args.slug);
    return channel;
  },

  examples: [
    'r4 channel view ko002',
    'r4 channel view ko002 --sql'
  ]
};
```

### 2. Create Your CLI Entry Point

```javascript
#!/usr/bin/env node
import { resolve } from 'node:path';
import { executeCommand } from './cli-framework/index.js';
import { formatOutput } from './cli-framework/utils/output.js';

async function main() {
  const argv = process.argv.slice(2);

  const result = await executeCommand({
    commandsDir: resolve('./src/commands'),
    argv,
    context: { /* shared context */ }
  });

  const output = formatOutput(result, 'json');
  console.log(output);
}

main();
```

### 3. Run Your CLI

```bash
# Route to src/commands/channel/view.js
node cli.js channel view ko002

# With options
node cli.js channel view ko002 --sql
```

## Command Definition Format

Each command exports a plain object with this structure:

```javascript
export default {
  // Required: Command description for help text
  description: string,

  // Optional: Positional arguments
  args: [
    {
      name: string,           // Argument name
      description: string,    // Help text
      required: boolean,      // Is it required?
      multiple: boolean       // Accept multiple values?
    }
  ],

  // Optional: Flags/options (boolean or string)
  options: {
    [name]: {
      type: 'boolean' | 'string',
      description: string,
      default?: any,          // Default value
      short?: string,         // Short flag (e.g., 'v' for -v)
      conflicts?: string[],   // Conflicting options
      parse?: (val) => any    // Custom parser/validator
    }
  },

  // Optional: Zod schema for validation
  validate: ZodSchema,

  // Required: Command handler
  handler: async ({ args, flags, context }) => {
    // Return data (will be formatted by framework)
    return result;
  },

  // Optional: Usage examples
  examples: string[],

  // Optional: Hide from help
  hidden: boolean
};
```

## Routing

Commands map to filesystem structure:

```
src/commands/
  simple.js          → cli simple
  channel/
    list.js          → cli channel list
    view.js          → cli channel view
    create.js        → cli channel create
  track/
    list.js          → cli track list
```

The router automatically discovers commands and routes based on the directory structure.

## Output Formatting

Commands return raw data. The framework handles formatting:

```javascript
import { formatOutput } from './cli-framework/utils/output.js';

// JSON (default, pretty-printed)
const json = formatOutput(data, 'json');

// SQL INSERT statements
const sql = formatOutput(data, 'sql', { table: 'channels' });

// Plain text (key-value pairs)
const text = formatOutput(data, 'text');
```

## Error Handling

The framework provides structured errors with helpful context:

```javascript
import { CLIError, ErrorTypes } from './cli-framework/types.js';

// Throw in command handlers
throw new CLIError(
  ErrorTypes.INVALID_ARGUMENT,
  'Channel not found',
  { slug: 'ko002' }
);

// Framework catches and formats errors
// Error: Channel not found
// Context: { slug: 'ko002' }
```

Error types:
- `UNKNOWN_COMMAND` - Command not found
- `MISSING_ARGUMENT` - Required argument missing
- `INVALID_ARGUMENT` - Argument validation failed
- `CONFLICTING_OPTIONS` - Conflicting flags used
- `HANDLER_ERROR` - Command execution failed
- `INVALID_COMMAND_DEFINITION` - Command file invalid

## Help Generation

Help text is auto-generated from command definitions in MANpage style:

```bash
$ cli channel view --help

NAME
  cli-channel-view - View channel details

SYNOPSIS
  cli channel view <slug> [options]

DESCRIPTION
  View channel details

ARGUMENTS
  <slug>
      Channel slug to view (required)

OPTIONS
  --json
      Output as JSON (default: true)

  --sql
      Output as SQL statements
      Conflicts with: --json

EXAMPLES
  cli channel view ko002
      View a single channel as JSON

  cli channel view ko002 --sql
      View a channel with SQL output format

SEE ALSO
  cli-channel-list(1), cli-channel-create(1)
```

### Help Format Specification

The framework generates help in traditional Unix MANpage format:

**NAME** - Command name and brief description
**SYNOPSIS** - Usage syntax with placeholders
**DESCRIPTION** - Detailed explanation of what the command does
**ARGUMENTS** - Positional arguments with descriptions
**OPTIONS** - Flags and their behavior, including defaults and conflicts
**EXAMPLES** - Real-world usage examples with explanations
**SEE ALSO** - Related commands (when available)

## Testing

The framework is fully tested with Bun:

```bash
# Run all tests
bun test cli-framework/

# Run specific tests
bun test cli-framework/runner.test.js
bun test cli-framework/index.test.js
bun test cli-framework/utils/output.test.js
bun test cli-framework/utils/help.test.js
```

Test coverage:
- ✅ 15 tests for types and validation
- ✅ 23 tests for command runner
- ✅ 13 tests for router
- ✅ 27 tests for output formatters
- ✅ 15 tests for help generation

**Total: 93 passing tests**

## Example Usage

See [example.js](./example.js) for a working example CLI.

```bash
# Show help
node cli-framework/example.js

# Run simple command
node cli-framework/example.js simple

# Run nested command with options
node cli-framework/example.js channel list --limit 10

# Run with positional argument
node cli-framework/example.js channel view ko002

# Change output format
node cli-framework/example.js channel list --sql
```

## Design Philosophy

### Why Plain Objects?

We chose plain object exports over classes or functions:

**vs. Classes (like npm CLI)**
- ✅ Simpler mental model (no inheritance, no `this`, no `static`)
- ✅ JSON-serializable
- ✅ Pure functions
- ✅ Less boilerplate

**vs. Functions (like Python's Typer)**
- JavaScript lacks runtime type introspection
- No stable decorator support
- Explicit is better than implicit in JS
- Metadata colocation is valuable

Plain objects are the sweet spot for JavaScript CLIs.

### Design Decisions

1. **Filesystem-based routing**: Convention over configuration
2. **Zero dependencies**: Only Node.js built-ins + Zod
3. **Validation with Zod**: Type-safe validation
4. **Separation of concerns**: Router → Runner → Handler
5. **Testability first**: Every component is unit tested

## Advanced Patterns

### Custom Parsers

Transform option values:

```javascript
options: {
  limit: {
    type: 'string',
    description: 'Limit results',
    parse: (val) => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1) {
        throw new Error('must be a positive number');
      }
      return num;
    }
  }
}
```

### Validation Schemas

Use Zod for complex validation:

```javascript
import { z } from 'zod';

export default {
  args: [
    { name: 'slug', required: true, multiple: false }
  ],
  validate: z.object({
    slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/)
  }),
  handler: async ({ args }) => {
    // args.slug is validated
  }
};
```

### Shared Context

Pass shared state to all commands:

```javascript
const result = await executeCommand({
  commandsDir: './commands',
  argv,
  context: {
    auth: { token: 'secret' },
    config: { verbose: true },
    db: dbConnection
  }
});
```

## Command Discovery

The framework provides two functions for discovering commands:

### `listCommands(commandsDir)`

Lists immediate commands in a directory (non-recursive):

```javascript
import { listCommands } from './cli-framework/index.js'

const commands = await listCommands('./cli/commands')
// Returns: [{ name: 'channel', description: 'Command group', isDirectory: true }, ...]
```

### `listAllCommands(commandsDir)`

Recursively discovers all commands in a directory tree:

```javascript
import { listAllCommands } from './cli-framework/index.js'

const commands = await listAllCommands('./cli/commands')
// Returns: [
//   { name: 'channel/list', description: '...', hidden: false },
//   { name: 'channel/view', description: '...', hidden: false },
//   { name: 'track/list', description: '...', hidden: false },
//   ...
// ]
```

Use this in help commands to auto-generate command lists:

```javascript
// cli/commands/help.js
export default {
  description: 'Show help',
  handler: async () => {
    const commands = await listAllCommands(__dirname)
    // Group and format commands...
  }
}
```

**Benefits**: Single source of truth - new commands automatically appear in help.

## Future Enhancements

Potential additions (not implemented yet):

- [ ] Shell completion (bash/zsh/fish)
- [ ] Config file support using [sindresorhus/conf](https://github.com/sindresorhus/conf)
- [ ] Argument groups (mutually exclusive args)
- [ ] Interactive prompts

## Cleanup Tasks

- [ ] Review `cli-old/` directory - keep what's needed, delete the rest

## License

See project root for license information.
