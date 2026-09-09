import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { TAROT_DECK, SPREADS } from '../constants';
import type { KnowledgeSource } from '../local-types';
import { config } from './config';

type Document = { id: string; title: string; text: string; builtin: boolean };
export function chunkText(text: string, size = 700, overlap = 100): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  const chunks: string[] = [];
  for (let start = 0; start < normalized.length; start += size - overlap) {
    chunks.push(normalized.slice(start, start + size));
    if (start + size >= normalized.length) break;
  }
  return chunks;
}

export function tokens(text: string): string[] {
  const lower = text.toLowerCase();
  const chinese = lower.match(/[\p{Script=Han}]+/gu) || [];
  return [...(lower.match(/[a-z0-9]+/g) || []), ...chinese.flatMap(word =>
    word.length === 1 ? [word] : Array.from({ length: word.length - 1 }, (_, i) => word.slice(i, i + 2)))];
}

const fields: Record<string, string> = { general: '综合', love: '情感关系', career: '事业财富', study: '学业成长', social: '人际社交', family: '家庭', health: '身心', self: '内在', spirit: '精神', action: '行动', trend: '趋势' };
const builtin: Document[] = [
  ...TAROT_DECK.flatMap(card => (['upright', 'reversed'] as const).map(side => ({
    id: `card-${card.id}-${side}`, title: `${card.name_cn} · ${side === 'upright' ? '正位' : '逆位'}`,
    builtin: true,
    text: `${card.name_cn} (${card.name}) ${side === 'upright' ? '正位' : '逆位'}\n关键词：${card[side].keywords.join('、')}\n` +
      Object.entries(fields).map(([key, title]) => `${title}：${card[side][key as keyof typeof card.upright]}`).join('\n'),
  }))),
  ...SPREADS.map(spread => ({ id: `spread-${spread.id}`, title: `牌阵 · ${spread.name}`, builtin: true,
    text: `${spread.name}：${spread.description}\n${spread.positions.map(p => `${p.id}. ${p.name}：${p.description}`).join('\n')}` })),
];

export class KnowledgeStore {
  private custom: Document[] = [];
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private dir = config.dataDir) {}
  async load() {
    await mkdir(this.dir, { recursive: true });
    try { this.custom = JSON.parse(await readFile(path.join(this.dir, 'documents.json'), 'utf8')); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('本地知识库文件损坏，请备份 documents.json 后修复。'); }
    return this;
  }
  private async save(name: string, data: unknown) {
    const file = path.join(this.dir, name);
    const temp = `${file}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(data), 'utf8');
    await rename(temp, file);
  }
  private exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.queue.then(fn);
    this.queue = result.catch(() => undefined);
    return result;
  }
  chunks(): KnowledgeSource[] {
    return [...builtin, ...this.custom].flatMap(doc => chunkText(doc.text).map((text, i) => ({
      id: `${doc.id}-${i + 1}`, documentId: doc.id, title: doc.title, text,
    })));
  }
  status() {
    const chunks = this.chunks();
    return {
      documents: [...builtin, ...this.custom].map(({ id, title, builtin, text }) => ({ id, title, builtin, chunks: chunkText(text).length })),
      chunks: chunks.length,
    };
  }
  add(title: string, text: string) {
    return this.exclusive(async () => {
      const existing = this.custom.find(doc => doc.title === title && doc.text === text);
      if (existing) return existing.id;
      if (this.custom.length >= 200 || this.custom.reduce((n, doc) => n + doc.text.length, 0) + text.length > 10_000_000) throw new Error('知识库已达到本地资料容量限制，请删除不再需要的资料。');
      const document = { id: randomUUID(), title, text, builtin: false };
      const updated = [...this.custom, document];
      await this.save('documents.json', updated);
      this.custom = updated;
      return document.id;
    });
  }
  remove(id: string) {
    return this.exclusive(async () => {
      if (!this.custom.some(doc => doc.id === id)) throw new Error('只能删除自己导入的资料。');
      const updated = this.custom.filter(doc => doc.id !== id);
      await this.save('documents.json', updated);
      this.custom = updated;
    });
  }
  async search(query: string, limit = 6, signal?: AbortSignal): Promise<{ sources: KnowledgeSource[]; mode: string }> {
    const chunks = this.chunks();
    const terms = [...new Set(tokens(query))];
    const entries = chunks.map(chunk => ({ chunk, terms: tokens(`${chunk.title}\n${chunk.text}`) }));
    const avgLength = entries.reduce((n, entry) => n + entry.terms.length, 0) / entries.length;
    const frequencies = new Map(terms.map(term => [term, entries.filter(entry => entry.terms.includes(term)).length]));
    const lexical = entries.map(entry => {
      let score = 0;
      for (const term of terms) {
        const count = entry.terms.filter(t => t === term).length;
        const df = frequencies.get(term) || 0;
        if (count) score += Math.log(1 + (entries.length - df + 0.5) / (df + 0.5)) * (count * 2.2) / (count + 1.2 * (0.25 + 0.75 * entry.terms.length / avgLength));
      }
      return { ...entry.chunk, score };
    }).filter(c => c.score > 0).sort((a, b) => b.score - a.score);
    if (signal?.aborted) throw new Error('已取消知识检索。');
    return { mode: '补充资料检索', sources: lexical.slice(0, Math.max(1, Math.min(limit, 12))) };
  }
}
