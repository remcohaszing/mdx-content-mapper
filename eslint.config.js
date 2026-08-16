import { define } from '@remcohaszing/eslint'

export default define([
  { ignores: ['fixtures', 'lib/protocol.ts'] },
  {
    rules: {
      'no-param-reassign': 'off',
      'import-x/no-relative-packages': 'off',
      'jsdoc/reject-any-type': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns-description': 'off',
      'unicorn/consistent-destructuring': 'off',
      'unicorn/prefer-code-point': 'off'
    }
  }
])
