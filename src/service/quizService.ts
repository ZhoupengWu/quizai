import type { Quiz } from '@/types/quiz';

// The payload for creating a new quiz, which doesn't have an ID or timestamps yet.
type QuizPayload = Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>;

// The base URL of the Flask backend.
const API_BASE_URL = 'http://127.0.0.1:5001/api';

/**
 * A helper function to handle common API request logic, including error handling.
 * @param url - The URL to request.
 * @param options - The options for the fetch request.
 * @returns The JSON response from the API.
 * @throws An error if the network response is not ok.
 */
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorBody.error || `Request failed with status ${response.status}`);
  }
  // For 204 No Content, there is no body to parse.
  if (response.status === 204) {
    return null as T;
  }
  return response.json();
}

/**
 * Fetches all quizzes from the backend.
 * @returns A promise that resolves to an array of quizzes.
 */
export async function fetchQuizzes(): Promise<Quiz[]> {
  return apiRequest<Quiz[]>(`${API_BASE_URL}/quizzes`);
}

/**
 * Creates a new quiz by sending it to the backend.
 * @param payload - The data for the new quiz.
 * @returns A promise that resolves to the newly created quiz, including its server-generated ID.
 */
export async function createQuiz(payload: QuizPayload): Promise<Quiz> {
  return apiRequest<Quiz>(`${API_BASE_URL}/quizzes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Updates an existing quiz on the backend.
 * @param id - The ID of the quiz to update.
 * @param payload - The partial data to update the quiz with.
 * @returns A promise that resolves to the updated quiz.
 */
export async function updateQuiz(id: string, payload: Partial<QuizPayload>): Promise<Quiz> {
  return apiRequest<Quiz>(`${API_BASE_URL}/quizzes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Deletes a quiz from the backend.
 * @param id - The ID of the quiz to delete.
 * @returns A promise that resolves when the quiz is deleted.
 */
export async function deleteQuiz(id: string): Promise<void> {
  await apiRequest<void>(`${API_BASE_URL}/quizzes/${id}`, {
    method: 'DELETE',
  });
}