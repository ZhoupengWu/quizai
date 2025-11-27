import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { Quiz } from '@/types/quiz';
import { getAllQuiz } from '@/service/quiz';

export const useQuizStore = defineStore('quiz', () => {
  const quizzes = ref<Quiz[]>([]);
  async function fetchQuizzes() {
    const quizzesData = await getAllQuiz();
    quizzes.value = quizzesData as Quiz[];
  }
  return { quizzes, fetchQuizzes };
});