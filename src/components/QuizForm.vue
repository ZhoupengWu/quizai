<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import type { Choice, Question, Quiz } from '@/types/quiz';
import { useQuizStore } from '@/stores/quizStore';

type QuestionMode = 'single' | 'multiple';

interface FormChoice {
  id: string;
  label: string;
  isCorrect: boolean;
}

interface FormQuestion {
  id: string;
  prompt: string;
  mode: QuestionMode;
  choices: FormChoice[];
  points: number;
}

interface FormState {
  title: string;
  description: string;
  isPublished: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: FormQuestion[];
}

interface FieldError {
  _error?: string;
  [key: string]: unknown;
}

interface FormErrors {
  title?: string;
  questions?: Record<string, FieldError>;
  _general?: string;
}

const router = useRouter();
const quizStore = useQuizStore();

const isSubmitting = ref(false);
const submitSuccess = ref<string | null>(null);
const submitError = ref<string | null>(null);

const form = reactive<FormState>({
  title: '',
  description: '',
  isPublished: false,
  difficulty: 'easy',
  questions: [],
});

const errors = reactive<FormErrors>({});

const hasQuestions = computed(() => form.questions.length > 0);

function createEmptyChoice(): FormChoice {
  return {
    id: crypto.randomUUID(),
    label: '',
    isCorrect: false,
  };
}

function createEmptyQuestion(): FormQuestion {
  return {
    id: crypto.randomUUID(),
    prompt: '',
    mode: 'single',
    choices: [createEmptyChoice(), createEmptyChoice()],
    points: 1,
  };
}

function resetErrors() {
  errors.title = undefined;
  errors.questions = undefined;
  errors._general = undefined;
}

function resetForm() {
  form.title = '';
  form.description = '';
  form.isPublished = false;
  form.difficulty = 'easy';
  form.questions = [];
  submitSuccess.value = null;
  submitError.value = null;
  resetErrors();
}

function addQuestion() {
  form.questions.push(createEmptyQuestion());
}

function removeQuestion(index: number) {
  form.questions.splice(index, 1);
}

function addChoice(question: FormQuestion) {
  question.choices.push(createEmptyChoice());
}

function removeChoice(question: FormQuestion, index: number) {
  question.choices.splice(index, 1);
}

function setSingleCorrect(question: FormQuestion, choice: FormChoice) {
  if (question.mode === 'single') {
    question.choices.forEach((c) => {
      c.isCorrect = c.id === choice.id;
    });
  } else {
    choice.isCorrect = !choice.isCorrect;
  }
}

function validateQuestion(question: FormQuestion): FieldError {
  const result: FieldError = {};

  if (!question.prompt.trim()) {
    result.prompt = 'La domanda è obbligatoria.';
  }

  if (question.choices.length < 2) {
    result.choices = 'Ogni domanda deve avere almeno 2 scelte.';
  } else {
    const choiceErrors: Record<string, string> = {};
    question.choices.forEach((choice) => {
      if (!choice.label.trim()) {
        choiceErrors[choice.id] = 'La scelta è obbligatoria.';
      }
    });
    if (Object.keys(choiceErrors).length) {
      (result as FieldError).choiceErrors = choiceErrors;
    }
  }

  const correctCount = question.choices.filter((c) => c.isCorrect).length;
  if (question.mode === 'single') {
    if (correctCount !== 1) {
      result.correct =
        'Per le domande a risposta singola deve esserci esattamente 1 risposta corretta.';
    }
  } else if (question.mode === 'multiple') {
    if (correctCount < 1) {
      result.correct =
        'Per le domande a risposta multipla deve esserci almeno 1 risposta corretta.';
    }
  }

  if (Object.keys(result).length === 0) {
    return {};
  }
  return result;
}

function validateQuiz(state: FormState): boolean {
  resetErrors();

  if (!state.title.trim()) {
    errors.title = 'Il titolo è obbligatorio.';
  }

  if (state.questions.length === 0) {
    errors._general = 'Il quiz deve contenere almeno una domanda.';
  } else {
    const questionErrors: Record<string, FieldError> = {};
    state.questions.forEach((q) => {
      const err = validateQuestion(q);
      if (Object.keys(err).length > 0) {
        questionErrors[q.id] = err;
      }
    });
    if (Object.keys(questionErrors).length > 0) {
      errors.questions = questionErrors;
    }
  }

  return !errors.title && !errors._general && !errors.questions;
}

