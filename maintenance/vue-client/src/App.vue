<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import Token from './components/Token.vue'
import ReauthPrompt from './components/ReauthPrompt.vue'
import { useBootstrap } from './composables/useBootstrap.js'
import { useAuthStore } from './stores/auth.js'

const authStore = useAuthStore()

const { isBootstrapping, bootstrapError, runBootstrap } = useBootstrap()

const reloadPage = () => {
  window.location.reload()
}

onMounted(runBootstrap)
</script>

<template>
  <!-- Loading state during bootstrap -->
  <div v-if="isBootstrapping" class="bootstrap-loading">
    <div>Initializing application...</div>
    <!-- You can add a loading spinner component here -->
  </div>
  
  <!-- Error state if bootstrap fails -->
  <div v-else-if="bootstrapError" class="bootstrap-error">
    <div>Failed to initialize application: {{ bootstrapError }}</div>
    <button @click="reloadPage">Retry</button>
  </div>
  
  <!-- Normal app content after successful bootstrap -->
  <template v-else>
    <header>
      <!-- Modal overlay, shown only if noTokenMessage is not null -->
      <ReauthPrompt v-if="authStore.noTokenMessage" :reauth="authStore.noTokenMessage" />
      
      <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

      <div class="wrapper">
        <Token />
        <HelloWorld msg="You did it!" />

        <nav>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/about">About</RouterLink>
        </nav>
      </div>
    </header>

    <RouterView />
  </template>
</template>

<style scoped>
.bootstrap-loading,
.bootstrap-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;         /* Add this */
  text-align: center;
  margin: 0;            /* Add this */
  position: fixed;      /* Add this for overlay effect */
  top: 0;
  left: 0;
  background: rgb(0, 0, 0);    /* Optional: ensures background covers page */
  z-index: 9999;        /* Optional: ensures it's above other content */
}

.bootstrap-error button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
