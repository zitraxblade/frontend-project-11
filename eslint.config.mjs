import stylistic from '@stylistic/eslint-plugin'
export default {
  plugins: {
    stylistic,
  },
  rules: {
    'stylistic/quote-props': ['error', 'consistent'],
    'stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
    'stylistic/arrow-parens': ['error', 'as-needed'],
    'stylistic/comma-dangle': ['error', 'always-multiline'],
    'stylistic/no-multiple-empty-lines': ['error', { max: 0 }],
  },
}
