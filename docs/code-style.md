# Code Style and Quality Configuration

This document describes the code style and quality tooling configuration for this project.

## Configuration Files

### `.editorconfig`

EditorConfig helps maintain consistent coding styles across different editors and IDEs.

**Key Settings:**

- **Charset:** UTF-8
- **End of Line:** LF (Unix-style)
- **Indent Style:** Spaces (2 spaces for TS/JS/JSON)
- **Max Line Length:** 100 characters
- **Trailing Whitespace:** Trimmed (except in Markdown)
- **Final Newline:** Always inserted

### `.prettierrc.json`

Prettier is used for automatic code formatting.

**Key Settings:**

- **Print Width:** 100 characters
- **Tab Width:** 2 spaces
- **Semicolons:** Required
- **Quotes:** Double quotes
- **Trailing Commas:** ES5-compatible
- **Arrow Parens:** Always
- **Bracket Spacing:** Enabled
- **End of Line:** LF

### `eslint.config.js`

ESLint enforces code quality and prevents common errors.

**Key Rules:**

- **Complexity:** Maximum cyclomatic complexity of 3
- **TypeScript:** Strict type checking, no explicit `any`
- **Imports:** Alphabetically sorted, organized by groups
- **Unused Variables:** Error (except for variables prefixed with `_`)

## Scripts

### Formatting

```bash
# Format all files
pnpm format

# Check formatting without modifying files
pnpm format:check
```

### Linting

```bash
# Run ESLint across all packages
pnpm lint

# Fix auto-fixable ESLint issues
pnpm lint:fix
```

### Quality Checks

```bash
# Run all quality checks (format, lint, tests, complexity, duplication)
pnpm quality

# Check cyclomatic complexity
pnpm quality:complexity

# Check code duplication
pnpm quality:duplication
```

## VS Code Integration

The `.vscode/settings.json` file configures VS Code to:

- Format files on save using Prettier
- Auto-fix ESLint issues on save
- Use workspace TypeScript version
- Exclude build artifacts from search

### Recommended Extensions

Install the following VS Code extensions for the best experience:

- **Prettier - Code formatter** (`esbenp.prettier-vscode`)
- **ESLint** (`dbaeumer.vscode-eslint`)
- **EditorConfig for VS Code** (`editorconfig.editorconfig`)
- **TypeScript Nightly** (`ms-vscode.vscode-typescript-next`)

## Consistency Between Tools

All three tools (EditorConfig, Prettier, ESLint) are configured to work together:

| Setting             | EditorConfig | Prettier  | ESLint         |
| ------------------- | ------------ | --------- | -------------- |
| Indent              | 2 spaces     | 2 spaces  | ✓ Enforced     |
| Line Length         | 100 chars    | 100 chars | N/A            |
| End of Line         | LF           | LF        | N/A            |
| Trailing Whitespace | Trimmed      | Trimmed   | N/A            |
| Final Newline       | Required     | Required  | N/A            |
| Semicolons          | N/A          | Required  | ✓ Enforced     |
| Quotes              | N/A          | Double    | N/A            |
| Import Order        | N/A          | N/A       | ✓ Alphabetical |

## Pre-commit Workflow

Before committing code:

1. **Format:** `pnpm format`
2. **Lint:** `pnpm lint:fix`
3. **Quality:** `pnpm quality`
4. **Build:** `pnpm build`
5. **Test:** `pnpm test`

## Troubleshooting

### Formatting Issues

If Prettier and ESLint disagree:

1. Format with Prettier first: `pnpm format`
2. Then fix ESLint issues: `pnpm lint:fix`
3. ESLint should not modify formatting that Prettier handles

### Editor Integration Not Working

1. Ensure all recommended VS Code extensions are installed
2. Reload VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Check that `.editorconfig` is at the project root
4. Verify `node_modules` contains Prettier and ESLint

### Complexity Violations

If you encounter complexity violations:

- Extract methods to break down complex logic
- Each method should have cyclomatic complexity ≤ 3
- Use helper functions, maps, and early returns to simplify
