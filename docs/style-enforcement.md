# Code Style Enforcement Summary

## Overview

This project enforces strict coding conventions through automated tooling inspired by [eslint-config-hardcore](https://github.com/EvgenyOrekhov/eslint-config-hardcore). All conventions are automatically checked during CI/CD and can be verified locally.

**Hardcore-Inspired Plugins**: 220+ additional rules from unicorn, sonarjs, security, and promise plugins.

## Enforced Conventions

### 1. No Private Methods (via JSDoc + Manual Review)

**Rule**: Private methods are considered a code smell and must be extracted into utility classes.

**Enforcement**:

- ESLint `jsdoc/require-jsdoc` requires documentation on all methods
- Code review process checks for proper utility class extraction
- All step implementations follow the utility class pattern

**Example Violation**:

```typescript
// ❌ This will be flagged in code review
class MyStep {
  private helperMethod() {} // Private method - should be extracted
}
```

**Correct Pattern**:

```typescript
// ✅ Properly extracted utility class
export class MyHelper {
  helperMethod() {} // Public utility method
}

class MyStep {
  constructor(readonly helper = new MyHelper()) {}
}
```

### 2. Comprehensive JSDoc Documentation

**Rule**: Every function, class, interface, type, and enum must have JSDoc with descriptions and parameter documentation.

**Enforcement**: ESLint with `eslint-plugin-jsdoc`

**Rules Active**:

- `jsdoc/require-jsdoc`: Requires JSDoc on all functions, methods, classes
- `jsdoc/require-description`: Requires description text
- `jsdoc/require-param`: Requires @param for all parameters
- `jsdoc/require-param-description`: Requires parameter descriptions
- `jsdoc/require-returns`: Requires @returns for non-void functions
- `jsdoc/require-returns-description`: Requires return value descriptions

**Verification**:

```bash
pnpm eslint . --max-warnings 0
```

### 3. Low Cyclomatic Complexity

**Rule**: Maximum cyclomatic complexity of 3 per function.

**Enforcement**: ESLint `complexity` rule

**Configuration**:

```javascript
complexity: ["error", { max: 3 }];
```

**Verification**:

```bash
pnpm quality:complexity
```

### 4. Code Duplication

**Rule**: Less than 2% code duplication across the codebase.

**Enforcement**: JSCPD (JavaScript Copy/Paste Detector)

**Configuration**: `.jscpd.json`

```json
{
  "threshold": 2,
  "reporters": ["html", "console"],
  "ignore": ["**/node_modules/**", "**/dist/**"],
  "format": ["typescript"]
}
```

**Verification**:

```bash
pnpm quality:duplication
```

### 5. Import Organization

**Rule**: Imports must be sorted and grouped consistently.

**Enforcement**: ESLint `import` plugin

**Rules Active**:

- `import/order`: Groups and sorts imports
- `import/first`: Ensures imports at top of file
- `import/newline-after-import`: Blank line after imports
- `import/no-duplicates`: No duplicate imports
- `sort-imports`: Alphabetical member sorting

**Verification**: Automatically fixed by `pnpm lint:fix`

### 6. Code Formatting

**Rule**: Consistent formatting across all TypeScript, JavaScript, JSON, and Markdown files.

**Enforcement**: Prettier

**Configuration**: `.prettierrc.json`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

**Verification**:

```bash
pnpm format:check
pnpm format  # Auto-fix
```

### 7. Editor Consistency

**Rule**: Consistent editor settings across all team members.

**Enforcement**: EditorConfig

**Configuration**: `.editorconfig`

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
max_line_length = 100
trim_trailing_whitespace = true
```

## Quality Gates

All of these checks must pass before code can be merged:

```bash
# Run all quality checks
pnpm quality
```

This command runs:

1. `pnpm format:check` - Prettier formatting check
2. `pnpm lint` - ESLint with all rules
3. `pnpm test:coverage` - Test coverage ≥80%
4. `pnpm quality:complexity` - Complexity ≤3
5. `pnpm quality:duplication` - Duplication <2%

## CI/CD Integration

GitHub Actions workflow (`.github/workflows/quality.yml`) runs all checks on:

- Every pull request
- Every push to main branch

**Status**: ✅ All checks must pass for PR approval

## Local Development

### Pre-commit Checks

Recommended: Install pre-commit hooks

```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
pnpm format
pnpm lint:fix
pnpm quality:complexity
```

### IDE Integration

**VS Code Settings** (`.vscode/settings.json`):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "typescript"]
}
```

**Required Extensions** (`.vscode/extensions.json`):

- `esbenp.prettier-vscode` - Prettier formatter
- `dbaeumer.vscode-eslint` - ESLint integration
- `editorconfig.editorconfig` - EditorConfig support

## Summary Table

| Convention           | Tool                          | Command                    | Rules  | Severity |
| -------------------- | ----------------------------- | -------------------------- | ------ | -------- |
| No Private Methods   | Manual Review + JSDoc         | `pnpm lint`                | 1      | Error    |
| JSDoc Documentation  | ESLint + jsdoc plugin         | `pnpm lint`                | 11     | Error    |
| Complexity ≤3        | ESLint complexity rule        | `pnpm quality:complexity`  | 1      | Error    |
| Duplication <2%      | JSCPD                         | `pnpm quality:duplication` | 1      | Error    |
| Import Organization  | ESLint import plugin          | `pnpm lint`                | 9      | Error    |
| Code Formatting      | Prettier                      | `pnpm format:check`        | N/A    | Error    |
| Editor Settings      | EditorConfig                  | N/A                        | N/A    | N/A      |
| Test Coverage ≥80%   | Vitest                        | `pnpm test:coverage`       | N/A    | Warning  |
| **Hardcore-Inspired**| **unicorn, sonarjs, security, perfectionist**| **`pnpm lint`**   | **230+**| **Error**|
| JavaScript Best Practices | eslint-plugin-unicorn    | `pnpm lint`                | ~105   | Error    |
| Code Smells & Bugs   | eslint-plugin-sonarjs         | `pnpm lint`                | ~86    | Error    |
| Security Vulnerabilities | eslint-plugin-security    | `pnpm lint`                | ~12    | Error    |
| Promise Best Practices | eslint-plugin-promise       | `pnpm lint`                | ~15    | Error    |
| **Auto-Sorting** 🔄 | **eslint-plugin-perfectionist** | **`pnpm lint:fix`**     | **~12** | **Error** |
| Class Members Sorting | perfectionist/sort-classes   | `pnpm lint:fix`            | 1      | Error    |
| Object Properties    | perfectionist/sort-objects    | `pnpm lint:fix`            | 1      | Error    |
| Interface Properties | perfectionist/sort-interfaces | `pnpm lint:fix`            | 1      | Error    |
| Enum Members         | perfectionist/sort-enums      | `pnpm lint:fix`            | 1      | Error    |
| Named Imports        | perfectionist/sort-named-imports | `pnpm lint:fix`         | 1      | Error    |
| Named Exports        | perfectionist/sort-named-exports | `pnpm lint:fix`         | 1      | Error    |
| Module Exports       | perfectionist/sort-exports    | `pnpm lint:fix`            | 1      | Error    |

## Reference Implementations

See these files for examples of properly implemented conventions:

- `packages/steps/src/csv-write.step.ts`
- `packages/steps/src/file-read.step.ts`
- `packages/steps/src/http.step.ts`
- `packages/steps/src/shell.step.ts`
- `packages/steps/src/git.step.ts`

Each demonstrates:

- ✅ Zero private methods
- ✅ Comprehensive JSDoc on every function
- ✅ Utility class extraction
- ✅ Complexity ≤3
- ✅ Clean, self-describing code
