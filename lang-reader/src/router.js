import { createRouter, createWebHistory } from 'vue-router'

// Lazy loading view components
const ProjectsView = () => import('./views/ProjectsView.vue')
const ProjectNewView = () => import('./views/ProjectNewView.vue')
const ProjectEditView = () => import('./views/ProjectEditView.vue')
const ProjectViewView = () => import('./views/ProjectViewView.vue')

// Create router configuration
const routes = [
  {
    path: '/',
    redirect: '/projects' // Default redirect to projects list page
  },
  {
    path: '/projects',
    name: 'projects',
    component: ProjectsView,
    meta: { title: 'Project List' }
  },
  {
    path: '/projects/new',
    name: 'project-new',
    component: ProjectNewView,
    meta: { title: 'New Project' }
  },
  {
    path: '/projects/:id/view',
    name: 'project-view',
    component: ProjectViewView,
    props: true, // Pass route params as component props
    meta: { title: 'View Project' }
  },
  {
    path: '/projects/:id/edit',
    name: 'project-edit',
    component: ProjectEditView,
    props: true, // Pass route params as component props
    meta: { title: 'Edit Project' }
  },
  {
    path: '/projects/:id',
    redirect: to => {
      // 向后兼容，重定向到view模式
      return { path: `/projects/${to.params.id}/view` }
    }
  },
  {
    path: '/:pathMatch(.*)*', // Catch all unmatched routes
    redirect: '/projects'
  }
]

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Router guard for setting page title
router.beforeEach((to, from, next) => {
  // Set page title
  document.title = to.meta.title ? `${to.meta.title} | Lang Reader` : 'Lang Reader'
  next()
})

export default router 