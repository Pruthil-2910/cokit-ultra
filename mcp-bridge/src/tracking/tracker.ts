export class TokenTracker {
  private sessionStart: number;
  private savings: Map<string, { tokens: number; cost: number }>;

  constructor() {
    this.sessionStart = Date.now();
    this.savings = new Map();
    
    // Initialize plugins
    ['caveman', 'ponytail', 'claude-mem', 'code-memory', 'fastcontext'].forEach((p) => {
      this.savings.set(p, { tokens: 0, cost: 0 });
    });
  }

  recordSavings(plugin: string, tokensSaved: number) {
    const current = this.savings.get(plugin) || { tokens: 0, cost: 0 };
    const cost = tokensSaved * 0.000003; // Claude Pro rate: ~$3 per 1M tokens
    this.savings.set(plugin, {
      tokens: current.tokens + tokensSaved,
      cost: current.cost + cost,
    });
  }

  getSessionSavings(): { tokens: number; cost: number } {
    let totalTokens = 0;
    let totalCost = 0;

    for (const saving of this.savings.values()) {
      totalTokens += saving.tokens;
      totalCost += saving.cost;
    }

    return { tokens: totalTokens, cost: totalCost };
  }

  getDetailedGain(session: string) {
    const plugins: Record<string, { tokens: number; percent: number }> = {};
    let totalTokens = 0;

    for (const [plugin, saving] of this.savings.entries()) {
      plugins[plugin] = {
        tokens: saving.tokens,
        percent: this.calculatePercent(plugin),
      };
      totalTokens += saving.tokens;
    }

    const totalCost = totalTokens * 0.000003;

    return {
      plugins,
      total: {
        tokens: totalTokens,
        cost: totalCost,
      },
    };
  }

  private calculatePercent(plugin: string): number {
    // Estimated savings percentages based on benchmarks
    const percentages: Record<string, number> = {
      caveman: 65,
      ponytail: 54,
      'claude-mem': 80,
      'code-memory': 50,
      fastcontext: 60,
    };
    return percentages[plugin] || 0;
  }
}