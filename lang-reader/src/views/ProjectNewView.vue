<template>
  <div class="project-new-view">
    <ProjectForm 
      :is-editing="false"
      @save="onProjectSaved"
    />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import ProjectForm from '../components/ProjectForm.vue'

const router = useRouter()

// Handle project saved successfully
const onProjectSaved = (project) => {
  router.push('/projects')
}
</script>

<style scoped>
.project-new-view {
  width: 100%;
}
</style> 