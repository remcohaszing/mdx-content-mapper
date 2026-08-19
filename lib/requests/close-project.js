/**
 * @import { CloseProjectParams } from '../protocol.js'
 */

import { projects } from '../util/projects.js'

/**
 * @param {CloseProjectParams} params
 * @returns {undefined}
 */
export function closeProject(params) {
  projects.delete(params.projectHandle)
}
