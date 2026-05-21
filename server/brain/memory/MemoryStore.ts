export type MemoryRole = 'user' | 'assistant' | 'system' | 'event';

export interface SessionMemoryRecord {
  sessionId: string;
  role: MemoryRole;
  text: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface SessionMemoryStore {
  add(record: SessionMemoryRecord): Promise<void>;
  getRecent(sessionId: string, limit: number): Promise<SessionMemoryRecord[]>;
  clearSession(sessionId: string): Promise<void>;
  cleanupExpired?(maxAgeMs: number): Promise<number>;
  getStats?(): Promise<Record<string, unknown>>;
}

export interface UserProfileRecord {
  userId: string;
  profile: Record<string, unknown>;
  updatedAt: string;
}

export interface UserProfileStore {
  get(userId: string): Promise<UserProfileRecord | null>;
  update(userId: string, update: Record<string, unknown>): Promise<UserProfileRecord>;
  delete?(userId: string): Promise<void>;
}

export interface KnowledgeDocument {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeSearchResult {
  id: string;
  text: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeRetrievalStore {
  upsertDocument(document: KnowledgeDocument): Promise<void>;
  search(query: string, limit: number): Promise<KnowledgeSearchResult[]>;
  rebuild?(): Promise<void>;
  getStats?(): Promise<Record<string, unknown>>;
}

export interface AgentStorageAdapters {
  sessionMemory: SessionMemoryStore;
  userProfiles?: UserProfileStore;
  knowledgeRetrieval: KnowledgeRetrievalStore;
}
