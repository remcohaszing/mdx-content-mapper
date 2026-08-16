/**
 * @import { MapperDiagnostic } from '../protocol.js'
 */

import { inspect } from 'node:util'

import { VFileMessage } from 'vfile-message'

import { nonNull } from './misc.js'

/**
 * Convert an error to a mapper diagnostic.
 *
 * @param {unknown} error
 *   The error — or non-error value — that was thrown.
 * @returns {MapperDiagnostic}
 *   A TypeScript mapper diagnostic that represents the error.
 */
export function toDiagnostic(error) {
  if (!error) {
    return {
      messageText: 'An unexpected error occurred',
      start: 0,
      length: 0
    }
  }

  if (error instanceof VFileMessage) {
    const { place, reason } = error
    if (!place) {
      return {
        messageText: reason,
        start: 0,
        length: 0
      }
    }

    if ('start' in place) {
      return {
        messageText: reason,
        start: nonNull(place.start.offset),
        length: nonNull(place.end.offset) - nonNull(place.start.offset)
      }
    }

    return {
      messageText: reason,
      start: nonNull(place.offset),
      length: 0
    }
  }

  if (error instanceof Error) {
    return {
      messageText: error.message,
      start: 0,
      length: 0
    }
  }

  return {
    messageText: inspect(error, { colors: false, compact: true }),
    start: 0,
    length: 0
  }
}
