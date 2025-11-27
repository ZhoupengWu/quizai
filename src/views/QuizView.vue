<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import type { Question } from '@/types/quiz'
import { useQuizStore } from '@/stores/quizStore'

const route = useRoute()
const router = useRouter()
const quizStore = useQuizStore()
const { quizzes } = storeToRefs(quizStore)

const currentIndex = ref(0)
const answers = reactive<Record<string, string[]>>({})
const showResults = ref(false)
const isFetching = ref(false)

const quiz = computed(() => quizzes.value.find((q) => q.id === route.params.id))
const questions = computed(() => quiz.value?.questions ?? [])
const currentQuestion = computed(() => questions.value[currentIndex.value])

const totalPoints = computed(() => questions.value.reduce((sum, q) => sum + q.points, 0))
const earnedPoints = computed(() => {
  if (!showResults.value) return 0
  return questions.value.reduce((sum, question) => {
    return sum + (isQuestionCorrect(question) ? question.points : 0)
  }, 0)
})

const progressLabel = computed(() => {
  if (!questions.value.length) return ''
  return `Domanda ${currentIndex.value + 1} di ${questions.value.length}`
})

const canAdvance = computed(() => {
  const question = currentQuestion.value
  if (!question) return false
  if (question.required === false) return true
  const selected = answers[question.id] ?? []
  const minSelections = question.selectionMode === 'multiple' ? question.minSelections ?? 1 : 1
  return selected.length >= minSelections
})

const isLoading = computed(() => isFetching.value || (!quiz.value && !quizzes.value.length))

onMounted(async () => {
  if (!quizzes.value.length) {
    isFetching.value = true
    await quizStore.fetchQuizzes()
    isFetching.value = false
  }
})

watch(
  () => quiz.value,
  (value) => {
    if (value) {
      initializeAnswers(value.questions)
    } else if (!isLoading.value && quizzes.value.length) {
      router.replace({ name: 'home' })
    }
  },
  { immediate: true }
)

function initializeAnswers(newQuestions: Question[]) {
  currentIndex.value = 0
  showResults.value = false
  Object.keys(answers).forEach((key) => {
    delete answers[key]
  })
  newQuestions.forEach((question) => {
    answers[question.id] = []
  })
}

function toggleChoice(choiceId: string) {
  const question = currentQuestion.value
  if (!question) return
  const mode = question.selectionMode ?? 'single'
  if (mode === 'multiple') {
    const current = answers[question.id] ?? []
    const exists = current.includes(choiceId)
    const next = exists ? current.filter((id) => id !== choiceId) : [...current, choiceId]
    const max = question.maxSelections ?? question.choices.length
    if (next.length <= max) {
      answers[question.id] = next
    }
  } else {
    answers[question.id] = [choiceId]
  }
}

function goPrev() {
  if (currentIndex.value === 0) return
  currentIndex.value -= 1
}

function goNext() {
  if (!quiz.value) return
  if (currentIndex.value < quiz.value.questions.length - 1) {
    currentIndex.value += 1
    return
  }
  submitQuiz()
}

function submitQuiz() {
  showResults.value = true
}

function isChoiceSelected(choiceId: string) {
  const question = currentQuestion.value
  if (!question) return false
  return answers[question.id]?.includes(choiceId)
}

function isQuestionCorrect(question: Question) {
  const selected = answers[question.id] ?? []
  const correctChoices = question.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id)
  if (!correctChoices.length) return false
  if (selected.length !== correctChoices.length) return false
  return correctChoices.every((choiceId) => selected.includes(choiceId))
}

function getChoiceLabel(question: Question, choiceId: string) {
  return question.choices.find((choice) => choice.id === choiceId)?.label ?? choiceId
}
</script>

