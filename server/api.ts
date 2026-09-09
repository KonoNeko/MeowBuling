import type { IncomingMessage, ServerResponse } from 'node:http';
import { z } from 'zod';
import { KnowledgeStore } from './knowledge';
import { modelStatus } from './config';
import { interpret, readingInput, runAgent, clockSchema } from './agent';

const importSchema = z.object({ title: z.string().trim().min(1).max(160), text: z.string().trim().min(1).max(500_000) });
const chatSchema = z.object({ clock: clockSchema, messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(6000) })).min(1).max(16), context: z.string().max(6000).optional() });

async function readJson(req: IncomingMessage) {
  let length = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 2_000_000) throw new Error('资料过大，请限制在 500,000 字以内。');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createApi() {
  const ready = new KnowledgeStore().load();
  // Keep startup failure observable through the API without an unhandled rejection.
  ready.catch(() => undefined);
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (!url.pathname.startsWith('/api/')) return next();
    const send = (code: number, value: unknown) => {
      if (res.destroyed) return;
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(value));
    };
    // Local-only API: reject remote hosts and cross-site mutations.
    const host = req.headers.host?.split(':')[0];
    if (!host || !['localhost', '127.0.0.1'].includes(host)) return send(403, { error: '仅允许本机访问。' });
    const origin = req.headers.origin;
    if (origin && origin !== `http://${req.headers.host}`) return send(403, { error: '不允许跨站访问本地知识库。' });
    if (req.headers['sec-fetch-site'] === 'cross-site') return send(403, { error: '不允许跨站访问。' });
    const controller = new AbortController();
    res.on('close', () => { if (!res.writableEnded) controller.abort(); });
    const timer = setTimeout(() => controller.abort(), 240_000);
    try {
      const store = await ready;
      if (url.pathname === '/api/status' && req.method === 'GET') return send(200, { ...store.status(), ...await modelStatus() });
      if (url.pathname === '/api/knowledge/search' && req.method === 'POST') {
        const input = z.object({ query: z.string().trim().min(1).max(1000) }).parse(await readJson(req));
        return send(200, await store.search(input.query, 6, controller.signal));
      }
      if (url.pathname === '/api/knowledge/documents' && req.method === 'POST') {
        const input = importSchema.parse(await readJson(req));
        return send(201, { id: await store.add(input.title, input.text) });
      }
      if (url.pathname.startsWith('/api/knowledge/documents/') && req.method === 'DELETE') {
        await store.remove(decodeURIComponent(url.pathname.split('/').pop()!));
        return send(200, { ok: true });
      }
      if (url.pathname === '/api/agent' && req.method === 'POST') {
        const input = chatSchema.parse(await readJson(req));
        if (input.messages.at(-1)?.role !== 'user') throw new Error('最后一条消息必须是你的问题。');
        return send(200, await runAgent(store, input.messages, input.context, controller.signal, input.clock));
      }
      if (url.pathname === '/api/interpret' && req.method === 'POST') return send(200, await interpret(store, readingInput.parse(await readJson(req)), controller.signal));
      return send(404, { error: '接口不存在。' });
    } catch (error) {
      const message = error instanceof z.ZodError ? '输入格式不正确或内容过长，请检查后重试。'
        : error instanceof SyntaxError ? '请求必须是有效 JSON。'
        : error instanceof Error ? error.message : '本地服务暂时不可用。';
      send(400, { error: controller.signal.aborted ? 'GPT 处理超时或已取消，请重试。' : message });
    } finally { clearTimeout(timer); }
  };
}
