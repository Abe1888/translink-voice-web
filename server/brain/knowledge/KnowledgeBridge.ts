/**
 * KnowledgeBridge acts as the orchestrator between the Gemini Live session
 * and the Brain (Knowledge + Memory).
 */

import { memoryService } from "../memory/MemoryService.js";
import { ragService } from "../knowledge/RagService.js";

export class KnowledgeBridge {
  /**
   * Enriches a prompt or query with both user context (Memory)
   * and relevant company data (RAG).
   */
  async getEnrichedContext(sessionId: string, query: string): Promise<string> {
    const [history, knowledge] = await Promise.all([
      memoryService.getContext(sessionId),
      ragService.retrieveContext(query)
    ]);

    return `
SESSION HISTORY:
${history}

${knowledge}

USER QUERY:
${query}
    `.trim();
  }

  async recordInteraction(sessionId: string, userText: string, aiResponse: string) {
    await memoryService.addMemory(sessionId, `User: ${userText}`);
    await memoryService.addMemory(sessionId, `AI: ${aiResponse}`);
  }
}

export const knowledgeBridge = new KnowledgeBridge();
