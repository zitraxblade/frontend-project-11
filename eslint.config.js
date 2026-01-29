import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['src/**/*.{js,mjs,cjs}'], // проверяем только src
    ignores: ['dist/**', 'node_modules/**'], // игнорируем сборку и пакеты
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.browser, // браузерные глобалы: window, document
        bootstrap: 'readonly', // bootstrap как глобальный
      },
    },
  },
]);
