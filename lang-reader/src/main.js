import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// Create Pinia state management instance
const pinia = createPinia()

// Create Vue application instance
const app = createApp(App)

// Configure Axios base URL
axios.defaults.baseURL = 'http://localhost:3000/api'

// Mount Axios globally, accessible via app.config.globalProperties.$http
app.config.globalProperties.$http = axios

// Mount router and state management
app.use(router)
app.use(pinia)

// Launch application
app.mount('#app') 