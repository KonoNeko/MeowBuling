import { browserClock } from './reading-time';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { AgentReply, ChatMessage, KnowledgeSource, LocalStatus } from './local-types';
import type { ReadingSession } from './types';

export async function localApi<T>(path: string, body?: unknown, signal?: AbortSignal, method?: string): Promise<T> {
  const response = await fetch(path, { method: method || (body ? 'POST' : 'GET'),
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined, signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '本地服务请求失败。');
  return data as T;
}

export function Sources({ sources = [] }: { sources?: KnowledgeSource[] }) {
  if (!sources.length) return null;
  return <div className="space-y-2 mt-4">
    <p className="text-xs text-purple-300">本次检索资料 · 点击查看原文</p>
    {sources.map((source, i) => <details key={source.id} className="source-detail rounded-xl border border-white/10 bg-black/20 p-3">
      <summary className="cursor-pointer text-sm text-indigo-200">[{source.citation || `S${i + 1}`}] {source.title}</summary>
      <p className="whitespace-pre-wrap text-xs leading-6 text-indigo-200/80 mt-3">{source.text}</p>
      <p className="text-[10px] text-indigo-400 mt-2">{source.documentId.startsWith('card-') || source.documentId.startsWith('spread-') ? '内置资料 · 项目牌意与牌阵' : '本机导入资料'} · 片段 {source.id.split('-').at(-1)}</p>
    </details>)}
  </div>;
}

type Message = ChatMessage & { reply?: AgentReply };
export default function LocalAssistant({ reading }: { reading: ReadingSession }) {
  const [tab, setTab] = useState<'chat' | 'knowledge'>('chat');
  const [status, setStatus] = useState<LocalStatus | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const [useReading] = useState(true);
  const chatStorageKey = `meowbuling_agent_chat_${reading.id}`;
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(chatStorageKey) || '[]');
      return Array.isArray(saved) ? saved.filter(m => ['user', 'assistant'].includes(m?.role) && typeof m.content === 'string').slice(-24) : [];
    } catch { return []; }
  });
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ sources: KnowledgeSource[]; mode: string } | null>(null);
  const controller = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);

  async function refresh() { setStatus(await localApi<LocalStatus>('/api/status')); }
  useEffect(() => { void refresh().catch(e => setError(e.message)); return () => controller.current?.abort(); }, []);
  useEffect(() => {
    try { localStorage.setItem(chatStorageKey, JSON.stringify(messages.slice(-24))); }
    catch { setError('本地对话保存失败，浏览器存储空间可能不足。'); }
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const context = useReading && reading ? JSON.stringify({ question: reading.question, topic: reading.topicLabel, spread: reading.spreadName, style: reading.style === 'sharp' ? '犀利喵评，直接说明利弊与行动' : '温柔指引，委婉有同理心',
    cards: reading.cards.map((c, index) => ({ position: index + 1, name: c.name_cn, reversed: c.isReversed, reading: reading.interpretation?.cardReadings?.[index]?.interpretation, advice: reading.interpretation?.cardReadings?.[index]?.advice })),
    summary: reading.interpretation?.mainTheme, outcome: reading.interpretation?.outcome, analysis: reading.interpretation?.detailedAnalysis, advice: reading.interpretation?.advice }) : '';

  useEffect(() => {
    const controller = new AbortController();
    void localApi<AgentReply>('/api/agent', {
      clock: browserClock(),
      messages: [{ role: 'user', content: '请根据这次占卜的完整结果，只生成用户最可能继续追问的2到4个具体问题，不要回答问题。' }],
      context,
      suggestionsOnly: true,
    }, controller.signal).then(reply => setSuggestedQuestions(reply.followUpQuestions || [])).catch(() => undefined);
    return () => controller.abort();
  }, [reading.id]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim() || busy) return;
    const message: Message = { role: 'user', content: input.trim() };
    const next = [...messages, message];
    setMessages(next); setInput(''); setBusy(true); setError('');
    controller.current = new AbortController();
    try {
      const reply = await localApi<AgentReply>('/api/agent', { clock: browserClock(), messages: next.slice(-12).map(({ role, content }) => ({ role, content: content.slice(0, 6000) })), context }, controller.current.signal);
      setMessages([...next, { role: 'assistant', content: reply.text, reply }]);
      setSuggestedQuestions(reply.followUpQuestions || []);
    } catch (error) {
      setMessages(messages); setInput(message.content);
      setError((error as Error).name === 'AbortError' ? '已停止，可以修改问题后再次发送。' : (error as Error).message);
    } finally { setBusy(false); controller.current = null; }
  }
  async function operate(action: () => Promise<void>) {
    setWorking(true); setError(''); setNotice('');
    try { await action(); await refresh(); } catch (error) { setError((error as Error).message); }
    finally { setWorking(false); }
  }
  async function importFile(file?: File) {
    if (!file) return;
    setError('');
    try {
      if (!/\.(txt|md)$/i.test(file.name)) throw new Error('目前支持 UTF-8 编码的 .txt 和 .md 文件。');
      if (file.size > 1_000_000) throw new Error('单个文件请小于 1 MB。');
      const content = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      setTitle(file.name); setText(content);
    } catch (error) { setError((error as Error).message); }
  }

  const ready = status?.agentReady;
  return <div className="h-full overflow-y-auto p-4 pt-20 pb-28 custom-scrollbar">
    <div className="max-w-5xl mx-auto space-y-5">
      <header className="flex flex-wrap gap-4 items-start justify-between">
        <div><p className="text-xs tracking-widest text-purple-300 mb-2">MEOWBULING · GPT</p><h2 className="text-3xl text-white">这次占卜，喵帮你划重点</h2><p className="text-sm text-indigo-300 mt-2">围绕刚才的牌面继续追问，喵卜灵会把答案说短、说准、说人话。</p></div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs space-y-1">
          <p className={ready ? 'text-emerald-300' : 'text-amber-200'}>{ready ? '● GPT 已配置' : status ? '○ GPT 待配置' : '正在检查本地服务…'}</p>
          <p className="text-indigo-300">{status?.agentModel || 'GPT'} · 本地知识库</p>
          <button className="text-purple-300 underline" onClick={() => void refresh().catch(e => setError(e.message))}>刷新状态</button>
        </div>
      </header>
      {status && !ready && <div className="rounded-xl bg-amber-500/10 border border-amber-300/20 p-4 text-sm text-amber-100">
        请在本机配置 GPT Key 并重启程序。知识库仍可使用关键词检索。<p className="mt-2 font-mono text-xs">OPENAI_API_KEY · .env.local</p>
      </div>}
      {error && <p role="alert" className="bg-red-900/30 border border-red-400/30 rounded-xl p-3 text-sm text-red-200 break-words">{error}</p>}
      {notice && <p role="status" className="text-sm text-emerald-200">{notice}</p>}
      {tab === 'chat' && <p className="text-xs leading-5 text-indigo-400">知识库保存在本机；对话、当前解读背景及检索到的相关片段会发送给 GPT，用于生成回答。</p>}
      {tab === 'chat' ? <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-300">
          <span>只根据本次「{reading.spreadName}」的牌面和解读回答</span>
          <button disabled={busy} onClick={() => setMessages([])} className="text-purple-300 disabled:opacity-40">清空对话</button>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/15 p-4 md:p-6 space-y-5 min-h-64 max-h-[55dvh] overflow-y-auto">
          {!messages.length && <div className="py-8 text-center"><div className="text-4xl mb-4">🐱</div><p className="text-indigo-100">喵，想继续拆解这次结果的哪一层？</p><div className="flex flex-wrap justify-center gap-2 mt-5">{suggestedQuestions.map(q => <button key={q} onClick={() => setInput(q)} className="rounded-xl border border-purple-400/20 p-3 text-xs text-purple-200 hover:bg-purple-900/30">{q}</button>)}</div></div>}
          {messages.map((message, i) => <article key={i} className={`rounded-2xl p-4 ${message.role === 'user' ? 'bg-purple-600/20 ml-4 md:ml-16' : 'bg-white/5 mr-0 md:mr-8'}`}>
            <p className="text-xs text-purple-300 mb-2">{message.role === 'user' ? '你' : '喵灵 · GPT Agent'}</p>
            {message.role === 'assistant' ? <div className="assistant-prose break-words leading-7 text-sm text-indigo-100"><ReactMarkdown>{message.content}</ReactMarkdown></div> : <p className="whitespace-pre-wrap break-words leading-7 text-sm text-indigo-100">{message.content}</p>}
            {message.reply && <><details className="mt-3 text-xs text-indigo-400"><summary className="cursor-pointer">查看工具调用 · {message.reply.steps.length} 次</summary><ul className="space-y-2 mt-2">{message.reply.steps.map((step, j) => <li key={j}>{step.tool}：{step.detail}</li>)}</ul></details><Sources sources={message.reply.sources} /></>}
          </article>)}
          {messages.length > 0 && suggestedQuestions.length > 0 && <div className="rounded-xl border border-purple-400/20 bg-purple-500/5 p-3"><p className="text-xs text-purple-300 mb-2">继续追问这次结果：</p><div className="flex flex-wrap gap-2">{suggestedQuestions.map(q => <button key={q} type="button" onClick={() => setInput(q)} className="rounded-lg border border-purple-400/20 px-3 py-2 text-xs text-purple-200 hover:bg-purple-900/30">{q}</button>)}</div></div>}
          {busy && <p role="status" className="text-sm text-purple-300 animate-pulse">喵灵正在检索本地资料，由 GPT 组织回答…</p>}
          <div ref={end} />
        </div>
        <form onSubmit={send} className="flex gap-3 items-end rounded-2xl bg-[#0f0c29] p-2 border border-white/10">
          <label className="flex-1 min-w-0"><span className="sr-only">向喵灵提问</span><textarea value={input} onChange={e => setInput(e.target.value)} maxLength={2000} rows={3} placeholder="针对这次牌面继续问，喵会帮你浓缩答案…" className="local-input resize-y" /></label>
          {busy ? <button type="button" onClick={() => controller.current?.abort()} className="local-button bg-white/10">停止</button> : <button disabled={!ready || !input.trim()} className="local-button">发送</button>}
        </form>
      </section> : <section className="space-y-5">
        <div className="grid grid-cols-3 gap-3">{[['资料', status?.documents.length || 0], ['知识片段', status?.chunks || 0], ['自定义资料', status?.documents.filter(d => !d.builtin).length || 0]].map(([label, value]) => <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-4"><p className="text-2xl text-purple-100">{value}</p><p className="text-xs text-indigo-400 mt-1">{label}</p></div>)}</div>
        <p className="text-sm text-indigo-300">知识库作为补充资料，GPT 会结合问题独立展开分析。保存后即可检索，无需安装本地模型。</p>
        <div className="grid md:grid-cols-2 gap-5">
          <form className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3" onSubmit={e => { e.preventDefault(); void operate(async () => { await localApi('/api/knowledge/documents', { title, text }); setTitle(''); setText(''); setNotice('资料已保存，可立即作为 GPT 的补充参考。'); }); }}>
            <h3 className="text-lg text-white">加入你的资料</h3>
            <label className="block text-xs text-indigo-300">选择 UTF-8 文本文件（TXT / Markdown，最多 1 MB）<input type="file" accept=".txt,.md" disabled={working} onChange={e => { void importFile(e.target.files?.[0]); e.target.value = ''; }} className="block mt-2 w-full text-xs" /></label>
            <label className="block text-xs text-indigo-300">资料标题<input className="local-input mt-1" value={title} maxLength={160} onChange={e => setTitle(e.target.value)} required /></label>
            <label className="block text-xs text-indigo-300">资料正文<textarea className="local-input mt-1" rows={6} value={text} maxLength={500000} onChange={e => setText(e.target.value)} required placeholder="粘贴学习笔记、牌意资料或自己的解读经验…" /></label>
            <button disabled={working || !title.trim() || !text.trim()} className="local-button">保存到知识库</button>
          </form>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
            <h3 className="text-lg text-white">查找知识</h3>
            <form onSubmit={e => { e.preventDefault(); void operate(async () => setResults(await localApi('/api/knowledge/search', { query }))); }} className="flex gap-2"><input aria-label="搜索知识库" className="local-input min-w-0" value={query} maxLength={1000} onChange={e => setQuery(e.target.value)} placeholder="例如：关系中的边界" required /><button disabled={working} className="local-button shrink-0">搜索</button></form>
            {results && <><p className="text-xs text-purple-300">{results.mode} · {results.sources.length} 条结果</p><Sources sources={results.sources} />{!results.sources.length && <p className="text-sm text-indigo-300">没有找到相关资料，请换个关键词或导入更多内容。</p>}</>}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 p-5"><h3 className="text-lg text-white mb-3">资料目录</h3>
          <p className="text-xs text-indigo-400 mb-4">内置 {status?.documents.filter(d => d.builtin).length || 0} 份牌意与牌阵资料 · 自定义资料存储于用户目录下的 .meowbuling</p>
          <div className="space-y-2">{status?.documents.filter(d => !d.builtin).map(doc => <div key={doc.id} className="flex items-center gap-3 justify-between bg-white/5 rounded-lg p-3"><span className="text-sm text-indigo-200 break-all">{doc.title} <span className="text-xs text-indigo-400">{doc.chunks} 个片段</span></span><button disabled={working} className="text-xs text-red-300 shrink-0" onClick={() => void operate(async () => { await localApi(`/api/knowledge/documents/${doc.id}`, undefined, undefined, 'DELETE'); setResults(null); setNotice(`已删除“${doc.title}”。`); })}>删除</button></div>)}</div>
          <details className="mt-4 text-xs text-indigo-300"><summary className="cursor-pointer">浏览内置目录</summary><ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3">{status?.documents.filter(d => d.builtin).map(doc => <li key={doc.id}>{doc.title}</li>)}</ul></details>
        </div>
      </section>}
    </div>
  </div>;
}
