import type { Quiz } from '@/types/quiz'
import quizzesSeed from '@/data/quizzes.json'

type QuizPayload = Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>

const MIN_DELAY = 400
const MAX_DELAY = 1200
const ERROR_RATE_MIN = 0.08
const ERROR_RATE_MAX = 0.12

// In-memory persistence
let quizzesDb: Quiz[] = (quizzesSeed as Quiz[]).map((q) => ({
  ...q,
}))

let lastNumericId = quizzesDb.reduce((max, quiz) => {
  const n = Number(quiz.id)
  if (Number.isNaN(n)) return max
  return Math.max(max, n)
}, 0)

function randomDelay(): Promise<void> {
  const delay = MIN_DELAY + Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1))
  return new Promise((resolve) => setTimeout(resolve, delay))
}

function shouldFail(): boolean {
  const rate = ERROR_RATE_MIN + Math.random() * (ERROR_RATE_MAX - ERROR_RATE_MIN)
  return Math.random() < rate
}

async function simulateNetwork(): Promise<void> {
  await randomDelay()
  if (shouldFail()) {
    throw new Error('Network error')
  }
}

export async function fetchQuizzes(): Promise<Quiz[]> {
  await simulateNetwork()
  return quizzesDb.map((q) => ({ ...q }))
}

export async function createQuiz(payload: QuizPayload): Promise<Quiz> {
  await simulateNetwork()

  lastNumericId += 1
  const now = new Date().toISOString()
  const created: Quiz = {
    id: String(lastNumericId),
    createdAt: now,
    updatedAt: now,
    ...payload,
  }

  quizzesDb.push(created)
  return { ...created }
}

export async function updateQuiz(id: string, payload: Partial<QuizPayload>): Promise<Quiz> {
  await simulateNetwork()

  const index = quizzesDb.findIndex((q) => q.id === id)
  if (index === -1) {
    throw new Error('Quiz not found')
  }

  const now = new Date().toISOString()
  const source = quizzesDb[index] as Quiz
  const updated: Quiz = {
    id: source.id,
    title: payload.title ?? source.title,
    description: payload.description ?? source.description,
    questions: payload.questions ?? source.questions,
    tags: payload.tags ?? source.tags,
    difficulty: payload.difficulty ?? source.difficulty,
    isPublished: payload.isPublished ?? source.isPublished,
    createdAt: source.createdAt,
    updatedAt: now,
    authorId: payload.authorId ?? source.authorId,
    settings: payload.settings ?? source.settings,
  }
  quizzesDb[index] = updated

  return { ...updated }
}

export async function deleteQuiz(id: string): Promise<void> {
  await simulateNetwork()
  quizzesDb = quizzesDb.filter((q) => q.id !== id)
}