function mapToQuestion(question: FormQuestion): Question {
  const mode = question.mode;
  const correctCount = question.choices.filter((c) => c.isCorrect).length;

  return {
    id: question.id,
    prompt: question.prompt.trim(),
    type: 'multiple_choice',
    selectionMode: mode,
    minSelections: mode === 'multiple' ? 1 : 1,
    maxSelections:
      mode === 'multiple' ? Math.max(1, correctCount) : 1,
    required: true,
    points: question.points,
    choices: question.choices.map<Choice>((choice) => ({
      id: choice.id,
      label: choice.label.trim(),
      isCorrect: choice.isCorrect,
    })),
  };
}

function mapToQuizPayload(state: FormState): Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: state.title.trim(),
    description: state.description.trim() || undefined,
    questions: state.questions.map(mapToQuestion),
    tags: [],
    difficulty: state.difficulty,
    isPublished: state.isPublished,
    authorId: undefined,
    settings: {
      shuffleQuestions: false,
      shuffleChoices: false,
      allowRetake: false,
    },
  };
}

async function handleSubmit() {
  submitSuccess.value = null;
  submitError.value = null;

  if (!validateQuiz(form)) {
    submitError.value = 'Per favore correggi gli errori nel form prima di salvare.';
    return;
  }

  const payload = mapToQuizPayload(form);

  isSubmitting.value = true;
  try {
    const created = await quizStore.createQuiz(payload);
    submitSuccess.value = `Quiz "${created.title}" creato con successo.`;
    setTimeout(() => {
      router.push({ name: 'home' });
    }, 2000);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Si è verificato un errore durante il salvataggio.';
    submitError.value = message;
  } finally {
    isSubmitting.value = false;
  }
}

const previewQuiz = computed<Quiz | null>(() => {
  if (!form.title.trim() && !form.questions.length) {
    return null;
  }

  return {
    id: 'preview',
    title: form.title || 'Anteprima quiz',
    description: form.description || undefined,
    questions: form.questions.map(mapToQuestion),
    tags: [],
    difficulty: form.difficulty,
    isPublished: form.isPublished,
    createdAt: new Date().toISOString(),
    updatedAt: undefined,
    authorId: undefined,
    settings: {
      shuffleQuestions: false,
      shuffleChoices: false,
      allowRetake: false,
    },
  };
});
</script>