<template>
  <main class="quiz-page">
    <header class="quiz-page__header">
      <button class="back-btn" type="button" @click="router.back()">← Torna indietro</button>
      <RouterLink v-if="showResults" class="back-btn back-btn--link" :to="{ name: 'home' }">
        Torna all'elenco
      </RouterLink>
    </header>

    <section v-if="isLoading" class="quiz-state">Caricamento quiz...</section>
    <section v-else-if="!quiz" class="quiz-state">
      <p>Quiz non trovato.</p>
      <RouterLink class="link" :to="{ name: 'home' }">Vai alla lista quiz</RouterLink>
    </section>

    <section v-else class="quiz">
      <header class="quiz__header">
        <div>
          <p class="quiz__difficulty">{{ quiz.difficulty || 'N/D' }}</p>
          <h1>{{ quiz.title }}</h1>
          <p class="quiz__description">{{ quiz.description }}</p>
          <p class="quiz__meta">
            {{ quiz.questions.length }} domande · {{ totalPoints }} punti totali
          </p>
        </div>
        <div class="quiz__progress" role="status" aria-live="polite">
          <span>{{ progressLabel }}</span>
          <progress :value="currentIndex + 1" :max="quiz.questions.length" />
        </div>
      </header>

      <div v-if="!showResults" class="quiz__body">
        <article class="question-card" v-if="currentQuestion">
          <p class="question-card__points">{{ currentQuestion.points }} punti</p>
          <h2>{{ currentQuestion.prompt }}</h2>

          <ul class="choices">
            <li v-for="choice in currentQuestion.choices" :key="choice.id">
              <button
                type="button"
                class="choice"
                :class="{ 'choice--selected': isChoiceSelected(choice.id) }"
                @click="toggleChoice(choice.id)"
              >
                {{ choice.label }}
              </button>
            </li>
          </ul>
        </article>

        <footer class="question-actions">
          <button type="button" class="btn btn--ghost" :disabled="currentIndex === 0" @click="goPrev">
            Domanda precedente
          </button>
          <button type="button" class="btn btn--primary" :disabled="!canAdvance" @click="goNext">
            {{ currentIndex === quiz.questions.length - 1 ? 'Consegna quiz' : 'Domanda successiva' }}
          </button>
        </footer>
      </div>

      <section v-else class="results" aria-live="polite">
        <h2>Risultati</h2>
        <p class="results__score">
          Hai totalizzato <strong>{{ earnedPoints }}</strong> punti su {{ totalPoints }}.
        </p>

        <ul class="results__list">
          <li v-for="question in quiz.questions" :key="question.id" class="results__item">
            <p class="results__question">{{ question.prompt }}</p>
            <p class="results__status" :class="{ 'results__status--success': isQuestionCorrect(question) }">
              {{ isQuestionCorrect(question) ? 'Risposta corretta' : 'Risposta errata' }}
            </p>
            <p class="results__answer">
              La tua risposta:
              <span v-if="(answers[question.id]?.length ?? 0) > 0">
                {{
                  (answers[question.id] ?? [])
                    .map((choiceId) => getChoiceLabel(question, choiceId))
                    .join(', ')
                }}
              </span>
              <span v-else>nessuna risposta</span>
            </p>
            <p class="results__answer">
              Risposta corretta:
              {{
                question.choices
                  .filter((choice) => choice.isCorrect)
                  .map((choice) => choice.label)
                  .join(', ')
              }}
            </p>
          </li>
        </ul>
      </section>
    </section>
  </main>
</template>

<style scoped>
.quiz-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.quiz-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 1rem;
  color: #2563eb;
  cursor: pointer;
}

.back-btn--link {
  text-decoration: none;
}

.quiz-state {
  padding: 3rem 1.5rem;
  border-radius: 1rem;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
}

.quiz {
  background: #ffffff;
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 25px 45px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.quiz__header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quiz__difficulty {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #64748b;
}

.quiz__description {
  color: #475569;
}

.quiz__meta {
  color: #94a3b8;
  font-size: 0.95rem;
}

.quiz__progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

progress {
  width: 220px;
  height: 12px;
}

.quiz__body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-card {
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-card__points {
  font-size: 0.875rem;
  color: #10b981;
  font-weight: 600;
  margin: 0;
}

.choices {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.choice {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid #cbd5f5;
  padding: 0.95rem 1.25rem;
  text-align: left;
  background: #f8fafc;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;
}

.choice--selected {
  border-color: #2563eb;
  background: #e0edff;
}

.question-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn {
  border-radius: 999px;
  padding: 0.85rem 1.75rem;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: opacity 120ms ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--ghost {
  border-color: #cbd5f5;
  background: #ffffff;
}

.btn--primary {
  background: #2563eb;
  color: #ffffff;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.results__score {
  font-size: 1.2rem;
}

.results__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.results__item {
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1rem;
}

.results__question {
  font-weight: 600;
}

.results__status {
  margin: 0.25rem 0;
  color: #dc2626;
}

.results__status--success {
  color: #059669;
}

.results__answer {
  margin: 0.25rem 0;
  color: #475569;
}

@media (max-width: 640px) {
  .quiz {
    padding: 1.25rem;
  }

  .question-actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  progress {
    width: 150px;
  }
}
</style>

