import fetch from 'node-fetch';

export class FastContextClient {
  private endpoint: string;
  private queueUrl: string;

  constructor() {
    this.endpoint = process.env.FASTCONTEXT_ENDPOINT || 'http://localhost:3000';
    this.queueUrl = process.env.FASTCONTEXT_QUEUE_URL || 'http://localhost:3000/queue';
  }

  async query(query: string, codebasePath: string): Promise<string> {
    try {
      const response = await fetch(`${this.endpoint}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          codebase_path: codebasePath,
        }),
      });

      if (!response.ok) {
        throw new Error(`FastContext error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('FastContext query failed:', error);
      return 'FastContext service unavailable';
    }
  }

  async getQueueStatus(): Promise<{ position: number; waitTime: number }> {
    try {
      const response = await fetch(`${this.queueUrl}/status`);
      if (!response.ok) {
        return { position: 0, waitTime: 0 };
      }

      const data = await response.json();
      return {
        position: data.position,
        waitTime: data.estimated_wait_seconds,
      };
    } catch {
      return { position: 0, waitTime: 0 };
    }
  }
}