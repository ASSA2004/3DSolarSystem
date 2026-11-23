export interface LessonStep {
  title: string;
  concept: string;
  action: string;
  why: string;
  check: string;
  choices: string[];
  answer: number;
  target: string;
}
export interface LabContent {
  id: string;
  title: string;
  hook: string;
  subject: string;
  prediction: string;
  predictions: string[];
  steps: LessonStep[];
  note: string;
}
