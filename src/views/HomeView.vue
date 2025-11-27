<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useQuizStore } from '@/stores/quizStore'

const quizStore = useQuizStore()
const { quizzes } = storeToRefs(quizStore)

const isLoading = computed(() => !quizzes.value.length)

onMounted(async () => {
  if (!quizzes.value.length) {
    await quizStore.fetchQuizzes()
  }
})
</script>

<template>
  <main class="page">
    <header class="page__header">
      <div class="page__header-content">
        <div>
          <h1>Quiz disponibili</h1>
          <p>Seleziona un quiz per iniziare ad allenarti.</p>
        </div>
        <RouterLink to="/create" class="btn btn--primary">+ Crea nuovo quiz</RouterLink>
      </div>
    </header>

    <section class="quiz-list" aria-live="polite">
      <p v-if="isLoading" class="quiz-list__state">Caricamento in corso...</p>
      <p v-else-if="!quizzes.length" class="quiz-list__state">Nessun quiz disponibile.</p>

      <ul v-else class="quiz-list__items">
        <li v-for="quiz in quizzes" :key="quiz.id">
          <RouterLink
            class="quiz-card"
            :to="{ name: 'quiz', params: { id: quiz.id } }"
            :aria-label="`Apri il quiz ${quiz.title}`"
          >
            <div class="quiz-card__meta">
              <span class="quiz-card__difficulty">{{ quiz.difficulty || 'N/D' }}</span>
              <span v-if="quiz.tags?.length" class="quiz-card__tags">
                {{ quiz.tags.join(' · ') }}
              </span>
            </div>
            <h2 class="quiz-card__title">{{ quiz.title }}</h2>
            <p class="quiz-card__description">{{ quiz.description }}</p>
            <p class="quiz-card__footnote">
              {{ quiz.questions.length }} domande · Aggiornato il
              {{ new Date(quiz.updatedAt || quiz.createdAt).toLocaleDateString('it-IT') }}
            </p>
          </RouterLink>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: calc(100vh - 80px);
  padding: 3rem 1rem;
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page__header h1 {
  font-size: 2.25rem;
  margin-bottom: 0.5rem;
}

.page__header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.page__header p {
  color: #5c6470;
  margin: 0;
}

.btn {
  border-radius: 999px;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 120ms ease, transform 80ms ease;
}

.btn--primary {
  background: #2563eb;
  color: #ffffff;
}

.btn--primary:hover {
  background: #1d4ed8;
}

.btn:active {
  transform: translateY(1px);
}

.quiz-list__state {
  color: #5c6470;
  font-style: italic;
}

.quiz-list__items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .quiz-list__items {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}

.quiz-card {
  border: 1px solid #e0e4ea;
  border-radius: 1rem;
  padding: 1.5rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
  text-decoration: none;
  color: inherit;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.quiz-card:focus-visible,
.quiz-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 35px rgba(15, 23, 42, 0.12);
}

.quiz-card__meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quiz-card__difficulty {
  font-weight: 600;
}

.quiz-card__title {
  margin: 0;
  font-size: 1.25rem;
}

.quiz-card__description {
  margin: 0;
  color: #475569;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.quiz-card__footnote {
  margin: 0;
  font-size: 0.875rem;
  color: #94a3b8;
}
</style>

