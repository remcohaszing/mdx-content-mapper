/**
 * @import { OpenProjectParams, OpenProjectResult } from '../protocol.js'
 */

import { projects } from '../util/projects.js'

/**
 * @param {OpenProjectParams} params
 * @returns {OpenProjectResult}
 */
export function openProject(params) {
  projects.set(params.projectHandle, params)

  return {}
}
