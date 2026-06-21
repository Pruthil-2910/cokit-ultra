import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequest,
  ListToolsRequest,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { PluginManager } from './plugins/manager.js';
import { ToggleManager } from './toggles/manager.js';
import { TokenTracker } from './tracking/tracker.js';
import { FastContextClient } from './fastcontext/client.js';

// Plugin toggle definitions
const TOOLS: Tool[] = [
  {
    name: 'cokit-toggle',
    description: 'Toggle cokit-ultra plugins on/off',
    inputSchema: {
      type: 'object',
      properties: {
        plugin: {
          type: 'string',
          enum: ['caveman', 'ponytail', 'claude-mem', 'code-memory', 'fastcontext'],
          description: 'Plugin to toggle',
        },
        action: {
          type: 'string',
          enum: ['on', 'off', 'status'],
          description: 'Action to perform',
        },
      },
      required: ['plugin', 'action'],
    },
  },
  {
    name: 'cokit-mode',
    description: 'Set cokit-ultra preset mode',
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['minimal', 'full', 'search', 'memory', 'off'],
          description: 'Preset mode',
        },
      },
      required: ['mode'],
    },
  },
  {
    name: 'cokit-status',
    description: 'Show cokit-ultra status and token savings',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'cokit-gain',
    description: 'Show detailed token savings and cost reduction',
    inputSchema: {
      type: 'object',
      properties: {
        session: {
          type: 'string',
          enum: ['current', 'all'],
          description: 'Which session to show',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_codebase',
    description: 'Search codebase semantically (powered by code-memory)',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        search_type: {
          type: 'string',
          enum: ['definition', 'references', 'file_structure'],
          description: 'Type of search',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'index_codebase',
    description: 'Index codebase for semantic search',
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Directory to index',
        },
      },
      required: [],
    },
  },
];

// Mode presets
const MODE_PRESETS = {
  minimal: ['caveman', 'ponytail'],
  full: ['caveman', 'ponytail', 'claude-mem', 'code-memory', 'fastcontext'],
  search: ['fastcontext', 'code-memory'],
  memory: ['claude-mem', 'code-memory'],
  off: [],
};

class CokitUltraServer {
  private server: Server;
  private pluginManager: PluginManager;
  private toggleManager: ToggleManager;
  private tokenTracker: TokenTracker;
  private fastContextClient: FastContextClient;

