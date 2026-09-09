import { spreadQuestions } from './question-presets';
import React, { useRef, useState } from 'react';
import { SPREADS } from './constants';
import { Button, SpreadPreview } from './components';
import type { ReadingStyle, SpreadDefinition } from './types';

const categoryLabels: Record<string, string> = {
  'General Insight': '🔮 综合洞察', 'Love & Relationship': '💕 感情关系',
  'Career & Study': '🚀 事业学业', 'Decision-Making': '⚖️ 选择决策',
  Healing: '🌿 自我疗愈', 'Future Forecast': '✨ 未来趋势',
  'Daily Guidance': '☀️ 日常指引', Manifestation: '🌙 心愿探索',
};
const categories = [...new Set(SPREADS.map(spread => spread.category))];

export default function SpreadLibrary({ style, onStart }: {
  style: ReadingStyle;
  onStart: (spread: SpreadDefinition, question: string) => void;
}) {
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<SpreadDefinition | null>(null);
  const [question, setQuestion] = useState('');
  const scrollArea = useRef<HTMLDivElement>(null);
  const visible = SPREADS.filter(spread => category === 'all' || spread.category === category);
  const choose = (spread: SpreadDefinition) => {
    setSelected(spread);
    setQuestion('');
    scrollArea.current?.scrollTo({ top: 0 });
  };

  return <div className="h-full flex flex-col pt-20 pb-20 max-w-6xl mx-auto">
    <header className="px-4 sm:px-6 pb-3 shrink-0">
      <h2 className="text-2xl font-mystic text-white">🎴 选个牌阵，问问喵</h2>
      <p className="text-sm text-indigo-300 mt-2">选牌阵 → 输入你的问题 → 开始占卜</p>
    </header>
    {!selected && <nav aria-label="牌阵分类" className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 px-4 sm:px-6 pb-3 shrink-0 border-b border-white/10">
      {['all', ...categories].map(value => <button key={value} type="button" aria-pressed={category === value}
        className={`min-h-11 rounded-xl px-2 text-xs sm:text-sm transition-colors focus-visible:outline focus-visible:outline-purple-300 ${category === value ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-white/5 text-indigo-200 hover:bg-white/10'}`}
        onClick={() => { setCategory(value); scrollArea.current?.scrollTo({ top: 0 }); }}>
        {value === 'all' ? '🐾 全部牌阵' : categoryLabels[value] || value}
      </button>)}
    </nav>}
    <div ref={scrollArea} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-4">
      {selected ? <div className="max-w-2xl mx-auto space-y-4">
        <button type="button" onClick={() => setSelected(null)} className="min-h-11 text-sm text-purple-300">← 返回牌阵，重新选择</button>
        <section className="rounded-2xl border border-purple-400/25 bg-purple-900/20 p-5 space-y-3">
          <p className="text-xs text-indigo-300">{categoryLabels[selected.category]} · {selected.cardCount} 张牌</p>
          <h3 className="text-xl font-bold text-white">{selected.name}</h3>
          <p className="text-sm leading-6 text-indigo-200">{selected.description}</p>
          <div className="flex justify-center py-3" aria-hidden="true"><SpreadPreview spread={selected} /></div>
          <ol className="grid sm:grid-cols-2 gap-2 text-sm text-indigo-300">{selected.positions.map((position, index) => <li key={position.id}>{index + 1}. {position.name}</li>)}</ol>
        </section>
        <form className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5" onSubmit={event => {
          event.preventDefault();
          if (question.trim()) onStart(selected, question.trim());
        }}>
          <label className="block text-purple-100 font-bold">你想用这个牌阵问什么？
            <textarea className="local-input mt-3 resize-y font-normal" rows={4} maxLength={2000} required
              value={question} onChange={event => setQuestion(event.target.value)} placeholder="说说你的处境和最想弄清楚的事，喵会结合每个位置为你解读。" />
          </label>
          <div className="space-y-2"><p className="text-xs text-indigo-300">不知道怎么问？点选后可以修改，喵。</p>{spreadQuestions(selected.id).map(text => <button key={text} type="button" onClick={() => setQuestion(text)} className="block w-full text-left text-sm leading-6 text-purple-200 rounded-xl bg-purple-500/10 border border-purple-400/20 p-3 hover:bg-purple-500/20">{text}</button>)}</div>
          <p className="text-xs text-indigo-300">{style === 'sharp' ? '😼 犀利喵评' : '🌙 温柔指引'} · 接下来进入洗牌与抽牌</p>
          <Button type="submit" disabled={!question.trim()} className="w-full min-h-12">开始占卜 · 抽 {selected.cardCount} 张 →</Button>
        </form>
      </div> : <>
        <p role="status" className="text-xs text-indigo-400 mb-4">{category === 'all' ? '全部牌阵' : categoryLabels[category]} · {visible.length} 个可选 · 点击牌阵即可提问</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(spread => <button key={spread.id} type="button" onClick={() => choose(spread)}
            aria-label={`选择${spread.name}，${spread.cardCount}张牌`}
            className="text-left rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-3 hover:bg-purple-900/25 hover:border-purple-400/40 focus-visible:outline focus-visible:outline-purple-300 transition-colors">
            <div className="flex justify-between items-start gap-3"><h3 className="text-lg font-bold text-white">{spread.name}</h3><span className="text-xs text-purple-200 bg-purple-500/15 px-2 py-1 rounded-full shrink-0">{spread.cardCount} 张</span></div>
            <p className="text-xs text-indigo-400">{categoryLabels[spread.category]}</p>
            <div className="flex justify-center bg-black/15 rounded-xl py-3" aria-hidden="true"><SpreadPreview spread={spread} /></div>
            <p className="text-sm leading-6 text-indigo-200">{spread.description}</p>
            <span className="text-sm text-purple-200 mt-auto pt-2">用这个牌阵提问 →</span>
          </button>)}
        </div>
      </>}
    </div>
  </div>;
}
