import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export class ToggleManager {
  private configPath: string;
  private config: Record<string, boolean>;

  constructor() {
    this.configPath = process.env.COKIT_CONFIG_PATH || join(process.env.APPDATA || process.env.HOME || '.', '.cokit-ultra', 'config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): Record<string, boolean> {
    try {
      const data = readFileSync(this.configPath, 'utf-8');
      return JSON.parse(data).plugins || {};
    } catch {
      // Default: all enabled
      return {
        caveman: true,
        ponytail: true,
        'claude-mem': true,
        'code-memory': true,
        fastcontext: true,
      };
    }
  }

  private saveConfig() {
    try {
      writeFileSync(this.configPath, JSON.stringify({ plugins: this.config }, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  enable(plugin: string) {
    this.config[plugin] = true;
    this.saveConfig();
  }

  disable(plugin: string) {
    this.config[plugin] = false;
    this.saveConfig();
  }

  isEnabled(plugin: string): boolean {
    return this.config[plugin] !== false;
  }

  getAll(): Record<string, boolean> {
    return { ...this.config };
  }
}