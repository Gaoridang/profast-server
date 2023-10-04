module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  extends: ['airbnb', 'airbnb/hooks', 'standard-with-typescript', 'prettier'],
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    semi: ['error', 'always'],
    'no-console': 'off',
    'no-multiple-empty-lines': 'error',
  },
};
