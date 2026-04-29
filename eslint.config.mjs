import { defineConfig } from 'eslint/config';
import tseslint from '@electron-toolkit/eslint-config-ts';
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier';

export default defineConfig(
  {
    ignores: ['**/node_modules', '**/dist', '**/out', 'old/**', '**/generated/**']
  },
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error'
    }
  },
  eslintConfigPrettier
);
