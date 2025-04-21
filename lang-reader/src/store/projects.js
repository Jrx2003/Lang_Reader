import { defineStore } from 'pinia'
import { 
  getProjects, 
  getProject, 
  createProject, 
  updateProject, 
  deleteProject,
  addBreakpoint,
  updateBreakpoint,
  deleteBreakpoint,
  updateNotes
} from '../services/api'

// Define projects store
export const useProjectsStore = defineStore('projects', {
  // State
  state: () => ({
    projects: [],
    currentProject: null,
    loading: false,
    error: null
  }),

  // Getters
  getters: {
    // Projects list sorted by creation date
    sortedProjects: (state) => {
      return [...state.projects].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
    },
    
    // Get sorted breakpoints list
    sortedBreakpoints: (state) => {
      if (!state.currentProject || !state.currentProject.breakpoints) {
        return []
      }
      return [...state.currentProject.breakpoints].sort((a, b) => a.time - b.time)
    }
  },

  // Actions
  actions: {
    // Load all projects
    async fetchProjects() {
      this.loading = true
      this.error = null
      try {
        this.projects = await getProjects()
      } catch (error) {
        console.error('Failed to fetch projects:', error)
        this.error = 'Failed to load project list'
      } finally {
        this.loading = false
      }
    },

    // Load single project details
    async fetchProject(id) {
      this.loading = true
      this.error = null
      try {
        this.currentProject = await getProject(id)
      } catch (error) {
        console.error(`Failed to fetch project ${id}:`, error)
        this.error = 'Failed to load project details'
      } finally {
        this.loading = false
      }
    },

    // Create new project
    async addProject(project) {
      this.loading = true
      this.error = null
      try {
        const newProject = await createProject(project)
        this.projects.push(newProject)
        return newProject
      } catch (error) {
        console.error('Failed to create project:', error)
        this.error = 'Failed to create project'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update project
    async updateProject(id, data) {
      if (!id) {
        this.error = 'Cannot update project: Missing ID'
        throw new Error('Project ID is required')
      }
      
      this.loading = true
      this.error = null
      try {
        const updatedProject = await updateProject(id, data)
        
        // Update project in the projects list
        const index = this.projects.findIndex(p => p._id === id)
        if (index !== -1) {
          this.projects[index] = updatedProject
        }
        
        // If editing this project, also update current project
        if (this.currentProject && this.currentProject._id === id) {
          this.currentProject = updatedProject
        }
        
        return updatedProject
      } catch (error) {
        console.error(`Failed to update project ${id}:`, error)
        this.error = 'Failed to update project'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Delete project
    async removeProject(id) {
      if (!id) {
        this.error = 'Cannot delete project: Missing ID'
        throw new Error('Project ID is required')
      }
      
      this.loading = true
      this.error = null
      try {
        await deleteProject(id)
        this.projects = this.projects.filter(p => p._id !== id)
        
        // If deleted the current project, clear current project
        if (this.currentProject && this.currentProject._id === id) {
          this.currentProject = null
        }
      } catch (error) {
        console.error(`Failed to delete project ${id}:`, error)
        this.error = 'Failed to delete project'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Add breakpoint
    async addBreakpoint(breakpoint) {
      if (!this.currentProject) {
        this.error = 'No project selected, cannot add breakpoint'
        return
      }
      
      if (!this.currentProject._id) {
        this.error = 'Invalid project: Missing ID'
        return
      }
      
      // Avoid unnecessary loading state entirely for breakpoint operations
      this.error = null
      
      try {
        // Clone current breakpoints array to avoid mutation
        const newBreakpoints = [...this.currentProject.breakpoints, breakpoint]
        
        // Sort by time to maintain order
        newBreakpoints.sort((a, b) => a.time - b.time)
        
        // Update locally without replacing the entire project object
        // Use Object.assign to maintain reactivity without replacing the entire object
        if (this.currentProject) {
          // Update only the breakpoints array
          this.currentProject.breakpoints = newBreakpoints
        }
        
        // Make API call in background without waiting
        addBreakpoint(this.currentProject._id, breakpoint)
          .then(updatedProject => {
            // Optional: silently check if we need to sync with server data
            const serverBreakpoints = updatedProject.breakpoints || []
            if (JSON.stringify(serverBreakpoints) !== JSON.stringify(this.currentProject.breakpoints)) {
              console.log('Syncing breakpoints with server')
              this.currentProject.breakpoints = serverBreakpoints
            }
            
            // Update project in projects list without triggering UI refresh
            const index = this.projects.findIndex(p => p._id === this.currentProject._id)
            if (index !== -1) {
              // Only update the breakpoints array
              this.projects[index].breakpoints = this.currentProject.breakpoints
            }
          })
          .catch(error => {
            console.error('Background breakpoint sync failed:', error)
          })
        
        return this.currentProject
      } catch (error) {
        console.error('Failed to add breakpoint:', error)
        this.error = 'Failed to add breakpoint'
        throw error
      }
    },

    // Update breakpoint
    async updateBreakpoint(index, breakpoint) {
      if (!this.currentProject) {
        this.error = 'No project selected, cannot update breakpoint'
        return
      }
      
      if (!this.currentProject._id) {
        this.error = 'Invalid project: Missing ID'
        return
      }
      
      // Avoid loading state entirely for breakpoint operations
      this.error = null
      
      try {
        // Clone current breakpoints array to avoid mutation
        const updatedBreakpoints = [...this.currentProject.breakpoints]
        
        // 只更新特定索引位置的断点，创建新对象避免引用问题
        updatedBreakpoints[index] = { 
          ...updatedBreakpoints[index],
          ...breakpoint
        }
        
        // 为防止引用问题，创建新的断点数组
        this.currentProject = {
          ...this.currentProject,
          breakpoints: [...updatedBreakpoints]
        }
        
        // Make API call in background without waiting
        updateBreakpoint(this.currentProject._id, index, breakpoint)
          .then(updatedProject => {
            // Optional: silently check if we need to sync with server data
            const serverBreakpoints = updatedProject.breakpoints || []
            if (JSON.stringify(serverBreakpoints) !== JSON.stringify(this.currentProject.breakpoints)) {
              console.log('Syncing breakpoints with server')
              this.currentProject = {
                ...this.currentProject,
                breakpoints: [...serverBreakpoints]
              }
            }
            
            // Update project in projects list without triggering UI refresh
            const projectIndex = this.projects.findIndex(p => p._id === this.currentProject._id)
            if (projectIndex !== -1) {
              // 创建新对象避免引用问题
              this.projects[projectIndex] = {
                ...this.projects[projectIndex],
                breakpoints: [...this.currentProject.breakpoints]
              }
            }
          })
          .catch(error => {
            console.error('Background breakpoint sync failed:', error)
          })
        
        return this.currentProject
      } catch (error) {
        console.error('Failed to update breakpoint:', error)
        this.error = 'Failed to update breakpoint'
        throw error
      }
    },

    // Delete breakpoint
    async removeBreakpoint(index) {
      if (!this.currentProject) {
        this.error = 'No project selected, cannot delete breakpoint'
        return
      }
      
      if (!this.currentProject._id) {
        this.error = 'Invalid project: Missing ID'
        return
      }
      
      // Avoid loading state entirely for breakpoint operations
      this.error = null
      
      try {
        // Filter out the breakpoint to remove
        const updatedBreakpoints = this.currentProject.breakpoints.filter((_, i) => i !== index)
        
        // Update locally without replacing the entire project
        if (this.currentProject) {
          // Update only the breakpoints array
          this.currentProject.breakpoints = updatedBreakpoints
        }
        
        // Make API call in background without waiting
        deleteBreakpoint(this.currentProject._id, index)
          .then(updatedProject => {
            // Optional: silently check if we need to sync with server data
            const serverBreakpoints = updatedProject.breakpoints || []
            if (JSON.stringify(serverBreakpoints) !== JSON.stringify(this.currentProject.breakpoints)) {
              console.log('Syncing breakpoints with server')
              this.currentProject.breakpoints = serverBreakpoints
            }
            
            // Update project in projects list without triggering UI refresh
            const projectIndex = this.projects.findIndex(p => p._id === this.currentProject._id)
            if (projectIndex !== -1) {
              // Only update the breakpoints array
              this.projects[projectIndex].breakpoints = this.currentProject.breakpoints
            }
          })
          .catch(error => {
            console.error('Background breakpoint sync failed:', error)
          })
        
        return this.currentProject
      } catch (error) {
        console.error('Failed to delete breakpoint:', error)
        this.error = 'Failed to delete breakpoint'
        throw error
      }
    },

    // Update project notes
    async updateNotes(notesText) {
      if (!this.currentProject) {
        this.error = 'No project selected, cannot update notes'
        return
      }
      
      if (!this.currentProject._id) {
        this.error = 'Invalid project: Missing ID'
        return
      }
      
      this.loading = true
      this.error = null
      try {
        const updatedProject = await updateNotes(this.currentProject._id, notesText)
        this.currentProject = updatedProject
        
        // Update project in projects list
        const projectIndex = this.projects.findIndex(p => p._id === this.currentProject._id)
        if (projectIndex !== -1) {
          this.projects[projectIndex] = updatedProject
        }
        
        return updatedProject
      } catch (error) {
        console.error('Failed to update notes:', error)
        this.error = 'Failed to update notes'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Clear error message
    clearError() {
      this.error = null
    }
  }
}) 