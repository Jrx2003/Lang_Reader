<template>
  <div class="project-form">
    <!-- Form title -->
    <h1 class="form-title">{{ isEditing ? 'Edit Project' : 'New Project' }}</h1>
    
    <!-- Error alert -->
    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <!-- Project form -->
    <form @submit.prevent="submitForm" class="form">
      <div class="form-group">
        <label for="projectName">Project Name</label>
        <input 
          type="text" 
          id="projectName" 
          name="projectName"
          v-model="formData.name" 
          class="form-control"
          required
          placeholder="Enter project name..."
          :disabled="loading"
          aria-label="Project name"
        >
      </div>
      
      <div class="form-group">
        <label for="projectDescription">Project Description</label>
        <textarea 
          id="projectDescription" 
          name="projectDescription"
          v-model="formData.description" 
          class="form-control"
          rows="4"
          placeholder="Enter project description..."
          :disabled="loading"
          aria-label="Project description"
        ></textarea>
      </div>
      
      <!-- Only show video URL in create mode, not edit mode -->
      <div v-if="!isEditing" class="form-group">
        <label for="videoUrl">Video URL</label>
        <input 
          type="text" 
          id="videoUrl" 
          name="videoUrl"
          v-model="formData.videoUrl" 
          class="form-control"
          placeholder="Enter YouTube video URL or direct video link..."
          :disabled="loading"
          aria-label="Video URL"
          @input="validateVideoUrl"
        >
        <small class="form-text text-muted">
          Supports YouTube links or direct video file URLs
        </small>
        
        <!-- Simple video preview -->
        <div v-if="isValidYoutubeUrl && formData.videoUrl" class="video-preview mt-3">
          <h4>Video Preview:</h4>
          <div class="video-preview-container">
            <iframe 
              :src="getYoutubeEmbedUrl(formData.videoUrl)" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
            ></iframe>
          </div>
        </div>
      </div>
      
      <div class="form-actions">
        <button 
          type="button" 
          @click="$router.back()" 
          class="btn btn-secondary"
          :disabled="loading"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="loading || !formData.name"
        >
          {{ loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Project') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch } from 'vue'
import { useProjectsStore } from '../store/projects'
import { useRouter } from 'vue-router'

// Component props
const props = defineProps({
  project: {
    type: Object,
    default: () => ({
      name: '',
      description: '',
      videoUrl: ''
    })
  },
  isEditing: {
    type: Boolean,
    default: false
  }
})

// Component events
const emit = defineEmits(['save', 'update', 'cancel'])

// Get router and state management
const router = useRouter()
const projectsStore = useProjectsStore()

// Form data
const formData = ref({
  name: '',
  description: '',
  videoUrl: ''
})

// Video validation
const isValidYoutubeUrl = ref(false)

const validateVideoUrl = () => {
  const url = formData.value.videoUrl
  
  // Check if it's a valid YouTube URL
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
  isValidYoutubeUrl.value = youtubeRegex.test(url)
}

const getYoutubeEmbedUrl = (url) => {
  if (!url) return ''
  
  // Handle youtu.be format
  if (url.includes('youtu.be')) {
    const videoId = url.split('/').pop().split('?')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }
  
  // Handle youtube.com format
  if (url.includes('youtube.com/watch')) {
    const videoId = new URL(url).searchParams.get('v')
    return `https://www.youtube.com/embed/${videoId}`
  }
  
  return url
}

// Form state
const loading = computed(() => projectsStore.loading)
const error = computed(() => projectsStore.error)

// Initialize form data
watch(() => props.project, (newProject) => {
  if (newProject) {
    formData.value = { ...newProject }
    validateVideoUrl()
  }
}, { immediate: true })

// Submit form
const submitForm = async () => {
  try {
    if (props.isEditing) {
      await projectsStore.updateProject(props.project.id, {
        name: formData.value.name,
        description: formData.value.description,
        // Don't update the videoUrl in edit mode
        // videoUrl: formData.value.videoUrl
      })
      emit('update', props.project.id)
    } else {
      const newProject = await projectsStore.addProject({
        name: formData.value.name,
        description: formData.value.description,
        videoUrl: formData.value.videoUrl
      })
      emit('save', newProject)
      
      // 直接跳转到项目编辑页面，而不是返回列表
      if (newProject && newProject._id) {
        router.push(`/projects/${newProject._id}/edit`)
      }
    }
  } catch (error) {
    console.error('Failed to save project:', error)
  }
}
</script>

<style scoped>
.project-form {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
  background-color: var(--card-bg);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-title {
  margin-bottom: 1.5rem;
  color: var(--text-color);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.video-preview-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
  height: 0;
  overflow: hidden;
  margin-top: 0.5rem;
  border-radius: 4px;
}

.video-preview-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.mt-3 {
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .project-form {
    padding: 1.5rem;
  }
}
</style> 