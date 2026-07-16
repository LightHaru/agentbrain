// ESLint flat config (ESLint 9). Intentionally light: it exists to catch
// regressions (silent empty catches, obvious dead code) without drowning the
// codebase in style noise. Type-aware linting is off to keep it fast and
// dependency-light; tighten per-rule as the codebase is cleaned up.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'dashboard/**',
      'bench/**',
      'scripts/**',
      '**/*.bak',
      'snapshots/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      // Silent empty catches hide real failures — flag them (allow a commented
      // catch to document a deliberate ignore). This is the Phase 4 target.
      'no-empty': ['warn', { allowEmptyCatch: false }],
      // The codebase leans on `any` in places; downgrade to warn so it's
      // visible without blocking the build until it's cleaned up.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Non-null assertions are used deliberately in a few hot paths.
      '@typescript-eslint/no-non-null-assertion': 'off',
      // The following flag real-but-intentional patterns (ANSI-strip regexes,
      // a runtime require in the plugin entry, combined-diacritic char classes
      // for Vietnamese). Downgrade to warn so lint stays green; revisit in the
      // Phase 4 cleanup rather than blocking now.
      'no-control-regex': 'warn',
      'no-misleading-character-class': 'warn',
      'no-useless-escape': 'warn',
      'no-irregular-whitespace': 'warn',
      'prefer-const': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': 'off',
    },
  },
);
