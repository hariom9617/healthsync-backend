module.exports = {
  env: {
    es2022: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  plugins: ['import'],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': 'error',
    'import/no-duplicates': 'error',
    'import/order': 'warn'
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js']
      }
    }
  }
};
