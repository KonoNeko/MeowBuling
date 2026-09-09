import { createOpenAI } from '@ai-sdk/openai';
import { ProxyAgent, fetch as proxyFetch } from 'undici';
import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { config } from './config';

function proxyAddress() {
  const explicit = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (explicit) return explicit;
  if (process.platform !== 'win32') return undefined;
  try {
    const settings = execFileSync('reg.exe', ['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'], { encoding: 'utf8', windowsHide: true, timeout: 3000 });
    if (!/ProxyEnable\s+REG_DWORD\s+0x1\b/.test(settings)) return undefined;
    let address = settings.match(/ProxyServer\s+REG_SZ\s+([^\r\n]+)/)?.[1].trim();
    if (address?.includes('=')) address = address.split(';').find(value => value.startsWith('https='))?.slice(6) || address.split(';').find(value => value.startsWith('http='))?.slice(5);
    return address ? (/^https?:\/\//.test(address) ? address : `http://${address}`) : undefined;
  } catch { return undefined; }
}
const proxy = proxyAddress();
const dispatcher = proxy ? new ProxyAgent(proxy) : undefined;
const fetchWithProxy = proxyFetch as unknown as typeof globalThis.fetch;
const openai = createOpenAI({ apiKey: config.openaiKey, fetch: async (url, init) => {
  if (!config.openaiKey) throw new Error('请在本机 .env.local 配置 OPENAI_API_KEY，然后重启程序。');
  let response: Response;
  try {
    response = await fetchWithProxy(url, { ...init, ...(dispatcher ? { dispatcher } : {}) } as RequestInit);
    for (let attempt = 0; attempt < 2 && [500, 502, 503, 504].includes(response.status); attempt++) {
      await response.body?.cancel();
      await delay(1000 * (attempt + 1), undefined, { signal: init?.signal || undefined });
      response = await fetchWithProxy(url, { ...init, ...(dispatcher ? { dispatcher } : {}) } as RequestInit);
    }
  }
  catch (error) {
    if (init?.signal?.aborted) throw error;
    throw new Error('无法连接 OpenAI，请检查网络或本机代理。');
  }
  if (!response.ok) {
    await response.body?.cancel();
    const hints: Record<number, string> = { 400: '请求不被模型支持', 401: 'Key 无效', 403: 'Key 权限不足或地区受限', 404: '模型不可用', 429: '模型额度不足或请求过于频繁', 503: '模型暂时繁忙' };
    throw new Error(`OpenAI ${config.agentModel}：${hints[response.status] || '服务请求失败'}（HTTP ${response.status}）。`);
  }
  return response;
} });

export const assistantModel = () => openai.responses(config.agentModel);
