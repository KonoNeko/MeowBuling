export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface TarotCard {
  id: number;
  name: string;
  name_cn: string;
  image: string; // URL for the real card image
  emoji?: string; // Fallback or icon
  meaningUpright: string;
  meaningReversed: string;
  isReversed?: boolean; // State for a drawn card
}

export enum AppView {
  HOME = 'HOME',
  TOPIC_SELECT = 'TOPIC_SELECT',
  QUESTION_SELECT = 'QUESTION_SELECT',
  SPREAD_SELECT = 'SPREAD_SELECT',
  DRAW = 'DRAW',
  READING = 'READING',
  HISTORY = 'HISTORY',
  LIBRARY = 'LIBRARY',
  SPREAD_LIBRARY = 'SPREAD_LIBRARY' // New: Spread Library
}

export interface AIInterpretation {
  mainTheme: string;
  fable: string;
  detailedAnalysis: {
    title: string;
    content: string;
  }[];
  advice: string;
  reflectionQuestions: string[];
}

export interface SpreadPosition {
  id: number;
  name: string;
  description: string;
}

export interface SpreadDefinition {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  positions: SpreadPosition[];
  category: string;
  layout_type?: string; 
  tags: string[];
}

export interface ReadingSession {
  id: string;
  timestamp: number;
  topicId: string;
  topicLabel: string;
  question: string;
  spreadId: string;
  spreadName: string;
  cards: TarotCard[];
  interpretation?: AIInterpretation;
  userReflection?: string;
}

export interface Topic {
  id: string;
  label: string;
  icon: string;
  description: string;
  spreadCategories: string[];
  defaultTags?: string[];
  subCategories?: {
    title: string;
    questions: string[];
    spreadTags?: string[];
  }[];
}