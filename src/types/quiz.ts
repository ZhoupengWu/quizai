/**
 * Core domain types used to model quizzes, questions and user attempts.
 * Keep the structures serializable (e.g. can be stored in JSON) so they can
 * travel easily between frontend, backend and persistence layers.
 */
export type QuestionType = 'multiple_choice';

export interface Choice {
  id: string;
  label: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface Question {
  id: string;
  prompt: string;
  type: QuestionType;
  choices: Choice[];
  selectionMode?: 'single' | 'multiple';
  minSelections?: number;
  maxSelections?: number;
  required?: boolean;
  points: number;
  tags?: string[];
  timeLimitSeconds?: number;
  metadata?: Record<string, unknown>;
}

export interface QuizSettings {
  shuffleQuestions?: boolean;
  shuffleChoices?: boolean;
  allowRetake?: boolean;
  maxAttempts?: number;
  timeLimitSeconds?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
  authorId?: string;
  settings?: QuizSettings;
}

export interface UserAnswerChoice {
  choiceId: string;
  selected: boolean;
}

export interface UserAnswer {
  questionId: string;
  value?: string;
  choices?: UserAnswerChoice[];
  submittedAt: string;
  isSkipped?: boolean;
  confidence?: number; // 0-1 numeric confidence for adaptive scoring
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  answers: UserAnswer[];
  score?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  metadata?: Record<string, unknown>;
}

export type QuizSummary = Pick<
  Quiz,
  'id' | 'title' | 'description' | 'tags' | 'difficulty'
> & {
  questionCount: number;
  averageScore?: number;
};

