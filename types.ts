
export interface TarotMeaningDetail {
  keywords: string[];
  general: string;
  love: string;
  career: string;
  // New Dimensions
  study: string;   // 学业与成长
  social: string;  // 人际与社交
  family: string;  // 家庭与居住
  health: string;  // 健康与身心
  self: string;    // 内在状态
  spirit: string;  // 灵性与命运
  action: string;  // 决策与行动
  trend: string;   // 时间与趋势
}

export interface TarotCard {
  id: number;
  name: string;
  name_cn: string;
  image: string; // URL for the real card image
  emoji?: string; // Fallback or icon
  meaningUpright: string; // Short Summary
  meaningReversed: string; // Short Summary
  isReversed?: boolean; // State for a drawn card
  
  // Detailed Interpretations
  upright: TarotMeaningDetail;
  reversed: TarotMeaningDetail;
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
  SPREAD_LIBRARY = 'SPREAD_LIBRARY'
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