  constructor() {
    this.server = new Server(
      {
        name: 'cokit-ultra',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.pluginManager = new PluginManager();
    this.toggleManager = new ToggleManager();
    this.tokenTracker = new TokenTracker();
    this.fastContextClient = new FastContextClient();

    this.setupHandlers();
  }

  private setupHandlers() {
    // List tools
    this.server.setRequestHandler(ListToolsRequest, async () => {
      return { tools: TOOLS };
    });

    // Call tools
    this.server.setRequestHandler(CallToolRequest, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'cokit-toggle':
          return await this.handleToggle(args as any);
        
        case 'cokit-mode':
          return await this.handleMode(args as any);
        
        case 'cokit-status':
          return await this.handleStatus();
        
        case 'cokit-gain':
          return await this.handleGain(args as any);
        
        case 'search_codebase':
          return await this.handleSearchCodebase(args as any);
        
        case 'index_codebase':
          return await this.handleIndexCodebase(args as any);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleToggle(args: { plugin: string; action: string }) {
    const { plugin, action } = args;

    if (action === 'status') {
      const enabled = this.toggleManager.isEnabled(plugin);
      return {
        content: [
          {
            type: 'text',
            text: `Plugin '${plugin}' is ${enabled ? '✅ ON' : '❌ OFF'}`,
          },
        ],
      };
    }

    if (action === 'on') {
      this.toggleManager.enable(plugin);
      await this.pluginManager.activate(plugin);
      return {
        content: [
          {
            type: 'text',
            text: `✅ Enabled '${plugin}'`,
          },
        ],
      };
    }

    if (action === 'off') {
      this.toggleManager.disable(plugin);
      await this.pluginManager.deactivate(plugin);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Disabled '${plugin}'`,
          },
        ],
      };
    }

    throw new Error(`Invalid action: ${action}`);
  }

  private async handleMode(args: { mode: string }) {
    const { mode } = args;
    const preset = MODE_PRESETS[mode as keyof typeof MODE_PRESETS];

    if (!preset) {
      throw new Error(`Invalid mode: ${mode}`);
    }

    // Disable all plugins first
    for (const plugin of ['caveman', 'ponytail', 'claude-mem', 'code-memory', 'fastcontext']) {
      this.toggleManager.disable(plugin);
      await this.pluginManager.deactivate(plugin);
    }

    // Enable preset plugins
    for (const plugin of preset) {
      this.toggleManager.enable(plugin);
      await this.pluginManager.activate(plugin);
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Mode '${mode}' activated\nEnabled: ${preset.join(', ') || 'none'}`,
        },
      ],
    };
  }

  private async handleStatus() {
    const plugins = ['caveman', 'ponytail', 'claude-mem', 'code-memory', 'fastcontext'];
    const status = plugins.map((p) => ({
      name: p,
      enabled: this.toggleManager.isEnabled(p),
      version: this.pluginManager.getVersion(p),
    }));

    const savings = this.tokenTracker.getSessionSavings();

    const statusText = `
┌─────────────────────────────────────┐
│     COKIT-ULTRA STATUS              │
├─────────────────────────────────────┤
│ PLUGINS:                            │
${status.map((p) => `│   ${p.enabled ? '✅' : '❌'} ${p.name.padEnd(12)} v${p.version}`).join('\n')}
├─────────────────────────────────────┤
│ SESSION SAVINGS:                    │
│   Tokens saved: ${savings.tokens.toLocaleString()}
│   Cost saved: $${savings.cost.toFixed(4)}
└─────────────────────────────────────┘
`;

    return {
      content: [
        {
          type: 'text',
          text: statusText,
        },
      ],
    };
  }

  private async handleGain(args: { session?: string } = {}) {
    const { session = 'current' } = args;
    const gain = this.tokenTracker.getDetailedGain(session);

    const gainText = `
┌─────────────────────────────────────┐
│     TOKEN SAVINGS BREAKDOWN         │
├─────────────────────────────────────┤
${Object.entries(gain.plugins)
  .map(([k, v]) => `│   ${k.padEnd(12)}: -${v.tokens.toLocaleString()} tokens (${v.percent}%)`)
  .join('\n')}
├─────────────────────────────────────┤
│   TOTAL: ${gain.total.tokens.toLocaleString()} tokens saved
│   VALUE: $${gain.total.cost.toFixed(4)} (Claude Pro)
└─────────────────────────────────────┘
`;

    return {
      content: [
        {
          type: 'text',
          text: gainText,
        },
      ],
    };
  }

  private async handleSearchCodebase(args: { query: string; search_type?: string }) {
    const enabled = this.toggleManager.isEnabled('code-memory');
    
    if (!enabled) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ code-memory plugin is disabled. Enable with `/cokit-toggle code-memory on`',
          },
        ],
      };
    }

    const results = await this.pluginManager.searchCodebase(args.query, args.search_type);
    
    return {
      content: [
        {
          type: 'text',
          text: results,
        },
      ],
    };
  }

  private async handleIndexCodebase(args: { directory?: string }) {
    const enabled = this.toggleManager.isEnabled('code-memory');
    
    if (!enabled) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ code-memory plugin is disabled. Enable with `/cokit-toggle code-memory on`',
          },
        ],
      };
    }

    const result = await this.pluginManager.indexCodebase(args.directory);
    
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('cokit-ultra MCP server running on stdio');
  }
}

// Start server
const server = new CokitUltraServer();
server.run().catch(console.error);