<template>
  <section class="quiz-form">
    <header class="quiz-form__header">
      <div class="quiz-form__header-content">
        <div>
          <h2>Crea un nuovo quiz</h2>
          <p class="quiz-form__subtitle">
            Compila i campi sottostanti per creare un quiz. Puoi aggiungere o rimuovere domande e scelte
            liberamente.
          </p>
        </div>
        <RouterLink to="/" class="btn btn--ghost">← Torna alla home</RouterLink>
      </div>
    </header>

    <form class="quiz-form__body" @submit.prevent="handleSubmit">
      <div class="field">
        <label for="title" class="field__label">Titolo</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          class="field__input"
          placeholder="Es. Introduzione a JavaScript"
        />
        <p v-if="errors.title" class="field__error">{{ errors.title }}</p>
      </div>

      <div class="field">
        <label for="description" class="field__label">Descrizione</label>
        <textarea
          id="description"
          v-model="form.description"
          class="field__input field__input--textarea"
          rows="3"
          placeholder="Descrivi brevemente il contenuto del quiz"
        />
      </div>

      <div class="field">
        <label for="difficulty" class="field__label">Difficoltà</label>
        <select id="difficulty" v-model="form.difficulty" class="field__input field__input--select">
          <option value="easy">Facile</option>
          <option value="medium">Media</option>
          <option value="hard">Difficile</option>
        </select>
      </div>

      <div class="field field--inline">
        <label class="field__label">
          <input v-model="form.isPublished" type="checkbox" class="field__checkbox" />
          Pubblica subito il quiz
        </label>
      </div>

      <section class="questions">
        <div class="questions__header">
          <h3>Domande</h3>
          <button type="button" class="btn btn--secondary" @click="addQuestion">
            + Aggiungi domanda
          </button>
        </div>

        <p v-if="errors._general" class="field__error field__error--block">
          {{ errors._general }}
        </p>

        <p v-if="!hasQuestions" class="questions__empty">
          Nessuna domanda ancora. Aggiungine una per iniziare.
        </p>

        <article
          v-for="(question, qIndex) in form.questions"
          :key="question.id"
          class="question"
        >
          <header class="question__header">
            <h4>Domanda {{ qIndex + 1 }}</h4>
            <div class="question__header-actions">
              <select v-model="question.mode" class="field__input field__input--select">
                <option value="single">Risposta singola</option>
                <option value="multiple">Risposta multipla</option>
              </select>
              <button
                type="button"
                class="btn btn--ghost"
                @click="removeQuestion(qIndex)"
              >
                Rimuovi domanda
              </button>
            </div>
          </header>

          <div class="question__fields">
            <div class="field">
              <label class="field__label">Testo della domanda</label>
              <input
                v-model="question.prompt"
                type="text"
                class="field__input"
                placeholder="Es. Qual è il risultato di 2 + 2?"
              />
              <p
                v-if="errors.questions && errors.questions[question.id]?.prompt"
                class="field__error"
              >
                {{ errors.questions[question.id]?.prompt as string }}
              </p>
            </div>

            <div class="field field--points">
              <label for="points" class="field__label">Punti</label>
              <input
                id="points"
                v-model.number="question.points"
                type="number"
                min="1"
                class="field__input field__input--number"
                placeholder="1"
              />
            </div>
          </div>

          <div class="choices">
            <div class="choices__header">
              <h5>Scelte</h5>
              <button
                type="button"
                class="btn btn--secondary btn--sm"
                @click="addChoice(question)"
              >
                + Aggiungi scelta
              </button>
            </div>

            <p
              v-if="errors.questions && errors.questions[question.id]?.choices"
              class="field__error"
            >
              {{ errors.questions[question.id]?.choices as string }}
            </p>

            <ul class="choices__list">
              <li
                v-for="(choice, cIndex) in question.choices"
                :key="choice.id"
                class="choice"
              >
                <div class="choice__header">
                  <label class="choice__label">
                    <input
                      type="checkbox"
                      class="choice__checkbox"
                      :checked="choice.isCorrect"
                      @change="setSingleCorrect(question, choice)"
                    />
                    <span class="choice__correct-label">
                      {{ question.mode === 'single' ? 'Corretta' : 'Corretta (può essere più di una)' }}
                    </span>
                  </label>
                  <button
                    type="button"
                    class="btn btn--ghost btn--sm choice__remove"
                    @click="removeChoice(question, cIndex)"
                    :disabled="question.choices.length <= 2"
                  >
                    Rimuovi
                  </button>
                </div>

                <input
                  v-model="choice.label"
                  type="text"
                  class="field__input choice__input"
                  :placeholder="`Opzione ${cIndex + 1}`"
                />

                <p
                  v-if="
                    errors.questions &&
                    (errors.questions[question.id]?.choiceErrors as Record<string, string> | undefined)?.[choice.id]
                  "
                  class="field__error"
                >
                  {{
                    (errors.questions[question.id]?.choiceErrors as Record<string, string>)[
                      choice.id
                    ]
                  }}
                </p>
              </li>
            </ul>

            <p
              v-if="errors.questions && errors.questions[question.id]?.correct"
              class="field__error"
            >
              {{ errors.questions[question.id]?.correct as string }}
            </p>
          </div>
        </article>
      </section>

      <footer class="quiz-form__footer">
        <div class="quiz-form__messages">
          <p v-if="submitSuccess" class="alert alert--success">
            {{ submitSuccess }}
          </p>
          <p v-if="submitError" class="alert alert--error">
            {{ submitError }}
          </p>
          <p v-if="quizStore.error && !submitError" class="alert alert--error">
            {{ quizStore.error }}
          </p>
        </div>

        <div class="quiz-form__actions">
          <button
            type="button"
            class="btn btn--ghost"
            :disabled="isSubmitting"
            @click="resetForm"
          >
            Annulla
          </button>
          <button
            type="submit"
            class="btn btn--primary"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting">Salvataggio...</span>
            <span v-else>Salva</span>
          </button>
        </div>
      </footer>
    </form>

    <section v-if="previewQuiz" class="quiz-preview">
      <header class="quiz-preview__header">
        <h3>Anteprima quiz</h3>
        <p class="quiz-preview__meta">
          {{ previewQuiz.questions.length }} domande ·
          <span>{{ previewQuiz.isPublished ? 'Pubblicato' : 'Bozza' }}</span>
        </p>
      </header>

      <div class="quiz-preview__body">
        <h4 class="quiz-preview__title">{{ previewQuiz.title }}</h4>
        <p v-if="previewQuiz.description" class="quiz-preview__description">
          {{ previewQuiz.description }}
        </p>

        <ol class="quiz-preview__questions">
          <li
            v-for="question in previewQuiz.questions"
            :key="question.id"
            class="quiz-preview__question"
          >
            <div class="quiz-preview__question-header">
              <p class="quiz-preview__question-text">{{ question.prompt }}</p>
              <span class="quiz-preview__question-points">{{ question.points }} punti</span>
            </div>
            <ul class="quiz-preview__choices">
              <li
                v-for="choice in question.choices"
                :key="choice.id"
                class="quiz-preview__choice"
                :class="{
                  'quiz-preview__choice--correct': choice.isCorrect,
                }"
              >
                {{ choice.label }}
              </li>
            </ul>
          </li>
        </ol>
      </div>
    </section>
  </section>
