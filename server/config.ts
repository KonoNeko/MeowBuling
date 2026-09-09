import path from 'node:path';
import os from 'node:os';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

for (const file of ['.env.local', '.env']) if (existsSync(file)) loadEnvFile(file);

export const config = {
  openaiKey: process.env.OPENAI_API_KEY || '',
  agentModel: process.env.OPENAI_MODEL || 'gpt-5.5',
  dataDir: process.env.MEOWBULING_DATA_DIR || path.join(os.homedir(), '.meowbuling'),
};

export async function modelStatus() {
  return { agentProvider: 'openai', agentModel: config.agentModel, agentReady: !!config.openaiKey, model: config.agentModel };
}
