# Code Quality Enforcement

This project enforces strict code quality standards through automated tooling and checks.

## Quality Standards

### 1. Test Coverage (80% minimum)

All code must maintain at least 80% test coverage across:

- Lines
- Functions
- Branches
- Statements

**Run coverage check:**

```bash
pnpm test:coverage
```

Coverage reports are generated in:

- `coverage/` directory (HTML, JSON, LCOV formats)

### 2. Cyclomatic Complexity (Maximum: 3)

Functions must have a cyclomatic complexity of 3 or less to ensure maintainability and testability.

**What is Cyclomatic Complexity?**
It measures the number of linearly independent paths through a program's source code. Lower complexity means:

- Easier to understand
- Easier to test
- Fewer bugs
- Better maintainability

**Enforced by ESLint:**

```javascript
'complexity': ['error', { max: 3 }]
```

**Check complexity:**

```bash
pnpm quality:complexity
```

**Tips to reduce complexity:**

- Extract conditional logic into separate functions
- Use early returns to avoid nested conditions
- Break down large functions into smaller ones
- Use object/map lookups instead of switch/if-else chains

### 3. Code Duplication (Maximum: 2%)

Code duplication must be kept below 2% to ensure DRY principles.

**Enforced by JSCPD:**

- Minimum 5 lines or 50 tokens to detect clones
- Strict mode enabled
- Reports generated in `jscpd-report/`

**Check duplication:**

```bash
pnpm quality:duplication
```

**View detailed report:**
Open `jscpd-report/html/index.html` in your browser

**Tips to reduce duplication:**

- Extract common code into utility functions
- Use composition over duplication
- Create base classes or shared modules
- Use configuration objects for variations

### 4. ESLint Rules

**Import Organization:**

- Imports must be sorted alphabetically
- Grouped by: builtin → external → internal → parent/sibling → index → object → type
- No duplicate imports allowed
- Must resolve correctly (no unresolved imports)
- No circular dependencies

**TypeScript:**

- No explicit `any` types
- No unused variables (except prefixed with `_`)
- No floating promises
- No misused promises
- Await only on thenables

**Run lint check:**

```bash
pnpm lint
```

**Auto-fix issues:**

```bash
pnpm lint:fix
```

## Running All Quality Checks

Run all quality checks at once:

```bash
pnpm quality
```

This runs:

1. ESLint (with import sorting and complexity checks)
2. Test coverage (80% threshold)
3. Cyclomatic complexity validation (max 3)
4. Code duplication detection (max 2%)

## Pre-commit Recommendations

Consider adding these checks to your pre-commit hooks:

```bash
# .husky/pre-commit
pnpm lint:fix
pnpm test:coverage
pnpm quality:complexity
pnpm quality:duplication
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Quality Checks
  run: pnpm quality
```

This ensures all quality standards are met before merging code.

## Configuration Files

- **ESLint**: `eslint.config.js`
- **Vitest**: `vitest.config.ts`
- **JSCPD**: `.jscpd.json`
- **TypeScript**: `tsconfig.json`

## Viewing Reports

After running quality checks, view detailed reports:

### Coverage Report

```bash
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

### Duplication Report

```bash
open jscpd-report/html/index.html  # macOS
start jscpd-report/html/index.html # Windows
```

## Ignoring Files

To exclude files from quality checks, update:

1. **ESLint**: Add to `ignores` array in `eslint.config.js`
2. **Vitest**: Add to `coverage.exclude` in `vitest.config.ts`
3. **JSCPD**: Add to `ignore` array in `.jscpd.json`

## Troubleshooting

### High Complexity Errors

If you get complexity errors:

1. Break down the function into smaller functions
2. Extract conditional logic
3. Use early returns
4. Consider using the strategy pattern

### Duplication Detected

If duplication exceeds 2%:

1. Review the JSCPD HTML report to see duplicates
2. Extract common code into shared utilities
3. Use composition patterns
4. Create reusable components

### Import Errors

If imports are out of order:

1. Run `pnpm lint:fix` to auto-sort
2. Ensure `import/resolver` is configured correctly
3. Check for circular dependencies

## Support

For questions about quality standards, see:

- [ESLint Documentation](https://eslint.org/)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
- [JSCPD Documentation](https://github.com/kucherenko/jscpd)
