/**
 * @import { OpenProjectParams, OpenProjectResult } from '../protocol.js'
 */

import { normalizeOptions, projects } from '../util/projects.js'

/**
 * @param {OpenProjectParams} params
 * @returns {Promise<OpenProjectResult>}
 */
export async function openProject(params) {
  const [project, optionDiagnostics] = await normalizeOptions(params)
  projects.set(params.projectHandle, project)

  return { optionDiagnostics }
}
