
export interface TranslationResult {
  original: string;
  translated: string;
  pronunciation?: string;
  context?: string;
}

export interface HistoryItem extends TranslationResult {
  id: string;
  timestamp: number;
}

export enum TranslationMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE'
}
