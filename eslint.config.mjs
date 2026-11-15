import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules', 'playwright-report', 'test-results', 'results', 'site/dist'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Una promesa sin await en una prueba es un falso verde.
      '@typescript-eslint/no-floating-promises': 'error',
    },
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
  },
  // node:test devuelve una promesa por cada test() y no hay que esperarla.
  { files: ['scripts/**/*.test.ts'], rules: { '@typescript-eslint/no-floating-promises': 'off' } },
  { files: ['**/*.mjs'], ...tseslint.configs.disableTypeChecked },
);