</template>

<style scoped>
.quiz-form {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1.5fr);
  gap: 2rem;
  align-items: flex-start;
}

.quiz-form__header {
  grid-column: 1 / -1;
}

.quiz-form__header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.quiz-form__subtitle {
  margin-top: 0.25rem;
  color: #6b7280;
  font-size: 0.95rem;
}

.quiz-form__body {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field__label {
  font-weight: 500;
  font-size: 0.95rem;
  color: #111827;
}

.field__input {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  padding: 0.6rem 0.75rem;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.field__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
}

.field__input--textarea {
  resize: vertical;
  min-height: 80px;
}

.field__input--select {
  padding-right: 2rem;
}

.field__input--number {
  width: 100px;
}

.field__checkbox {
  margin-right: 0.5rem;
}

.field--inline {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.field__error {
  font-size: 0.8rem;
  color: #b91c1c;
}

.field__error--block {
  margin-top: 0.25rem;
}

.questions {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.questions__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.questions__empty {
  font-size: 0.9rem;
  color: #6b7280;
}

.question {
  border-radius: 0.875rem;
  border: 1px solid #e5e7eb;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #f9fafb;
}

.question__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.question__header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.question__fields {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: flex-start;
}

.field--points {
  width: 120px;
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.choices__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.choices__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.choice {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.choice__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.choice__remove {
  margin-left: auto;
}

.choice__label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #4b5563;
}

.choice__checkbox {
  width: 1rem;
  height: 1rem;
}

.choice__input {
  width: 100%;
}

.quiz-form__footer {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.quiz-form__actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  border-radius: 999px;
  padding: 0.55rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  background: #e5e7eb;
  color: #111827;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  transition: background 120ms ease, transform 80ms ease;
}

.btn:active {
  transform: translateY(1px);
}

.btn--primary {
  background: #2563eb;
  color: #ffffff;
}

.btn--secondary {
  background: #eef2ff;
  color: #1d4ed8;
}

.btn--ghost {
  background: transparent;
  border-color: #d1d5db;
  color: #374151;
}

.btn--sm {
  padding: 0.35rem 0.8rem;
  font-size: 0.8rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quiz-form__messages {
  min-height: 1.25rem;
}

.alert {
  font-size: 0.85rem;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
}

.alert--success {
  background: #dcfce7;
  color: #166534;
}

.alert--error {
  background: #fee2e2;
  color: #b91c1c;
}

.quiz-preview {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quiz-preview__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.quiz-preview__meta {
  font-size: 0.85rem;
  color: #6b7280;
}

.quiz-preview__title {
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.quiz-preview__description {
  font-size: 0.95rem;
  color: #4b5563;
}

.quiz-preview__questions {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quiz-preview__question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.quiz-preview__question-text {
  font-weight: 500;
  flex: 1;
}

.quiz-preview__question-points {
  font-size: 0.85rem;
  color: #10b981;
  font-weight: 600;
  white-space: nowrap;
}

.quiz-preview__choices {
  list-style: none;
  margin: 0.25rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.quiz-preview__choice {
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  background: #f3f4f6;
}

.quiz-preview__choice--correct {
  background: #dcfce7;
  color: #166534;
}

@media (max-width: 960px) {
  .quiz-form {
    grid-template-columns: minmax(0, 1fr);
  }

  .quiz-form__header {
    grid-column: 1 / 2;
  }
}

@media (max-width: 640px) {
  .question__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .question__fields {
    grid-template-columns: 1fr;
  }

  .field--points {
    width: 100%;
  }

  .quiz-form__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .quiz-form__actions {
    justify-content: flex-end;
  }
}
</style>


