import js from '@eslint/js';
import globals from 'globals';
export default [
  { ignores: ['dist/**', 'node_modules/**', '.qa/**', 'src/**/*.ts'] },
  js.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }] } },
];
