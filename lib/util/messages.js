/**
 * @import { Path } from './misc.js'
 * @import { OptionDiagnostic } from '../protocol.js'
 */

import { joinPath } from './misc.js'

// ---------------------------- //
// Generic configuration errors //
// ---------------------------- //

/**
 * @param {Path} path
 * @param {string} type
 * @returns {OptionDiagnostic}
 */
export function typeError(path, type) {
  return {
    path,
    messageText: `Content mapper option '${joinPath(path)}' requires a value of type ${type}.`,
    code: 1001
  }
}

/**
 * @param {Path} path
 * @param {string} compilerOption
 * @returns {OptionDiagnostic}
 */
export function dependsCompilerOption(path, compilerOption) {
  return {
    path,
    messageText: `Content mapper option '${joinPath(path)}' cannot be specified without specifying compiler option '${compilerOption}'.`,
    code: 1002
  }
}

/**
 * @param {Path} path
 * @param {string} value
 * @returns {OptionDiagnostic}
 */
export function expectExtension(path, value) {
  return {
    path,
    messageText: `File extension '${value}' must begin with a '.'.`,
    code: 1003
  }
}

/**
 * @param {Path} path
 * @param {unknown[]} allowed
 * @returns {OptionDiagnostic}
 */
export function enumError(path, allowed) {
  return {
    path,
    messageText: `Content mapper option '${joinPath(path)}' must be one of ${allowed.map((value) => `'${value}'`).join(', ')}.`,
    code: 1001
  }
}

// ---------------------------- //
// Plugin errors                //
// ---------------------------- //

/**
 * @param {Path} path
 * @param {string} value
 * @returns {OptionDiagnostic}
 */
export function unknownPluginError(path, value) {
  return {
    path,
    messageText: `Unknown plugin '${value}'.`,
    code: 2001
  }
}

/**
 * @param {Path} path
 * @param {string} value
 * @returns {OptionDiagnostic}
 */
export function unresolvedPluginError(path, value) {
  return {
    path,
    messageText: `Failed to load plugin '${value}'.`,
    code: 2001
  }
}
