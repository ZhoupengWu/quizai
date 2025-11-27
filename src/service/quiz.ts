import type { Quiz } from '@/types/quiz'
import quizzes from '@/data/quizzes.json'

const DELAY_MS = 1000

const QUIZ_DATA = quizzes as Quiz[]

export async function getAllQuiz(): Promise<Quiz[]> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
  return QUIZ_DATA
}
