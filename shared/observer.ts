export type Observation = {
  threadId: string | null; status: 'idle' | 'running' | 'completed' | 'interrupted' | 'failed' | 'unknown' | 'unavailable';
  label: string; checkedAt: string; updatedAt?: string; message?: string;
  messages: { id: string; text: string }[];
  activity: { id: string; label: string; status: 'running' | 'completed' | 'failed' }[];
};
