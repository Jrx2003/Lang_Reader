<template>
  <div class="app" :class="{ 'dark-mode': isDarkMode }">
    <header class="app-header">
      <div class="app-logo">
        <router-link to="/">Lang Reader</router-link>
      </div>
      <nav class="app-nav">
        <router-link to="/projects">Project List</router-link>
        <div class="dark-mode-toggle">
          <label class="switch">
            <input type="checkbox" v-model="isDarkMode">
            <span class="slider round"></span>
          </label>
          <span class="mode-label">Night Mode</span>
        </div>
      </nav>
    </header>
    
    <main class="app-content">
      <router-view />
    </main>
    
    <footer class="app-footer">
      <p>Lang Reader - Language Learning Tool &copy; {{ currentYear }}</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

// Current year for copyright information
const currentYear = computed(() => new Date().getFullYear())

// Dark mode state
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true')

// Save dark mode preference to localStorage
watch(isDarkMode, (newValue) => {
  localStorage.setItem('darkMode', newValue)
  document.body.classList.toggle('dark-mode', newValue)
})

// Initialize dark mode on page load
document.body.classList.toggle('dark-mode', isDarkMode.value)
</script>

<style>
/* CSS variables for theming */
:root {
  --bg-color: #f5f5f5;
  --text-color: #333;
  --card-bg: #fff;
  --card-shadow: rgba(0, 0, 0, 0.1);
  --header-bg: #3498db;
  --header-text: #fff;
  --primary-color: #3498db;
  --primary-hover: #2980b9;
  --success-color: #2ecc71;
  --success-hover: #27ae60;
  --danger-color: #e74c3c;
  --danger-hover: #c0392b;
  --input-border: #ddd;
  --input-bg: #fff;
  --footer-bg: #3498db;
  --footer-text: #fff;
}

/* Dark mode variables */
.dark-mode {
  --bg-color: #121212;
  --text-color: #e0e0e0;
  --card-bg: #1e1e1e;
  --card-shadow: rgba(0, 0, 0, 0.5);
  --header-bg: #1a5889;
  --header-text: #fff;
  --primary-color: #2196f3;
  --primary-hover: #1976d2;
  --success-color: #27ae60;
  --success-hover: #2ecc71;
  --danger-color: #c0392b;
  --danger-hover: #e74c3c;
  --input-border: #333;
  --input-bg: #2d2d2d;
  --input-text: #e0e0e0;
  --footer-bg: #1a5889;
  --footer-text: #fff;
}

/* Reset and base styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Arial', 'Microsoft YaHei', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--bg-color);
  transition: background-color 0.3s, color 0.3s;
}

a {
  color: var(--primary-color);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* App container styles */
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header styles */
.app-header {
  background-color: var(--header-bg);
  color: var(--header-text);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-logo a {
  color: var(--header-text);
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
}

.app-nav {
  display: flex;
  align-items: center;
}

.app-nav a {
  color: rgba(255, 255, 255, 0.8);
  margin-right: 1.5rem;
  transition: color 0.3s;
}

.app-nav a:hover,
.app-nav a.router-link-active {
  color: white;
  text-decoration: none;
}

/* Dark mode toggle */
.dark-mode-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mode-label {
  color: var(--header-text);
  font-size: 0.9rem;
}

/* Switch styling */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 22px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: var(--primary-color);
}

input:checked + .slider:before {
  transform: translateX(22px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

/* Main content area styles */
.app-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

/* Footer styles */
.app-footer {
  background-color: var(--footer-bg);
  color: var(--footer-text);
  text-align: center;
  padding: 1rem;
  margin-top: auto;
}

/* Common styles */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s, opacity 0.3s;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
}

.btn-success {
  background-color: var(--success-color);
  color: white;
}

.btn-success:hover {
  background-color: var(--success-hover);
}

.btn-danger {
  background-color: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  background-color: var(--danger-hover);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card {
  background-color: var(--card-bg);
  border-radius: 4px;
  box-shadow: 0 2px 8px var(--card-shadow);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: background-color 0.3s, box-shadow 0.3s;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--input-border);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--input-bg);
  color: var(--text-color);
  transition: border-color 0.3s, background-color 0.3s, color 0.3s;
}

.dark-mode .form-control {
  color: var(--input-text);
  border-color: var(--input-border);
}

.dark-mode .form-control:focus {
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.25);
  border-color: var(--primary-color);
  outline: none;
}

.dark-mode .form-control::placeholder {
  color: rgba(224, 224, 224, 0.5);
}

/* Make sure all buttons are properly styled in dark mode */
.dark-mode .btn {
  border: none;
}

/* Enhanced readability for select dropdowns in dark mode */
.dark-mode select.form-control option {
  background-color: var(--card-bg);
  color: var(--text-color);
}

/* Improve text-muted color in dark mode */
.dark-mode .text-muted {
  color: rgba(224, 224, 224, 0.7) !important;
}

.alert {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    padding: 1rem;
  }
  
  .app-nav {
    margin-top: 1rem;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .app-nav a {
    margin: 0;
  }
  
  .dark-mode-toggle {
    margin-top: 0.5rem;
  }
  
  .app-content {
    padding: 1rem;
  }
}
</style> 