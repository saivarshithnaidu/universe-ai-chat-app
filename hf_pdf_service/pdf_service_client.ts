/**
 * PDF Service Client
 * A reusable client to interact with the HF PDF Service (FastAPI)
 * Supports PDF extraction and RAG (Vector Search) operations.
 */

export interface ExtractResponse {
  success: boolean;
  data: {
    text: string;
    pages: number;
    characters: number;
    filename: string;
  } | null;
  error: string | null;
}

export interface StoreResponse {
  success: boolean;
  data: {
    userId: string;
    chunks: number;
    duration_s: number;
  } | null;
  error: string | null;
}

export interface QueryResponse {
  success: boolean;
  data: {
    context: string;
    chunks_found: number;
  } | null;
  error: string | null;
}

export class PdfServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:7860') {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  /**
   * Extract text from a PDF file
   * @param file The PDF file object or Blob
   */
  async extractPdf(file: File | Blob): Promise<ExtractResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/extract`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Store extracted text in the RAG vector database
   * @param userId Unique identifier for the user
   * @param text The text to store
   * @param fileName Optional filename for metadata
   */
  async storeInRag(userId: string, text: string, fileName: string = 'document.pdf'): Promise<StoreResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/rag/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          userId,
          metadata: { fileName }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Query the RAG system for relevant context
   * @param userId Unique identifier for the user
   * @param question The question to ask
   * @param topK Number of relevant chunks to retrieve
   */
  async queryRag(userId: string, question: string, topK: number = 3): Promise<QueryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/rag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userId,
          top_k: topK
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Check if the backend service is running
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export a default instance for easy use
export const pdfService = new PdfServiceClient();
