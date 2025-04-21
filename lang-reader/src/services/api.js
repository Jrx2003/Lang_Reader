import axios from 'axios'

// Project-related API

/**
 * Get all projects list
 * @returns {Promise<Array>} Project list
 */
export async function getProjects() {
  const response = await axios.get('/projects')
  return response.data
}

/**
 * Get single project details
 * @param {string|number} id Project ID
 * @returns {Promise<Object>} Project details
 */
export async function getProject(id) {
  if (!id) {
    throw new Error('Project ID is required')
  }
  
  const response = await axios.get(`/projects/${id}`)
  return response.data
}

/**
 * Create new project
 * @param {Object} project Project data
 * @returns {Promise<Object>} Created project
 */
export async function createProject(project) {
  const response = await axios.post('/projects', {
    ...project,
    createdAt: new Date().toISOString(),
    breakpoints: [],
    notesText: ''
  })
  return response.data
}

/**
 * Update project information
 * @param {string|number} id Project ID
 * @param {Object} data Updated data
 * @returns {Promise<Object>} Updated project
 */
export async function updateProject(id, data) {
  if (!id) {
    throw new Error('Project ID is required')
  }
  
  // Ensure notesText is properly sent as a string
  if (data.notesText !== undefined) {
    data.notesText = String(data.notesText)
  }
  
  const response = await axios.put(`/projects/${id}`, data)
  return response.data
}

/**
 * Delete project
 * @param {string|number} id Project ID
 * @returns {Promise<void>}
 */
export async function deleteProject(id) {
  if (!id) {
    throw new Error('Project ID is required')
  }
  
  await axios.delete(`/projects/${id}`)
}

/**
 * Add breakpoint to project
 * @param {string|number} projectId Project ID
 * @param {Object} breakpoint Breakpoint data {time, note}
 * @returns {Promise<Object>} Updated project
 */
export async function addBreakpoint(projectId, breakpoint) {
  if (!projectId) {
    throw new Error('Project ID is required')
  }
  
  const project = await getProject(projectId)
  const updatedBreakpoints = [...project.breakpoints, breakpoint]
  return updateProject(projectId, { breakpoints: updatedBreakpoints })
}

/**
 * Update project breakpoint
 * @param {string|number} projectId Project ID
 * @param {number} index Breakpoint index
 * @param {Object} breakpoint Updated breakpoint data
 * @returns {Promise<Object>} Updated project
 */
export async function updateBreakpoint(projectId, index, breakpoint) {
  if (!projectId) {
    throw new Error('Project ID is required')
  }
  
  const project = await getProject(projectId)
  const updatedBreakpoints = [...project.breakpoints]
  updatedBreakpoints[index] = breakpoint
  return updateProject(projectId, { breakpoints: updatedBreakpoints })
}

/**
 * Delete project breakpoint
 * @param {string|number} projectId Project ID
 * @param {number} index Breakpoint index
 * @returns {Promise<Object>} Updated project
 */
export async function deleteBreakpoint(projectId, index) {
  if (!projectId) {
    throw new Error('Project ID is required')
  }
  
  const project = await getProject(projectId)
  const updatedBreakpoints = project.breakpoints.filter((_, i) => i !== index)
  return updateProject(projectId, { breakpoints: updatedBreakpoints })
}

/**
 * Update project notes
 * @param {string|number} projectId Project ID
 * @param {string} notesText Notes content
 * @returns {Promise<Object>} Updated project
 */
export async function updateNotes(projectId, notesText) {
  if (!projectId) {
    throw new Error('Project ID is required')
  }
  
  // Ensure notesText is a string
  const notes = String(notesText || '')
  
  return updateProject(projectId, { notesText: notes })
} 