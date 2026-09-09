export interface KnowledgeSource {
  id: string;
  title: string;
  text: string;
  documentId: string;
  citation?: string;
  score?: number;
}
export interface KnowledgeDocument {
  id: string;
  title: string;
  builtin: boolean;
  chunks: number;
}
export interface AgentReply {
  text: string;
  sources: KnowledgeSource[];
  steps: { tool: string; detail: string }[];
}
export interface ChatMessage { role: 'user' | 'assistant'; content: string }
export interface LocalStatus {
  agentProvider: 'openai';
  agentModel: string;
  agentReady: boolean;
  model: string;
  documents: KnowledgeDocument[];
  chunks: number;
}
