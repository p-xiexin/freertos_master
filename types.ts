
export enum TaskState {
  RUNNING = 'RUNNING',
  READY = 'READY',
  BLOCKED = 'BLOCKED',
  SUSPENDED = 'SUSPENDED'
}

export interface Task {
  id: number;
  name: string;
  priority: number;
  state: TaskState;
  color: string;
  ticks: number;
}

export interface LogMessage {
  id: string;
  source: string;
  message: string;
  timestamp: string;
}

export enum ChapterId {
  INTRO = 'intro',
  TASKS = 'tasks',
  SCHEDULER = 'scheduler',
  CONTEXT = 'context',
  QUEUES = 'queues',
  SEMAPHORES = 'semaphores',
  INVERSION = 'inversion'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}
