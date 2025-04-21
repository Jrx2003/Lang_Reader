<template>
  <div class="project-view">
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <p>Loading project...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="alert alert-danger">
      <p>{{ error }}</p>
      <button @click="loadProject" class="btn btn-primary btn-sm mt-2">
        Retry
      </button>
      <router-link to="/projects" class="btn btn-secondary btn-sm mt-2 ml-2">
        Return to Project List
      </router-link>
    </div>
    
    <!-- Project view interface -->
    <div v-else-if="project" class="project-content">
      <!-- Main content area with video, controls and notes -->
      <div v-if="videoUrl" class="main-content-area">
        <!-- Left column: Video and loop controls -->
        <div class="left-column">
          <!-- Video editor - 只读模式不允许添加断点 -->
          <div class="editor-panel video-editor-container">
            <keep-alive>
              <VideoEditor 
                :video-url="videoUrl" 
                :project-id="projectId"
                ref="videoEditorRef"
                @update:current-time="updateCurrentTime"
                @update:duration="updateDuration"
                @update:loop-status="updateLoopStatus"
                :key="videoUrl"
                :read-only="true"
              />
            </keep-alive>
          </div>
          
          <!-- Loop controls -->
          <div class="editor-panel loop-controls">
            <h3>Breakpoint Loop Controls</h3>
            
            <div class="breakpoint-selectors">
              <div class="form-group">
                <label for="loopStartSelect">Start Breakpoint:</label>
                <select 
                  id="loopStartSelect"
                  name="loopStartSelect"
                  v-model="loopStart" 
                  class="form-control"
                  aria-label="Select start breakpoint"
                >
                  <option :value="null">Select starting breakpoint</option>
                  <option 
                    v-for="(breakpoint, index) in sortedBreakpoints" 
                    :key="`start-${index}`"
                    :value="index"
                  >
                    {{ index + 1 }}. {{ formatTime(breakpoint.time) }} {{ breakpoint.note ? `- ${breakpoint.note}` : '' }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="loopEndSelect">End Breakpoint:</label>
                <select 
                  id="loopEndSelect"
                  name="loopEndSelect"
                  v-model="loopEnd" 
                  class="form-control"
                  aria-label="Select end breakpoint"
                >
                  <option :value="null">Select ending breakpoint</option>
                  <option 
                    v-for="(breakpoint, index) in sortedBreakpoints" 
                    :key="`end-${index}`"
                    :value="index"
                    :disabled="loopStart !== null && index <= loopStart"
                  >
                    {{ index + 1 }}. {{ formatTime(breakpoint.time) }} {{ breakpoint.note ? `- ${breakpoint.note}` : '' }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="loop-parameters">
              <div class="form-group">
                <label for="loopCountInput">Loop Count:</label>
                <input 
                  type="number" 
                  id="loopCountInput"
                  name="loopCountInput"
                  v-model.number="loopCount" 
                  min="1" 
                  max="20"
                  class="form-control" 
                  aria-label="Number of loops"
                />
              </div>
              
              <div class="form-group">
                <label for="waitMsInput">Wait Time (milliseconds):</label>
                <input 
                  type="number" 
                  id="waitMsInput"
                  name="waitMsInput"
                  v-model.number="waitMs" 
                  min="0" 
                  max="10000"
                  class="form-control" 
                  aria-label="Wait time between loops"
                />
              </div>
            </div>
            
            <div class="loop-controls-row">
              <div class="loop-buttons">
                <button 
                  @click="startLoop" 
                  class="btn btn-success"
                  :disabled="loopStart === null || loopEnd === null || isLooping"
                  type="button"
                >
                  Start Breakpoint Loop
                </button>
                <button 
                  @click="stopLoop" 
                  class="btn btn-danger"
                  :disabled="!isLooping"
                  type="button"
                >
                  Stop Loop
                </button>
              </div>
              
              <div v-if="isLooping" class="loop-status">
                <p>Looping: {{ currentLoopCount }} / {{ loopCount }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right column: Breakpoint list and notes -->
        <div class="right-column">
          <!-- Breakpoints list - 只读模式 -->
          <div class="editor-panel breakpoint-list-container">
            <keep-alive>
              <BreakpointList
                :breakpoints="sortedBreakpoints"
                :read-only="true"
                @seek="seekToTime"
                :key="'breakpoint-list'"
              />
            </keep-alive>
          </div>
          
          <!-- Project notes - 只读模式 -->
          <div class="editor-panel project-notes">
            <h3>Project Notes</h3>
            <div class="notes-content">
              <p v-if="!notesText">No notes available</p>
              <p v-else class="notes-text">{{ notesText }}</p>
            </div>
            
            <div class="edit-actions">
              <router-link :to="`/projects/${projectId}/edit`" class="btn btn-primary">
                Edit Project
              </router-link>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 无视频URL情况下显示提示 -->
      <div v-else class="no-video-message">
        <p>This project has no video associated with it.</p>
        <router-link :to="`/projects/${projectId}/edit`" class="btn btn-primary">
          Edit Project to Add Video
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '../store/projects'
import VideoEditor from '../components/VideoEditor.vue'
import BreakpointList from '../components/BreakpointList.vue'

// Get route parameters and router instance
const route = useRoute()
const router = useRouter()
const projectId = computed(() => {
  const id = route.params.id
  if (!id) {
    console.error('Project ID missing in route params')
    router.push('/projects')
    return null
  }
  return id
})

// Get projects store
const projectsStore = useProjectsStore()

// Video editor reference
const videoEditorRef = ref(null)

// Local state
const project = computed(() => projectsStore.currentProject)
const loading = computed(() => projectsStore.loading)
const error = computed(() => projectsStore.error)
const videoUrl = ref('')
const notesText = ref('')

// Loop controls state
const loopStart = ref(null)
const loopEnd = ref(null)
const loopCount = ref(3)
const waitMs = ref(1000)
const isLooping = ref(false)
const currentLoopCount = ref(0)

// Video state
const currentTime = ref(0)
const duration = ref(0)

// Get sorted breakpoints list
const sortedBreakpoints = computed(() => projectsStore.sortedBreakpoints)

// Load project data
const loadProject = async () => {
  if (!projectId.value) return

  try {
    await projectsStore.fetchProject(projectId.value)
    
    // Initialize video URL and notes
    if (project.value) {
      videoUrl.value = project.value.videoUrl || ''
      notesText.value = project.value.notesText || ''
    }
  } catch (error) {
    console.error('Failed to load project:', error)
  }
}

// Confirm delete project
const confirmDeleteProject = () => {
  if (confirm(`Are you sure you want to delete project "${project.value.name}"? This action cannot be undone.`)) {
    deleteProject()
  }
}

// Delete project
const deleteProject = async () => {
  try {
    await projectsStore.removeProject(projectId.value)
    router.push('/projects')
  } catch (error) {
    console.error('Failed to delete project:', error)
  }
}

// Jump to specified time
const seekToTime = (time) => {
  if (!videoEditorRef.value) {
    console.error('Video editor reference not available')
    return
  }
  
  videoEditorRef.value.seekTo(time)
}

// Format time as MM:SS.ss
const formatTime = (seconds) => {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00.00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

// Update current time from video
const updateCurrentTime = (time) => {
  currentTime.value = time
}

// Update duration from video
const updateDuration = (value) => {
  duration.value = value
}

// Update loop status from video
const updateLoopStatus = (status) => {
  isLooping.value = status.isLooping
  if (status.isLooping) {
    currentLoopCount.value = status.currentCount
  }
}

// Start loop
const startLoop = () => {
  if (loopStart.value === null || loopEnd.value === null || !videoEditorRef.value) return
  
  videoEditorRef.value.startLoop(loopStart.value, loopEnd.value, loopCount.value, waitMs.value)
}

// Stop loop
const stopLoop = () => {
  if (!videoEditorRef.value) return
  
  videoEditorRef.value.stopLoop()
}

// Watch for project changes, update local state
watch(() => project.value, (newProject) => {
  if (newProject) {
    videoUrl.value = newProject.videoUrl || ''
    notesText.value = newProject.notesText || ''
  }
})

// Load project when component mounted
onMounted(() => {
  loadProject()
})
</script>

<style scoped>
.project-view {
  width: 100%;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  background-color: var(--card-bg);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.project-content {
  display: flex;
  flex-direction: column;
}

.main-content-area {
  display: flex;
  gap: 1rem;
}

.left-column {
  flex: 3;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.right-column {
  flex: 2;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

/* Common panel styles for consistent appearance */
.editor-panel {
  background-color: var(--card-bg);
  padding: 0.75rem;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Make top panels the same height */
.video-editor-container, .breakpoint-list-container {
  flex: 1;
  min-height: 480px;
}

/* Make bottom panels the same height */
.loop-controls, .project-notes {
  flex: 1;
  min-height: 320px;
}

.loop-controls h3, .project-notes h3 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-size: 1rem;
}

.breakpoint-selectors {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.breakpoint-selectors .form-group {
  flex: 1;
}

.loop-parameters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.loop-parameters .form-group {
  flex: 1;
}

.loop-controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.loop-buttons {
  display: flex;
  gap: 0.5rem;
}

.loop-status {
  margin-top: 0;
  padding: 0.25rem 0.5rem;
  background-color: var(--bg-color);
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
}

.notes-content {
  padding: 1rem;
  background-color: var(--bg-color);
  border-radius: 4px;
  min-height: 150px;
  flex: 1;
  overflow-y: auto;
}

.notes-text {
  white-space: pre-wrap;
  line-height: 1.5;
  color: var(--text-color);
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.no-video-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  background-color: var(--card-bg);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mt-2 {
  margin-top: 0.5rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

@media (max-width: 1024px) {
  .main-content-area {
    flex-direction: column;
  }
  
  .left-column, .right-column {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .breakpoint-selectors,
  .loop-parameters {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style> 