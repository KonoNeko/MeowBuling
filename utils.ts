import { browserClock } from './reading-time';
import type { ReadingSession, AIInterpretation, TarotCard } from "./types";

// --- Local Storage Helpers ---

const STORAGE_KEY = 'meowbuling_history';

export const saveReading = (reading: ReadingSession) => {
  const history = getHistory();
  // Limit history to 50 entries to save space
  const updatedHistory = [reading, ...history].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
};

export const updateReadingReflection = (id: string, reflection: string) => {
  const history = getHistory();
  const index = history.findIndex(r => r.id === id);
  if (index !== -1) {
    history[index].userReflection = reflection;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
};

export const getHistory = (): ReadingSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse history", e);
    return [];
  }
};

// Generation is handled by GPT through the local server.
export const generateInterpretation = async (
  topicLabel: string, question: string, spreadId: string, cards: TarotCard[], style: import('./types').ReadingStyle = 'sharp'
): Promise<AIInterpretation> => {
  const response = await fetch('/api/interpret', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clock: browserClock(), topicLabel, question, spreadId, style,
      cards: cards.map(({ id, isReversed }) => ({ id, isReversed })) }),
    signal: AbortSignal.timeout(240000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'GPT 解读失败，请检查网络与模型额度。');
  return data;
};
