import stylistic from '@stylistic/eslint-plugin'

export default {
  plugins: {
    '@stylistic': stylistic
  },
  rules: {
    semi: ['error', 'never'], // идентичные кавычки вокруг 'semi'
    'comma-dangle': ['error', 'always-multiline'],
    'arrow-parens': ['error', 'always'],
    'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    'eol-last': ['error', 'always'],
    'no-multiple-empty-lines': ['error', { max: 0 }],
    'quote-props': ['error', 'as-needed'],
  },
}

