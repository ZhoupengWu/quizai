<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="layout">
    <nav class="nav">
      <RouterLink to="/" class="nav__brand">QuizAI</RouterLink>
    </nav>
    <RouterView />
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  background: linear-gradient(180deg, #eef2ff 0%, #ffffff 45%);
}

.nav {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1rem 0;
}

.nav__brand {
  font-weight: 700;
  text-decoration: none;
  font-size: 1.25rem;
  color: #111827;
}
</style>
