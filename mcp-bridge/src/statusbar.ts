#!/usr/bin/env node

// Status bar renderer for Claude Code
// Shows real-time plugin status and token savings

import { execSync } from 'child_process';

function getStatus() {
  try {
    // Query MCP server for status
    const result = execSync('echo \'{"jsonrpc":"2.0","method":"cokit-status","params":{},"id":1}\' | docker exec -i $(docker ps -q -f name=mcp-server) node dist/server.js', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    const response = JSON.parse(result);
    return response.result;
  } catch {
    return null;
  }
}

function render() {
  const status = getStatus();
  
  if (!status) {
    process.stdout.write('cokit-ultra: ❌ offline');
    return;
  }
  
  const plugins = status.plugins || [];
  const savings = status.savings || { tokens: 0, cost: 0 };
  
  const parts = [];
  
  // Plugin status
  plugins.forEach(p => {
    const icon = p.enabled ? '✅' : '❌';
    parts.push(`${icon} ${p.name}`);
  });
  
  // Savings
  parts.push(`💰 -${savings.tokens.toLocaleString()} tokens`);
  parts.push(`$${savings.cost.toFixed(4)}`);
  
  process.stdout.write(parts.join(' | '));
}

render();