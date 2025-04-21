<template>
  <form class="login-form" @submit.prevent="login">
    <h2>{{ isRegister ? 'Create an Account' : 'Log In' }}</h2>
    
    <div class="form-group">
      <label for="email">Email</label>
      <input 
        id="email"
        name="email"
        type="email" 
        class="form-control" 
        v-model="email" 
        required
      />
    </div>
    
    <div class="form-group">
      <label for="password">Password</label>
      <input 
        id="password"
        name="password"
        type="password" 
        class="form-control" 
        v-model="password" 
        required
      />
    </div>
    
    <div class="form-group" v-if="isRegister">
      <label for="confirmPassword">Confirm Password</label>
      <input 
        id="confirmPassword"
        name="confirmPassword"
        type="password" 
        class="form-control" 
        v-model="confirmPassword" 
        required
      />
    </div>
    
    <div class="form-actions">
      <button type="submit" class="btn btn-primary">
        {{ isRegister ? 'Register' : 'Login' }}
      </button>
      <button type="button" class="btn btn-link" @click="toggleMode">
        {{ isRegister ? 'Already have an account? Login' : 'Create an account' }}
      </button>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </form>
</template> 