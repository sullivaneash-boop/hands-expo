import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

// Sim purity (ARCHITECTURE §2, D-001): src/sim must stay deterministic and DOM-free.
const IMPURE_GLOBALS = [
  'window',
  'document',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'performance',
  'Date',
  'localStorage',
  'navigator',
  'fetch',
].map((name) => ({ name, message: 'src/sim must be pure: time comes from the tick, not the host.' }));

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage', 'scripts/out', 'public'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-howler',
              message: 'Deprecated. Use AudioManager (vanilla howler). See AGENTS.md.',
            },
            {
              name: 'zustand',
              importNames: ['default'],
              message: "Zustand v5: use `import { create } from 'zustand'`.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/sim/**/*.ts', 'src/data/**/*.ts', 'src/config/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-globals': ['error', ...IMPURE_GLOBALS],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use ctx.rng (seeded). See src/sim/rng.ts.' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'zustand', 'zustand/*', 'howler'],
              message: 'src/sim, src/data and src/config must not depend on UI, store or audio libraries.',
            },
            {
              group: [
                '**/engine/**',
                '**/ui/**',
                '**/store/**',
                '**/audio/**',
                '**/engine',
                '**/ui',
                '**/store',
                '**/audio',
              ],
              message: 'src/sim may import only src/sim, src/data and src/config.',
            },
          ],
        },
      ],
    },
  },
  {
    // Tests and test helpers assert on known fixtures; `!` keeps them readable.
    files: ['**/*.test.ts', 'src/sim/testkit.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
);
