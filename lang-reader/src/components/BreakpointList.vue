<template>
  <div class="breakpoint-list">
    <h3 class="breakpoint-list-title">Breakpoint List</h3>
    
    <div v-if="breakpointItems.length === 0" class="empty-state">
      <p>No breakpoints added yet. Click "Add Breakpoint" button during video playback</p>
    </div>
    
    <div v-else class="breakpoint-items">
      <div 
        v-for="breakpoint in breakpointItems" 
        :key="breakpoint.id"
        class="breakpoint-item"
      >
        <div class="breakpoint-info">
          <span class="breakpoint-index">{{ breakpoint.index + 1 }}</span>
          <span class="breakpoint-time">{{ formatTime(breakpoint.time) }}</span>
        </div>
        
        <div class="breakpoint-note" v-if="!readOnly">
          <label :for="`breakpoint-note-${breakpoint.id}`">Breakpoint {{ breakpoint.index + 1 }} notes</label>
          <input 
            type="text" 
            :id="`breakpoint-note-${breakpoint.id}`"
            :name="`breakpoint-note-${breakpoint.id}`"
            :placeholder="`Breakpoint #${breakpoint.index + 1} notes...`"
            v-model="breakpoint.note"
            @blur="updateBreakpointNote(breakpoint.index, breakpoint.note)"
            class="form-control"
            aria-label="Breakpoint note"
          >
        </div>
        
        <div class="breakpoint-note-readonly" v-else>
          <p class="note-text">{{ breakpoint.note || 'No notes' }}</p>
        </div>
        
        <div class="breakpoint-actions">
          <button 
            v-if="!readOnly"
            class="btn btn-sm btn-danger"
            @click="$emit('remove', breakpoint.index)"
            title="Delete breakpoint"
            type="button"
          >
            Delete
          </button>
          <button 
            class="btn btn-sm btn-primary"
            @click="$emit('seek', breakpoint.time)"
            title="Jump to this timestamp"
            type="button"
          >
            Jump
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, onUnmounted, computed } from 'vue'

// Component props
const props = defineProps({
  breakpoints: {
    type: Array,
    required: true
  },
  readOnly: {
    type: Boolean,
    default: false
  }
})

// Component events
const emit = defineEmits(['update:note', 'remove', 'seek'])

// Use computed property for breakpoints to reduce reactivity impacts
const breakpointItems = computed(() => {
  return props.breakpoints.map((bp, idx) => ({
    ...bp,
    id: bp.id || `bp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
    index: idx,
    note: bp.note || ''
  }))
})

// Format time as MM:SS.ss
const formatTime = (seconds) => {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00.00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

// Update breakpoint note
const updateBreakpointNote = (index, note) => {
  console.log(`Updating breakpoint ${index} with note: ${note}`)
  
  // Use debounce function to reduce unnecessary updates
  if (updateTimeouts[index]) {
    clearTimeout(updateTimeouts[index])
  }
  
  updateTimeouts[index] = setTimeout(() => {
    emit('update:note', { index, note })
  }, 500) // 500ms delay to reduce update frequency
}

// Store timeout IDs for each breakpoint
const updateTimeouts = {}

// Clean up timeouts when component unmounts
onUnmounted(() => {
  Object.values(updateTimeouts).forEach(timeoutId => {
    clearTimeout(timeoutId)
  })
})
</script>

<style scoped>
.breakpoint-list {
  margin-top: 0;
  padding: 0.75rem;
  background-color: var(--card-bg);
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.breakpoint-list-title {
  margin-bottom: 0.5rem;
  color: var(--text-color);
  font-size: 1rem;
}

.empty-state {
  padding: 1rem;
  text-align: center;
  background-color: var(--bg-color);
  border-radius: 4px;
  color: var(--text-color);
}

.breakpoint-items {
  max-height: 300px;
  overflow-y: auto;
}

.breakpoint-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid var(--input-border);
  gap: 0.5rem;
}

.breakpoint-item:last-child {
  border-bottom: none;
}

.breakpoint-item:hover {
  background-color: var(--bg-color);
}

.breakpoint-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 90px;
}

.breakpoint-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: bold;
}

.breakpoint-time {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--text-color);
}

.breakpoint-note, .breakpoint-note-readonly {
  flex: 1;
  min-width: 0;
}

.breakpoint-note label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.breakpoint-note input {
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  height: auto;
  background-color: var(--input-bg);
  color: var(--text-color);
  border-color: var(--input-border);
}

.note-text {
  font-size: 0.9rem;
  margin: 0;
  padding: 0.25rem 0;
  color: var(--text-color);
}

.breakpoint-actions {
  display: flex;
  gap: 0.25rem;
}

.btn-sm {
  padding: 0.15rem 0.3rem;
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .breakpoint-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .breakpoint-note,
  .breakpoint-note-readonly {
    width: 100%;
    margin: 0.3rem 0;
  }
  
  .breakpoint-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style> 