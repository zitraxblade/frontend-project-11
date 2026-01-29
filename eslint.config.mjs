import stylistic from '@stylistic/eslint-plugin'

export default {
  plugins: {
    '@stylistic': stylistic,
  },
  rules: {
    semi: ['error', 'never'],
    'comma-dangle': ['error', 'always-multiline'],
    'arrow-parens': ['error', 'always'],
    'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    'eol-last': ['error', 'always'],
  },
}

