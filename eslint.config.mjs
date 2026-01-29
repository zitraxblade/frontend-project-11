import stylistic from '@stylistic/eslint-plugin'

export default {
  plugins: {
    '@stylistic': stylistic,
  },
  rules: {
    semi: ['error', 'never'],
    commaDangle: ['error', 'always-multiline'],
    arrowParens: ['error', 'always'],
    braceStyle: ['error', '1tbs', { allowSingleLine: false }],
    eolLast: ['error', 'always'],
    noMultipleEmptyLines: ['error', { max: 0 }],
    quoteProps: ['error', 'as-needed'],
  },
}
