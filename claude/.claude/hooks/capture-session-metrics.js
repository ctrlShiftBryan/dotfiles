#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id;
    const projectDir = data.workspace?.project_dir || data.cwd;

    if (!sessionId || !projectDir) return;

    // Build metrics object
    const metrics = {
      timestamp: new Date().toISOString(),
      model: data.model?.display_name || null,
      cost_usd: data.cost?.total_cost_usd || 0,
      session_duration_ms: data.cost?.total_duration_ms || 0,
      api_duration_ms: data.cost?.total_api_duration_ms || 0,
      context_remaining_pct: data.context_window?.remaining_percentage || null,
      context_size: data.context_window?.context_window_size || null,
      tokens: {
        input: data.context_window?.current_usage?.input_tokens || 0,
        output: data.context_window?.current_usage?.output_tokens || 0,
        cache_creation: data.context_window?.current_usage?.cache_creation_input_tokens || 0,
        cache_read: data.context_window?.current_usage?.cache_read_input_tokens || 0
      }
    };

    // Write to sidecar file in Claude projects dir
    const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
    const projectSlug = projectDir.replace(/\//g, '-');
    const metricsDir = path.join(claudeProjectsDir, projectSlug);
    const metricsFile = path.join(metricsDir, `${sessionId}.metrics.json`);

    if (fs.existsSync(metricsDir)) {
      fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
    }
  } catch (e) {
    // Silent fail
  }
});
