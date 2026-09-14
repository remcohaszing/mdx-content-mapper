/**
 * @import { MappedOutput } from '../protocol.js'
 */

/** @type {Map<string, MappedOutput['extension']>} */
export const codeExtensions = new Map([
  ['cjs', '.cjs'],
  ['cts', '.cts'],
  ['javascript', '.js'],
  ['javascriptreact', '.jsx'],
  ['js', '.js'],
  ['json', '.json'],
  ['jsonc', '.json'],
  ['jsx', '.jsx'],
  ['mjs', '.mjs'],
  ['mts', '.mts'],
  ['ts', '.ts'],
  ['tsx', '.tsx'],
  ['typescript', '.ts'],
  ['typescriptreact', '.tsx']
])
