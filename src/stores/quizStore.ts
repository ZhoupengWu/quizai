import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { Quiz } from '@/types/quiz';
import {
  fetchQuizzes as apiFetchQuizzes,
  createQuiz as apiCreateQuiz,
  updateQuiz as apiUpdateQuiz,
  deleteQuiz as apiDeleteQuiz,
} from '@/service/quizService';

export const useQuizStore = defineStore('quizCrud', () => {
  const quizzes = ref<Quiz[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const hasQuizzes = computed(() => quizzes.value.length > 0);

  function getQuizById(id: string) {
    return quizzes.value.find((quiz) => quiz.id === id);
  }

  async function fetchQuizzes() {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await apiFetchQuizzes();
      quizzes.value = data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Errore durante il caricamento dei quiz.';
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function createQuiz(payload: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>) {
    isLoading.value = true;
    error.value = null;
    try {
      const created = await apiCreateQuiz(payload);
      quizzes.value.push(created);
      return created;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Errore durante la creazione del quiz.';
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateQuiz(
    id: string,
    payload: Partial<Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>>,
  ) {
    isLoading.value = true;
    error.value = null;
    try {
      const updated = await apiUpdateQuiz(id, payload);
      const index = quizzes.value.findIndex((quiz) => quiz.id === id);
      if (index !== -1) {
        quizzes.value[index] = updated;
      }
      return updated;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Errore durante l\'aggiornamento del quiz.';
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteQuiz(id: string) {
    isLoading.value = true;
    error.value = null;
    try {
      await apiDeleteQuiz(id);
      quizzes.value = quizzes.value.filter((quiz) => quiz.id !== id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Errore durante l\'eliminazione del quiz.';
      error.value = message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    quizzes,
    isLoading,
    error,
    hasQuizzes,
    getQuizById,
    fetchQuizzes,
    createQuiz,
    updateQuiz,
    deleteQuiz,
  };
});


