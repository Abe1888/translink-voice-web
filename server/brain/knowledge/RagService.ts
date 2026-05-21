import fs from 'fs';
import path from 'path';

export interface KnowledgeSnippet {
  id: string;
  text: string;
  score: number;
  metadata: {
    source: string;
    chunkIndex: number;
  };
}

export class RagService {
  private snippets: KnowledgeSnippet[] = [];
  private indexedAt = 0;

  constructor() {
    this.rebuildIndex();
  }

  async retrieveContext(query: string): Promise<string> {
    const snippets = await this.retrieveSnippets(query, 4);
    if (snippets.length === 0) return "TRANSLINK KNOWLEDGE: No specific matching snippet found.";

    return [
      "TRANSLINK RETRIEVED KNOWLEDGE:",
      ...snippets.map((snippet, index) => {
        return `[${index + 1}] ${snippet.metadata.source} (score ${snippet.score.toFixed(2)}):\n${snippet.text}`;
      }),
    ].join("\n\n");
  }

  async retrieveSnippets(query: string, limit = 4): Promise<KnowledgeSnippet[]> {
    if (this.snippets.length === 0) this.rebuildIndex();

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const scored = this.snippets
      .map((snippet) => ({
        ...snippet,
        score: this.scoreSnippet(queryTokens, snippet.text),
      }))
      .filter((snippet) => snippet.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }

  async indexDocument(docId: string, content: string): Promise<void> {
    const chunks = this.chunkText(content);
    const newSnippets = chunks.map((text, index) => ({
      id: `${docId}:${index}`,
      text,
      score: 0,
      metadata: {
        source: docId,
        chunkIndex: index,
      },
    }));

    this.snippets = [
      ...this.snippets.filter((snippet) => snippet.metadata.source !== docId),
      ...newSnippets,
    ];
    this.indexedAt = Date.now();
    console.log(`[RAG] Indexed ${newSnippets.length} chunks from ${docId}`);
  }

  getStats(): { snippets: number; indexedAt: number } {
    return {
      snippets: this.snippets.length,
      indexedAt: this.indexedAt,
    };
  }

  rebuildIndex(): void {
    const configDir = path.resolve(process.cwd(), 'src/translinkconfig/live-voice');
    const snippets: KnowledgeSnippet[] = [];

    try {
      if (!fs.existsSync(configDir)) {
        this.snippets = [];
        return;
      }

      const files = fs
        .readdirSync(configDir)
        .filter((file) => file.endsWith('.md') || file.endsWith('.txt'));

      for (const file of files) {
        const filePath = path.join(configDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        this.chunkText(content).forEach((text, chunkIndex) => {
          snippets.push({
            id: `${file}:${chunkIndex}`,
            text,
            score: 0,
            metadata: {
              source: file,
              chunkIndex,
            },
          });
        });
      }

      this.snippets = snippets;
      this.indexedAt = Date.now();
      console.log(`[RAG] Built local retrieval index with ${snippets.length} chunks.`);
    } catch (error) {
      console.error('[RAG] Failed to rebuild local knowledge index:', error);
      this.snippets = [];
    }
  }

  private chunkText(content: string): string[] {
    const normalized = content
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);

    const chunks: string[] = [];
    let current = "";
    const maxChars = 1200;

    for (const part of normalized) {
      if ((current + "\n\n" + part).length > maxChars && current) {
        chunks.push(current);
        current = part;
      } else {
        current = current ? `${current}\n\n${part}` : part;
      }
    }

    if (current) chunks.push(current);
    return chunks;
  }

  private scoreSnippet(queryTokens: string[], text: string): number {
    const textTokens = this.tokenize(text);
    if (textTokens.length === 0) return 0;

    const frequencies = new Map<string, number>();
    textTokens.forEach((token) => frequencies.set(token, (frequencies.get(token) || 0) + 1));

    let score = 0;
    const uniqueQueryTokens = Array.from(new Set(queryTokens));
    uniqueQueryTokens.forEach((token) => {
      const frequency = frequencies.get(token) || 0;
      if (frequency > 0) score += 1 + Math.log(1 + frequency);
    });

    return score / Math.sqrt(textTokens.length / 80);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2 && !this.stopWords.has(token));
  }

  private readonly stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
    'from',
    'are',
    'you',
    'your',
    'our',
    'into',
    'can',
    'will',
    'about',
  ]);
}

export const ragService = new RagService();
