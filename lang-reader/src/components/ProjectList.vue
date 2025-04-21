<template>
  <div class="project-list">
    <!-- Project list title and action buttons -->
    <div class="list-header">
      <h1>My Language Learning Projects</h1>
      <router-link to="/projects/new" class="btn btn-primary">
        Create New Project
      </router-link>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <p>Loading...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="alert alert-danger">
      <p>{{ error }}</p>
      <button @click="fetchProjects" class="btn btn-primary btn-sm mt-2">
        Retry
      </button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="sortedProjects.length === 0" class="empty-state">
      <p>You haven't created any projects yet</p>
      <router-link to="/projects/new" class="btn btn-primary mt-2">
        Create Your First Project
      </router-link>
    </div>
    
    <!-- Project list -->
    <div v-else class="project-grid">
      <div 
        v-for="project in sortedProjects" 
        :key="project._id"
        class="project-card"
      >
        <!-- Project thumbnail -->
        <div class="project-thumbnail" @click="navigateToProject(project._id)">
          <img 
            v-if="project.videoUrl && isYoutubeUrl(project.videoUrl)" 
            :src="getYoutubeThumbnail(project.videoUrl)" 
            :alt="project.name" 
            class="thumbnail-image"
          />
          <div v-else class="default-thumbnail">
            <span class="material-icons">videocam</span>
            <span v-if="!project.videoUrl" class="no-video-text">No video</span>
          </div>
        </div>
        
        <div class="project-header">
          <h3 class="project-title">{{ project.name }}</h3>
          <span class="project-date">{{ formatDate(project.createdAt) }}</span>
        </div>
        
        <div class="project-content">
          <p class="project-description">{{ truncateDescription(project.description) }}</p>
          <div class="project-stats">
            <span>{{ project.breakpoints?.length || 0 }} breakpoints</span>
          </div>
        </div>
        
        <div class="project-actions">
          <router-link 
            :to="`/projects/${project._id}/view`" 
            class="btn btn-sm btn-primary"
            title="View Project"
          >
            View
          </router-link>
          <router-link 
            :to="`/projects/${project._id}/edit`" 
            class="btn btn-sm btn-success"
            title="Edit Project"
          >
            Edit
          </router-link>
          <button 
            @click="confirmDelete(project)"
            class="btn btn-sm btn-danger"
            title="Delete Project"
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useProjectsStore } from '../store/projects'
import { useRouter } from 'vue-router'

// Get projects store and router
const projectsStore = useProjectsStore()
const router = useRouter()

// Get data and state from store
const sortedProjects = computed(() => projectsStore.sortedProjects)
const loading = computed(() => projectsStore.loading)
const error = computed(() => projectsStore.error)

// Navigate to project view
const navigateToProject = (id) => {
  router.push(`/projects/${id}/view`)
}

// Check if URL is YouTube
const isYoutubeUrl = (url) => {
  if (!url) return false
  return url.includes('youtube.com') || url.includes('youtu.be')
}

// Get YouTube thumbnail from URL
const getYoutubeThumbnail = (url) => {
  if (!url) return ''
  
  let videoId = ''
  
  // Extract video ID from YouTube URL
  if (url.includes('youtu.be')) {
    videoId = url.split('/').pop().split('?')[0]
  } else if (url.includes('youtube.com/watch')) {
    try {
      videoId = new URL(url).searchParams.get('v')
    } catch (e) {
      // Handle invalid URL format
      return ''
    }
  }
  
  // Return high quality thumbnail URL
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''
}

// Initialize and load projects
const fetchProjects = async () => {
  await projectsStore.fetchProjects()
}

// Confirm delete
const confirmDelete = (project) => {
  if (!project || !project._id) {
    console.error('Cannot delete project: Invalid project or missing ID')
    return
  }
  
  if (confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`)) {
    deleteProject(project._id)
  }
}

// Delete project
const deleteProject = async (id) => {
  if (!id) {
    console.error('Cannot delete project: Missing ID')
    return
  }
  
  try {
    await projectsStore.removeProject(id)
  } catch (error) {
    console.error('Failed to delete project:', error)
  }
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Truncate description text
const truncateDescription = (text, length = 100) => {
  if (!text) return 'No description'
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

// Load project list when component mounted
onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
.project-list {
  width: 100%;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: var(--card-bg);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.project-card {
  background-color: var(--card-bg);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.project-thumbnail {
  width: 100%;
  height: 168px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.project-thumbnail:hover .thumbnail-image {
  transform: scale(1.05);
}

.default-thumbnail {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.default-thumbnail .material-icons {
  font-size: 48px;
  opacity: 0.6;
}

.no-video-text {
  margin-top: 8px;
  font-size: 14px;
  opacity: 0.7;
}

.project-header {
  padding: 1rem;
  background-color: var(--bg-color);
  border-bottom: 1px solid var(--input-border);
}

.project-title {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-color);
}

.project-date {
  display: block;
  font-size: 0.8rem;
  color: var(--text-color);
  opacity: 0.7;
  margin-top: 0.3rem;
}

.project-content {
  padding: 1rem;
  flex: 1;
}

.project-description {
  margin-bottom: 1rem;
  color: var(--text-color);
  font-size: 0.9rem;
  line-height: 1.5;
}

.project-stats {
  font-size: 0.8rem;
  color: var(--text-color);
  opacity: 0.7;
}

.project-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background-color: var(--bg-color);
  border-top: 1px solid var(--input-border);
}

.mt-2 {
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .project-grid {
    grid-template-columns: 1fr;
  }
}
</style> 