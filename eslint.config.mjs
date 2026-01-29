export default [
  {
    ignores: ['node_modules', 'dist'],

    languageOptions: {
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
      globals: {
        bootstrap: 'readonly', // чтобы ESLint не ругался на bootstrap
      },
    },

    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },

    rules: {
      semi: ['error', 'never'],
      'comma-dangle': ['error', 'always-multiline'],
      'arrow-parens': ['error', 'always'],
      'brace-style': ['error', '1tbs', { allowSingleLine: false }],
      'eol-last': ['error', 'always'],
    },
  },
]
