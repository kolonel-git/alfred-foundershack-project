export type Priority = 'Academics' | 'Fitness' | 'Sleep' | 'Mental Health' | 'Schedule';

export interface UserProfile {
  name: string;
  role: string;
  priorities: Priority[];
  onboarded: boolean;
  focusArea?: Priority;
  checkInCompleted?: boolean;
  lastCheckInDate?: string;
}

export interface Task {
  id: string;
  title: string;
  category: Priority;
  completed: boolean;
  time?: string;
  suggested?: boolean;
  tags?: string[];
}

export interface DailyMetrics {
  steps: number;
  stepGoal: number;
  sleepHours: number;
  sleepMinutes: number;
  mood?: string;
}
