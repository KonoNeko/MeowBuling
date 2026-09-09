import { questionGroups } from './question-presets';
import { browserClock, readingTime } from './reading-time';
import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { AppView, ReadingSession, ReadingStyle, Topic, TarotCard, SpreadDefinition } from './types';
import { TAROT_DECK, TOPICS, SPREADS, SPREAD_CATEGORY_LABELS, SPREAD_SUBCATEGORIES, getCardImage } from './constants';
import { Button, GlassCard, CardDisplay, Badge, LoadingSkeleton, Toast, SpreadLayout, SpreadPreview, CardDetailModal, Header, BottomNav, EnergyLoading } from './components';
import { generateInterpretation, saveReading, getHistory, updateReadingReflection } from './utils';
import LocalAssistant from './LocalAssistant';
import SpreadLibrary from './SpreadLibrary';

// Helper for random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

const App = () => {
  // --- State ---
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [readingStyle, setReadingStyle] = useState<ReadingStyle>(() => {
    try { return localStorage.getItem('meowbuling_reading_style_v2') === 'gentle' ? 'gentle' : 'sharp'; } catch { return 'sharp'; }
  });
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSpread, setSelectedSpread] = useState<SpreadDefinition | null>(null);
  const [question, setQuestion] = useState("");
  const [quickQuestion, setQuickQuestion] = useState('');
  const [recommendedSpreadIds, setRecommendedSpreadIds] = useState<string[]>([]);
  const [spreadFilter, setSpreadFilter] = useState('all');
  
  // Library Interaction State

  // Drawing State
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [drawnCards, setDrawnCards] = useState<TarotCard[]>([]);
  const [drawStep, setDrawStep] = useState<'init' | 'shuffling' | 'picking'>('init');
  
  // Card Inspection State
  const [inspectingCard, setInspectingCard] = useState<TarotCard | null>(null);
  
  // Ref for the scrollable card container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Drag to scroll refs (Legacy mouse scrolling)
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);
  const isDragging = useRef(false);

  // Reading & AI State
  const [readingResult, setReadingResult] = useState<ReadingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ReadingSession[]>([]);
  
  // UI Feedback
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [savingShareImage, setSavingShareImage] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const saveShareImage = async () => {
    if (!shareCardRef.current || savingShareImage) return;
    setSavingShareImage(true);
    try {
      await document.fonts.ready;
      await Promise.all(Array.from(shareCardRef.current.querySelectorAll('img')).map(image => image.complete ? image.decode().catch(() => undefined) : new Promise<void>(resolve => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
      })));
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        backgroundColor: '#100b2e',
        pixelRatio: 2,
        width: 750,
      });
      const link = document.createElement('a');
      link.download = `meowbuling-${readingResult?.id || 'reading'}.png`;
      link.href = dataUrl;
      link.click();
      triggerToast('长图已保存，可以分享给朋友了');
    } catch (error) {
      console.error('Failed to create share image', error);
      triggerToast('长图生成失败，请稍后重试');
    } finally {
      setSavingShareImage(false);
    }
  };

  // --- Effects ---

  // Enable Mouse Wheel horizontal scrolling for the deck
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el && view === AppView.DRAW && drawStep === 'picking') {
      const onWheel = (e: WheelEvent) => {
        // Only hijack if vertical scroll is dominant
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
           e.preventDefault();
           el.scrollLeft += e.deltaY;
        }
      };
      // Use non-passive listener to allow preventDefault
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }
  }, [view, drawStep]);

  // --- Actions ---

  // Navigation Logic
  const handleBack = () => {
    switch (view) {
      case AppView.TOPIC_SELECT:
      case AppView.HISTORY:
      case AppView.LIBRARY:
      case AppView.SPREAD_LIBRARY:
      case AppView.READING:
        setView(AppView.HOME);
        break;
      case AppView.QUESTION_SELECT:
        setView(AppView.TOPIC_SELECT);
        break;
      case AppView.SPREAD_SELECT:
        setView(AppView.QUESTION_SELECT);
        break;
      case AppView.DRAW:
        // If mid-drawing, maybe warn? For now just go back.
        setView(AppView.SPREAD_SELECT);
        break;
      default:
        setView(AppView.HOME);
    }
  };

  const handleStart = () => {
    setView(AppView.TOPIC_SELECT);
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setQuestion('');
    setRecommendedSpreadIds([]);
    setSpreadFilter('all');
    setView(AppView.QUESTION_SELECT);
  };

  const handleQuestionSelect = (q: string, tags?: string[]) => {
    setQuestion(q);
    setRecommendedSpreadIds(tags || []); // Set tags derived from the subcategory
    setSpreadFilter('all');
    setView(AppView.SPREAD_SELECT);
  }

  const handleCustomQuestionConfirm = () => {
    if (!selectedTopic) return;
    // Use default tags for the topic if available, otherwise empty (shows all)
    setRecommendedSpreadIds([]); 
    setSpreadFilter('all');
    setView(AppView.SPREAD_SELECT);
  };

  const handleSpreadSelect = (spread: SpreadDefinition) => {
    if (!question.trim()) return;
    setSelectedSpread(spread);
    if (!question.trim()) {
      setQuestion(`关于${selectedTopic?.label}的指引`);
    }
    setDrawStep('init'); 
    setDrawnCards([]);
    setView(AppView.DRAW);
  };

  // New: Handle starting directly from Library
  const handleDirectStartFromLibrary = (spread: SpreadDefinition, customQuestion: string) => {
      // 1. Try to find a matching topic based on spread category
      // Map categories to topic IDs manually for best match
      let topicId = 'fortune'; // Default fallback
      if (spread.category.includes('Love')) topicId = 'love';
      else if (spread.category.includes('Career')) topicId = 'career';
      else if (spread.category.includes('Decision')) topicId = 'decision';
      else if (spread.category.includes('Healing')) topicId = 'self';
      
      const topic = TOPICS.find(t => t.id === topicId) || TOPICS[4]; // Default to Fortune if fail

      // 2. Set State
      setSelectedTopic(topic);
      setSelectedSpread(spread);
      setQuestion(customQuestion);
      
      // 3. Reset Drawing State
      setDrawStep('init');
      setDrawnCards([]);
      
      // 4. Navigate
      setView(AppView.DRAW);
  };

  const startShuffle = () => {
    setDrawStep('shuffling');
    
    // 1. Prepare Deck
    const rawDeck = [...TAROT_DECK];
    
    // Simulate shuffle duration
    setTimeout(() => {
        // 2. Fisher-Yates Shuffle Logic
        for (let i = rawDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rawDeck[i], rawDeck[j]] = [rawDeck[j], rawDeck[i]];
        }
        
        // 3. Assign Reversals
        const shuffledWithReversals = rawDeck.map(card => ({
            ...card,
            isReversed: Math.random() > 0.7 
        }));

        setDeck(shuffledWithReversals);
        setDrawStep('picking');
    }, 2500); // 2.5 seconds of chaos
  };
  
  // Drag handlers for the scroll container (Container Scroll)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent interfering with DnD if the target is a card
    if ((e.target as HTMLElement).closest('.draggable-card')) return;
    
    isDown.current = true;
    isDragging.current = false;
    if (scrollContainerRef.current) {
      startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
      scrollLeftPos.current = scrollContainerRef.current.scrollLeft;
    }
  };

  const handleMouseLeave = () => {
    isDown.current = false;
  };

  const handleMouseUp = () => {
    isDown.current = false;
    setTimeout(() => {
        isDragging.current = false;
    }, 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current) return;
    e.preventDefault();
    if (scrollContainerRef.current) {
      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX.current) * 2;
      
      if (Math.abs(x - startX.current) > 5) {
          isDragging.current = true;
      }
      scrollContainerRef.current.scrollLeft = scrollLeftPos.current - walk;
    }
  };

  // --- CARD INTERACTION LOGIC ---

  const selectCard = (card: TarotCard, index?: number) => {
    if (!selectedSpread) return;
    
    // Check if spread is full
    if (drawnCards.length >= selectedSpread.cardCount) return;

    // Fill the next available slot
    // Construct new array with the card appended
    const newDrawn = [...drawnCards, card];
    setDrawnCards(newDrawn);

    // Remove from selectable deck
    const newDeck = deck.filter(c => c.id !== card.id);
    setDeck(newDeck);

    // If complete
    if (newDrawn.length === selectedSpread.cardCount) {
       setTimeout(() => {
         generateResult(newDrawn);
       }, 500);
    }
  };

  const handleCardClick = (card: TarotCard) => {
      // If user was dragging scrolling container, ignore click
      if (isDragging.current) return;
      selectCard(card);
  };

  // DnD: Handle Drop from Deck to Spread Slot
  const handleCardDrop = (cardId: number, slotIndex: number) => {
      if (!selectedSpread) return;
      
      const card = deck.find(c => c.id === cardId);
      if (!card) return;

      if (slotIndex === drawnCards.length) {
          selectCard(card);
      } else {
          triggerToast("请按顺序放置卡牌");
      }
  };

  // DnD: Drag Start on Deck Card
  const handleDragStart = (e: React.DragEvent, card: TarotCard) => {
      e.dataTransfer.setData("cardId", card.id.toString());
      e.dataTransfer.effectAllowed = "move";
      // Optional: Set a custom drag image
  };

  const generateResult = async (cards: TarotCard[], quick?: { topic: Topic; spread: SpreadDefinition; question: string }) => {
    const topic = quick?.topic || selectedTopic;
    const spread = quick?.spread || selectedSpread;
    if (!topic || !spread) return;
    
    setLoading(true);
    setReadingResult(null);
    setView(AppView.READING); // Move to reading view to show Skeleton

    const finalQuestion = (quick?.question ?? question).trim() || `关于${topic.label}的指引`;

    try {
      const interpretation = await generateInterpretation(
        topic.label,
        finalQuestion, 
        spread.id,
        cards,
        readingStyle
      );

      const newReading: ReadingSession = {
        id: generateId(),
        timestamp: Date.now(),
        topicId: topic.id,
        topicLabel: topic.label,
        spreadId: spread.id,
        spreadName: spread.name,
        question: finalQuestion,
        cards,
        interpretation,
        style: readingStyle
      };

      saveReading(newReading);
      setReadingResult(newReading);
      if (quick) setLoading(false);
      // NOTE: We do NOT set loading to false here. 
      // The EnergyLoading component handles the exit animation when readingResult is ready.
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "GPT 连接中断，请检查网络与模型额度后重试。");
      setView(AppView.HOME);
      setLoading(false); 
    }
  };

  const handleSaveJournal = (text: string) => {
    if (readingResult) {
      updateReadingReflection(readingResult.id, text);
      triggerToast("灵魂笔记已保存");
    }
  };

  // --- View Renderers ---

  const renderHome = () => (
    <div className="h-full overflow-y-auto custom-scrollbar px-4 pt-20 pb-28 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
        <header className="flex items-center gap-4 py-3">
          <div aria-hidden="true" className="relative shrink-0 w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-300/15 flex items-center justify-center text-4xl">🐱<span className="absolute -top-2 -right-1 text-xl">✨</span></div>
          <div><h1 className="text-3xl font-mystic text-purple-100 tracking-wider">喵卜灵</h1><p className="text-sm text-indigo-300 mt-1">塔罗牌不绕弯，喵卜灵帮你看清心里的事。</p></div>
        </header>
        <section aria-labelledby="home-methods" className="space-y-3">
          <div><h2 id="home-methods" className="text-xl font-bold text-white">今天，想让哪张塔罗牌替你说重点？</h2><p className="text-sm text-indigo-300 mt-1">选一张牌快速问；或选主题、挑牌阵，把问题拆开看。</p></div>
          <div className="grid md:grid-cols-2 gap-3">
            <form id="quick-question-form" className="rounded-2xl border border-purple-400/30 bg-gradient-to-br from-purple-900/30 to-indigo-900/20 p-5 flex flex-col gap-3" onSubmit={event => {
          event.preventDefault();
          if (!quickQuestion.trim() || loading) return;
          const spread = SPREADS.find(item => item.id === 'daily_1')!;
          const topic = TOPICS.find(item => item.id === 'fortune')!;
          const random = crypto.getRandomValues(new Uint32Array(2));
          const cards = [{ ...TAROT_DECK[random[0] % TAROT_DECK.length], isReversed: random[1] % 2 === 1 }];
          setSelectedTopic(topic); setSelectedSpread(spread); setQuestion(quickQuestion.trim()); setDrawnCards(cards);
          void generateResult(cards, { topic, spread, question: quickQuestion.trim() });
        }}>
              <div className="flex items-center justify-between gap-2"><h3 className="text-lg font-bold text-purple-100">🔮 快速塔罗单抽</h3><span className="text-xs rounded-full bg-purple-400/15 text-purple-200 px-2 py-1 shrink-0">1 张牌</span></div>
              <p className="text-sm leading-6 text-indigo-200">把问题丢给喵卜灵，抽一张牌，直接看重点。</p>
              <label className="block"><span className="sr-only">快速单抽的问题</span><textarea className="local-input resize-y" rows={2} maxLength={2000} required value={quickQuestion} onChange={event => setQuickQuestion(event.target.value)} placeholder="例如：面对现在的工作，我最需要注意什么？" /></label>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-auto"><span className="text-xs text-purple-300">{readingStyle === 'sharp' ? '😼 犀利喵评' : '🌙 温柔指引'}</span><Button className="min-h-11" disabled={loading || !quickQuestion.trim()} type="submit">开始抽牌 →</Button></div>
            </form>
            <article className="rounded-2xl border border-indigo-300/20 bg-indigo-900/15 p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2"><h3 className="text-lg font-bold text-indigo-100">🎴 选主题与牌阵</h3><span className="text-xs rounded-full bg-indigo-400/15 text-indigo-200 px-2 py-1 shrink-0">分类牌阵</span></div>
              <p className="text-sm leading-6 text-indigo-200">感情、事业、选择……先选主题，再选问题和牌阵，问得更准。</p>
              <p className="text-xs text-indigo-400">选主题 → 选问题 → 选牌阵</p>
              <Button variant="secondary" className="w-full mt-auto min-h-11" onClick={handleStart}>开始选牌阵 →</Button>
            </article>
          </div>
        </section>
        <fieldset className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <legend className="px-2 text-sm text-indigo-300">喵卜灵的说话方式 · 两种玩法都适用</legend>
          <div className="grid grid-cols-2 gap-2">
            {([{ value: 'sharp', title: '😼 犀利喵评', description: '直说重点，不绕弯' }, { value: 'gentle', title: '🌙 温柔指引', description: '委婉提醒，慢慢聊' }] as const).map(option => <label key={option.value} className={`cursor-pointer rounded-xl border px-3 py-3 ${readingStyle === option.value ? 'border-purple-400 bg-purple-800/30' : 'border-transparent hover:bg-white/5'}`}>
              <span className="flex items-center gap-2 text-sm font-bold text-purple-100"><input type="radio" name="reading-style" value={option.value} checked={readingStyle === option.value} onChange={() => { setReadingStyle(option.value); try { localStorage.setItem('meowbuling_reading_style_v2', option.value); } catch { triggerToast('本次已切换，偏好暂时无法保存'); } }} className="accent-purple-400" />{option.title}</span>
              <span className="block mt-1 text-xs text-indigo-300">{option.description}</span>
            </label>)}
          </div>
        </fieldset>
        <button type="button" className="w-full min-h-11 text-sm text-indigo-300 hover:text-white" onClick={() => { setHistory(getHistory()); setView(AppView.HISTORY); }}>📜 回看我的解读 →</button>
      </div>
    </div>
  );

  const renderTopicSelect = () => (
    <div className="max-w-4xl mx-auto h-full flex flex-col justify-start p-6 space-y-8 animate-fade-in overflow-y-auto custom-scrollbar pt-24 pb-32">
      <div className="text-center space-y-2 shrink-0">
        <h2 className="text-3xl font-mystic text-white">你想探索哪个领域？</h2>
        <p className="text-indigo-300">倾听内心的声音，选择此刻最强烈的感召</p>
      </div>
      
      {/* Updated to 3 columns grid to accommodate more topics (5 topics total now) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOPICS.map(topic => (
          <GlassCard 
            key={topic.id} 
            onClick={() => handleTopicSelect(topic)}
            className="flex items-center gap-4 hover:bg-purple-900/30 transition-all group cursor-pointer"
          >
            <span className="text-4xl group-hover:scale-110 transition-transform">{topic.icon}</span>
            <div className="text-left">
              <h3 className="text-xl font-bold text-white group-hover:text-purple-200">{topic.label}</h3>
              <p className="text-sm text-indigo-300/70">{topic.description}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );

  const renderQuestionSelect = () => (
    <div className="max-w-4xl mx-auto h-full flex flex-col justify-start pt-24 p-6 space-y-6 animate-fade-in overflow-y-auto custom-scrollbar pb-32">
      <div className="text-center space-y-2">
         <Badge className="mb-2 text-lg px-4 py-1">{selectedTopic?.icon} {selectedTopic?.label}</Badge>
        <h2 className="text-3xl font-mystic text-white">你想问关于什么的具体问题？</h2>
        <p className="text-indigo-300">点一个问题，喵帮你匹配牌阵；也可以自己填写</p>
      </div>

      {selectedTopic?.id === 'fortune' && <p className="text-xs text-center text-indigo-300">按设备日期：{readingTime(browserClock()).today} · {readingTime(browserClock()).timeZone}（无法获取时使用中国时区）</p>}
      <div className="grid gap-6">
        {questionGroups(selectedTopic?.id || '').map((cat, idx) => (
          <div key={idx} className="space-y-3">
             <h3 className="text-purple-200 font-bold ml-2 text-sm uppercase tracking-widest opacity-80">{cat.title}</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cat.questions.map((q, qIdx) => (
                   <button 
                     key={qIdx}
                     onClick={() => handleQuestionSelect(q.text, q.spreadIds)}
                     className="bg-white/5 hover:bg-purple-600/30 border border-white/10 text-indigo-100 text-left px-5 py-4 rounded-xl transition-all hover:scale-[1.01] hover:shadow-lg text-sm md:text-base flex justify-between items-center group"
                   >
                     <span className="space-y-2"><span className="block">{q.text}</span><span className="block text-xs text-purple-300">{q.spreadIds.map(id => { const spread = SPREADS.find(s => s.id === id); return `${spread?.name} · ${spread?.cardCount} 张`; }).join(' / ')} →</span></span>
                     <span className="opacity-0 group-hover:opacity-100 transition-opacity">✨</span>
                   </button>
                ))}
             </div>
          </div>
        ))}
        
        {/* Custom Input Option */}
        <div className="mt-4 border-t border-white/10 pt-6">
           <h3 className="text-purple-200 font-bold ml-2 text-sm uppercase tracking-widest opacity-80 mb-3">或：自定义问题</h3>
           <div className="flex flex-col md:flex-row gap-3">
             <input 
                type="text" 
                placeholder="在此写下你独特的疑问..."
                className="flex-1 bg-black/30 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400"
                onChange={(e) => setQuestion(e.target.value)}
                value={question}
             />
             <Button onClick={handleCustomQuestionConfirm} disabled={!question.trim()} className="md:w-auto w-full">
               确认
             </Button>
           </div>
        </div>
      </div>
    </div>
  );

  const renderSpreadSelect = () => {
    // 1. Broad Category Filter
    let filteredSpreads = selectedTopic 
        ? SPREADS.filter(spread => selectedTopic.spreadCategories.includes(spread.category))
        : SPREADS;

    if (recommendedSpreadIds.length) {
      filteredSpreads = recommendedSpreadIds.flatMap(id => SPREADS.find(spread => spread.id === id) || []);
    } else if (spreadFilter !== 'all') {
      const subcategory = (SPREAD_SUBCATEGORIES[selectedTopic?.id || ''] || []).find(item => item.id === spreadFilter);
      if (subcategory?.tags.length) {
        filteredSpreads = filteredSpreads.filter(spread => spread.tags.some(tag => subcategory.tags.includes(tag)));
      }
    }
    const subcategories = SPREAD_SUBCATEGORIES[selectedTopic?.id || ''] || [];

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col justify-start p-6 space-y-8 animate-fade-in overflow-y-auto custom-scrollbar pt-20 pb-40">
          <div className="text-center space-y-2 shrink-0">
            <h2 className="text-3xl font-mystic text-white">选择你的牌阵</h2>
            <p className="text-indigo-300">{recommendedSpreadIds.length ? '喵根据这个问题，为你匹配了以下牌阵' : '选择适合你问题的观察角度'}</p>
          </div>

          {!recommendedSpreadIds.length && subcategories.length > 0 && (
            <nav aria-label="牌阵细分类别" className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 shrink-0 snap-x">
              {subcategories.map(subcategory => (
                <button
                  key={subcategory.id}
                  type="button"
                  aria-pressed={spreadFilter === subcategory.id || (spreadFilter === 'all' && subcategory.tags.length === 0)}
                  onClick={() => setSpreadFilter(subcategory.id)}
                  className={`min-h-10 shrink-0 snap-start rounded-full px-4 text-xs sm:text-sm transition-colors focus-visible:outline focus-visible:outline-purple-300 ${spreadFilter === subcategory.id || (spreadFilter === 'all' && subcategory.tags.length === 0) ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-white/5 text-indigo-200 hover:bg-white/10'}`}
                >
                  {subcategory.label}
                </button>
              ))}
            </nav>
          )}
          
          {/* Show Selected Question */}
          <div className="w-full max-w-2xl mx-auto bg-purple-900/20 border border-purple-500/30 rounded-xl p-6 text-center backdrop-blur-sm shrink-0">
             <p className="text-xs text-purple-300 uppercase tracking-widest mb-2">当前提问</p>
             <textarea aria-label="当前提问，可修改" className="local-input text-base leading-7 resize-y" rows={3} maxLength={2000} value={question} onChange={event => setQuestion(event.target.value)} />
             <p className="text-xs text-indigo-300 mt-2">可以补充你的处境；选择题请把 A / B / C 改成具体选项，再点击下方牌阵。</p>
             <button 
               onClick={() => setView(AppView.QUESTION_SELECT)}
               className="text-xs text-indigo-400 hover:text-white mt-3 underline decoration-indigo-500/50 hover:decoration-white"
             >
               修改问题
             </button>
             {recommendedSpreadIds.length > 0 && (
               <button
                 type="button"
                 onClick={() => { setRecommendedSpreadIds([]); setSpreadFilter('all'); }}
                 className="block mx-auto text-xs text-purple-300 hover:text-white mt-2 underline decoration-purple-500/50 hover:decoration-white"
               >
                 浏览全部分类牌阵
               </button>
             )}
          </div>
    
          {/* Spread Grid */}
          <p role="status" className="text-xs text-indigo-400 -mb-4">{filteredSpreads.length ? `找到 ${filteredSpreads.length} 个适合这个方向的牌阵` : '这个分类暂时没有匹配牌阵，换个分类试试。'}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {filteredSpreads.map(spread => (
              <GlassCard 
                key={spread.id} 
                onClick={() => handleSpreadSelect(spread)}
                className="flex flex-col items-center justify-between text-center gap-4 hover:bg-purple-900/30 border-purple-500/20 group cursor-pointer transition-all hover:scale-[1.02]"
              >
                <div className="w-full flex-1">
                  <div className="flex justify-between items-center mb-2">
                     <Badge className="text-[10px]">{SPREAD_CATEGORY_LABELS[spread.category] || spread.category}</Badge>
                     <span className="text-xs text-purple-400 font-mono">{spread.cardCount} Cards</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-200">{spread.name}</h3>
                  <p className="text-xs text-indigo-300/70 leading-relaxed min-h-[40px]">{spread.description}</p>
                </div>
                {/* Visual representation of spread layout geometry */}
                <div className="mt-2 opacity-80 group-hover:opacity-100 transition-opacity transform group-hover:scale-105 duration-300">
                    <SpreadPreview spread={spread} />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      );
  } 

  // --- DRAWING VIEW LOGIC ---
  const renderDraw = () => {
    // 1. Initial State: The Deck on Table
    if (drawStep === 'init') {
      return (
        <div className="h-full flex flex-col items-center justify-center space-y-8 animate-fade-in p-6 pt-20 pb-32">
           <div className="relative w-48 h-72 cursor-pointer group" onClick={startShuffle}>
              {/* Stack effect */}
              <div className="absolute top-0 left-0 w-full h-full bg-indigo-900 rounded-xl border border-indigo-700 transform translate-x-4 translate-y-4 group-hover:translate-x-6 group-hover:translate-y-6 transition-transform"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-indigo-800 rounded-xl border border-indigo-600 transform translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
              {/* Main Deck */}
              <div className="absolute top-0 left-0 w-full h-full bg-indigo-950 rounded-xl border-2 border-purple-500 flex items-center justify-center shadow-2xl group-hover:-translate-y-2 transition-transform">
                  <div className="w-full h-full opacity-40 stardust"></div>
                  <span className="absolute text-5xl filter drop-shadow-glow">🔮</span>
              </div>
           </div>
           
           <div className="text-center space-y-2">
             <h2 className="text-3xl font-mystic text-white">准备好连接宇宙了吗？</h2>
             <p className="text-indigo-300">点击牌堆，开始洗牌并注入你的能量</p>
           </div>
           
           <Button onClick={startShuffle} className="px-12 py-4 text-xl shadow-purple-500/50 animate-pulse">
             开始洗牌
           </Button>
        </div>
      )
    }

    // 2. Shuffling Animation State (Improved)
    if (drawStep === 'shuffling') {
        return (
            <div className="h-full flex flex-col items-center justify-center relative overflow-hidden bg-black/40 backdrop-blur-sm z-50">
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Orbiting Chaos Particles */}
                    {Array.from({length: 12}).map((_, i) => {
                        // Create random orbit ranges for more chaotic look
                        const tx = (Math.random() - 0.5) * 500 + 'px';
                        const ty = (Math.random() - 0.5) * 500 + 'px';
                        return (
                           <div 
                              key={i}
                              className="absolute w-24 h-40 bg-gradient-to-br from-indigo-950 to-purple-900 rounded-lg border border-purple-400/30 animate-shuffle-orbit shadow-2xl"
                              style={{
                                  '--tx': tx,
                                  '--ty': ty,
                                  animationDelay: `${i * 0.15}s`,
                                  left: 'calc(50% - 3rem)',
                                  top: 'calc(50% - 5rem)',
                              } as React.CSSProperties}
                           >
                               <div className="w-full h-full opacity-50 stardust"></div>
                           </div>
                        )
                    })}
                    <div className="absolute z-50 text-center pointer-events-none">
                        <h2 className="text-5xl font-mystic text-white animate-pulse mb-4 tracking-widest drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">洗牌中</h2>
                        <p className="text-indigo-200 text-lg">请集中精神，默念你的问题</p>
                        <p className="text-xl text-purple-300 font-serif italic mt-6 opacity-80">"{question}"</p>
                    </div>
                </div>
            </div>
        )
    }

    // 3. Picking State (Refined Layout for Mobile)
    return (
      <div className="h-full flex flex-col items-center justify-between animate-fade-in relative overflow-hidden">
        
        {/* Top Area: Spread */}
        {/* Use pt-16 to clear fixed Header */}
        <div className="w-full flex-1 flex flex-col items-center pt-16 overflow-hidden relative z-0">
            
            {/* Title - Compact */}
            <div className="text-center py-2 pointer-events-auto shrink-0 z-20">
                <h2 className="text-lg font-mystic text-purple-200 flex items-center justify-center gap-2">
                    {selectedSpread?.name} 
                    <Badge className="text-sm px-2">{drawnCards.length} / {selectedSpread?.cardCount}</Badge>
                </h2>
                <p className="text-indigo-400 text-[10px] opacity-80">
                    {drawnCards.length === selectedSpread?.cardCount ? "正在揭示..." : "拖拽卡牌到上方槽位"}
                </p>
            </div>

            {selectedSpread && (
                <div className="w-full flex-1 min-h-0 overflow-y-auto scrollbar-hide p-2 pb-4">
                     {/* Scale down slightly on mobile to ensure fit */}
                     <div className="w-full max-w-2xl mx-auto">
                         <SpreadLayout 
                            spread={selectedSpread} 
                            drawnCards={drawnCards} 
                            onDrop={handleCardDrop}
                            isRevealed={false} 
                         />
                     </div>
                </div>
            )}
        </div>

        {/* Bottom Area: Deck */}
        {/* Increased height (h-72) and changed alignment to items-end to prevent clipping at top */}
        {drawnCards.length < (selectedSpread?.cardCount || 0) && (
            // Changed z-20 to z-50 to ensure it sits above the spread area if they overlap
            <div className="w-full h-72 md:h-80 flex items-end relative z-50 shrink-0 bg-gradient-to-t from-[#0f0c29] via-[#0f0c29] to-transparent pb-32 pointer-events-none">
                 {/* Inner container with pointer-events-auto */}
                 <div 
                    ref={scrollContainerRef}
                    className="w-full h-full flex items-end overflow-x-auto px-[50vw] pb-4 pt-16 scrollbar-hide perspective-1000 cursor-grab active:cursor-grabbing relative z-10 pointer-events-auto"
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                >
                    <div className="flex items-end" style={{ width: 'max-content' }}>
                        {deck.map((card, idx) => (
                            <div 
                                key={card.id}
                                className="draggable-card relative w-20 h-36 md:w-28 md:h-48 -ml-12 md:-ml-16 cursor-pointer transition-all duration-300 hover:-translate-y-10 hover:scale-110 hover:z-50 group hover:mx-2 select-none"
                                onClick={() => handleCardClick(card)}
                                draggable={true} 
                                onDragStart={(e) => handleDragStart(e, card)}
                                style={{
                                    transformOrigin: 'bottom center',
                                }}
                            >
                                <div className="w-full h-full bg-indigo-950 rounded-lg border border-purple-600/30 shadow-xl overflow-hidden relative transform transition-transform group-hover:rotate-0">
                                    <div className="w-full h-full opacity-50 stardust"></div>
                                    <div className="absolute inset-1 border border-dashed border-white/10 rounded"></div>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Instruction Overlay */}
                <div className="absolute bottom-20 left-0 w-full text-center pointer-events-none text-white/30 text-[10px] animate-pulse z-30">
                    ← 滑动选牌 • 拖拽上方 →
                </div>
            </div>
        )}
      </div>
    );
  };

  const renderReading = () => {
    // 1. Loading State (Interactive)
    if (loading) {
        return (
            <EnergyLoading 
                isReady={!!readingResult} 
                onComplete={() => setLoading(false)} 
            />
        );
    }

    if (!readingResult || !readingResult.interpretation) return null;
    const { interpretation } = readingResult;
    const resultSpread = SPREADS.find(spread => spread.id === readingResult.spreadId);

    // 2. Result State
    return (
      <div className="h-full overflow-y-auto pb-40 p-4 pt-20 custom-scrollbar">

        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
          
          {/* Header Area */}
          <div className="text-center py-6 border-b border-white/5">
            <Badge className="mb-4">{readingResult.topicLabel} • {readingResult.spreadName}</Badge>
            <h1 className="text-3xl md:text-4xl font-mystic text-transparent bg-clip-text bg-gradient-to-r from-purple-100 to-pink-100 mb-2">
              {interpretation.mainTheme}
            </h1>
            <p className="text-indigo-300 italic">“ {readingResult.question} ”</p>
            <p className="text-xs text-purple-300 mt-3">{readingResult.style === 'sharp' ? '😼 犀利喵评 · 猫爪划重点' : '🌙 温柔指引 · 星光轻声说'}</p>
            <Button variant="secondary" className="mt-5 mx-auto text-sm px-5 py-2.5" onClick={() => void saveShareImage()} disabled={savingShareImage}>
              {savingShareImage ? '正在生成长图…' : '保存结果长图'}
            </Button>
          </div>

          {interpretation.outcome && <GlassCard className="border-purple-400/30 bg-gradient-to-br from-purple-950/70 to-indigo-950/60 space-y-3 shadow-lg shadow-purple-950/20"><p className="text-xs tracking-[0.2em] text-purple-300 uppercase">先看结论</p><h2 className="text-xl text-purple-100 font-bold">{readingResult.style === 'sharp' ? '😼 喵的直球结论' : '🌙 星光里的可能走向'}</h2><p className="text-indigo-100 leading-7 whitespace-pre-line">{interpretation.outcome}</p></GlassCard>}

          {/* The Spread Display (Using the Layout Engine now!) */}
          <div className="w-full overflow-x-auto py-8 flex justify-center">
             {resultSpread && (
                <div className="w-full max-w-2xl">
                    <SpreadLayout 
                        spread={resultSpread}
                        drawnCards={readingResult.cards} 
                        // No onDrop here, read-only mode
                        isRevealed={true} // Force reveal in result view
                        onCardClick={(card: TarotCard) => setInspectingCard(card)}
                    />
                    <div className="text-center mt-4">
                        <span className="text-xs text-indigo-400 bg-white/5 px-3 py-1 rounded-full animate-pulse">👆 点击卡牌查看详情与科普</span>
                    </div>
                </div>
             )}
          </div>

          <section className="space-y-4" aria-label="逐张牌阵解读">
            <h2 className="text-2xl font-mystic text-purple-100">🐾 一张一张，听喵说牌</h2>
            {readingResult.cards.map((card, index) => {
              const detail = interpretation.cardReadings?.find(entry => entry.positionIndex === index && entry.cardId === card.id);
              const position = resultSpread?.positions[index];
              return <GlassCard key={`${index}-${card.id}`} className="flex flex-col sm:flex-row gap-5">
                <div className="shrink-0 self-center sm:self-start"><CardDisplay card={card} revealed size="sm" onClick={() => setInspectingCard(card)} /></div>
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="text-xs tracking-wide text-purple-300">第 {index + 1} 张 · {position?.name || '牌阵位置'}</p>
                  <h3 className="text-xl font-bold text-white">{card.name_cn} <span className="text-sm text-indigo-300">{card.isReversed ? '逆位' : '正位'}</span></h3>
                  <p className="text-xs leading-5 text-indigo-400">这个位置看什么：{position?.description || '结合当前问题观察牌意'}</p>
                  {detail ? <>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs ${detail.assessment === '有利' ? 'bg-emerald-400/10 text-emerald-200' : detail.assessment === '不利' ? 'bg-rose-400/10 text-rose-200' : 'bg-amber-400/10 text-amber-200'}`}>{detail.assessment}</span>
                    <p className="text-indigo-100 leading-7 whitespace-pre-line">{detail.interpretation}</p>
                    <p className="rounded-xl bg-purple-500/10 p-3 text-sm text-purple-200 leading-6">🐱 喵的建议：{detail.advice}</p>
                  </> : <p className="text-sm text-indigo-300 leading-6">这份旧记录没有逐张解读。牌意参考：{card.isReversed ? card.meaningReversed : card.meaningUpright}</p>}
                </div>
              </GlassCard>;
            })}
          </section>

          {/* AI Interpretation Sections */}
          <div className="grid gap-6">
            {interpretation.detailedAnalysis.map((section, idx) => (
              <GlassCard key={idx} className="space-y-3 border-l-4 border-l-purple-500/50">
                <h3 className="text-xl font-bold text-purple-200">{section.title}</h3>
                <p className="text-indigo-100/90 leading-relaxed whitespace-pre-line">
                    {section.content}
                </p>
              </GlassCard>
            ))}
          </div>

          {/* Advice Section */}
          <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 rounded-2xl p-6 border border-white/10 shadow-xl">
             <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🐾</span>
                <h3 className="text-xl font-bold text-white">猫咪先知的行动指引</h3>
             </div>
             <p className="text-lg text-white/90 font-medium whitespace-pre-line">
                {interpretation.advice}
             </p>
          </div>

          {/* The practical answer comes before reflective and conversational extras. */}
          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-2xl p-8 border border-white/10 relative overflow-hidden group hover:bg-white/5 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-20 text-6xl rotate-12 pointer-events-none">📖</div>
              <h3 className="text-xl font-bold text-purple-200 mb-4 flex items-center gap-2">
                  <span>📜</span> 命运寓言
              </h3>
              <p className="text-lg text-indigo-100 italic font-serif leading-relaxed opacity-90">
                  "{interpretation.fable}"
              </p>
          </div>

          <LocalAssistant reading={readingResult} />

          <div ref={shareCardRef} aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 0, width: 750, zIndex: 1, background: '#100b2e', color: '#f5f3ff', padding: '56px 48px', fontFamily: 'Arial, "Microsoft YaHei", sans-serif' }}>
            <div style={{ borderBottom: '1px solid #4c3575', paddingBottom: 28, marginBottom: 28 }}>
              <div style={{ color: '#c4b5fd', fontSize: 18, letterSpacing: 2 }}>MEOWBULING · 喵卜灵</div>
              <div style={{ color: '#f5d0fe', fontSize: 30, fontWeight: 700, marginTop: 18 }}>{readingResult.topicLabel} · {readingResult.spreadName}</div>
              <div style={{ color: '#c4b5fd', fontSize: 20, lineHeight: 1.6, marginTop: 12 }}>“{readingResult.question}”</div>
            </div>
            <div style={{ background: '#25164b', border: '1px solid #7955ad', borderRadius: 20, padding: 26, marginBottom: 30 }}>
              <div style={{ color: '#c4b5fd', fontSize: 16, letterSpacing: 3 }}>先看结论</div>
              <div style={{ color: '#fff', fontSize: 27, fontWeight: 700, margin: '12px 0' }}>{interpretation.mainTheme}</div>
              <div style={{ color: '#ede9fe', fontSize: 20, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{interpretation.outcome}</div>
            </div>
            <div style={{ color: '#e9d5ff', fontSize: 24, fontWeight: 700, marginBottom: 18 }}>牌面解读</div>
            {readingResult.cards.map((card, index) => {
              const detail = interpretation.cardReadings?.find(entry => entry.positionIndex === index && entry.cardId === card.id);
              const position = resultSpread?.positions[index];
              return <div key={`${index}-${card.id}`} style={{ display: 'flex', gap: 20, borderTop: '1px solid #38265b', padding: '24px 0' }}>
                <img src={getCardImage(card.id)} alt="" style={{ width: 108, height: 184, objectFit: 'cover', borderRadius: 10, transform: card.isReversed ? 'rotate(180deg)' : undefined }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#c4b5fd', fontSize: 15 }}>第 {index + 1} 张 · {position?.name || '牌阵位置'}</div>
                  <div style={{ color: '#fff', fontSize: 23, fontWeight: 700, margin: '8px 0' }}>{card.name_cn} · {card.isReversed ? '逆位' : '正位'}</div>
                  <div style={{ color: '#e0d7f5', fontSize: 17, lineHeight: 1.7 }}>{detail?.interpretation || (card.isReversed ? card.meaningReversed : card.meaningUpright)}</div>
                  {detail?.advice && <div style={{ color: '#e9d5ff', fontSize: 16, lineHeight: 1.6, marginTop: 10 }}>喵的建议：{detail.advice}</div>}
                </div>
              </div>;
            })}
            <div style={{ color: '#e9d5ff', fontSize: 24, fontWeight: 700, margin: '26px 0 14px' }}>行动指引</div>
            <div style={{ background: '#211844', borderRadius: 16, padding: 24, color: '#f5f3ff', fontSize: 20, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{interpretation.advice}</div>
            <div style={{ color: '#8b78aa', fontSize: 15, textAlign: 'center', marginTop: 42 }}>塔罗是自我反思工具 · 喵卜灵</div>
          </div>

          {/* Journal Section */}
          <div className="pt-8">
            <h3 className="text-indigo-300 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                <span>✨</span> 灵魂笔记
            </h3>
            <div className="bg-black/20 rounded-xl p-6 border border-white/5 space-y-4">
                <div className="space-y-2">
                    <p className="text-sm text-purple-300 font-medium">反思指引：</p>
                    <ul className="list-disc list-inside text-sm text-indigo-300/80 space-y-1">
                        {interpretation.reflectionQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                </div>
                <textarea 
                    className="w-full h-32 bg-black/30 rounded-lg p-4 text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 border border-white/10 placeholder-white/20 transition-all"
                    placeholder="此刻，你的内心有什么感觉？写下来..."
                    defaultValue={readingResult.userReflection || ""}
                    onBlur={(e) => handleSaveJournal(e.target.value)}
                />
                <div className="flex justify-between items-center text-xs text-indigo-500">
                    <span>写完后点击外部即可自动保存</span>
                </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-center gap-4 pt-8 pb-12">
            <Button variant="ghost" onClick={() => setView(AppView.HOME)}>返回首页</Button>
            <Button onClick={() => {
                setView(AppView.TOPIC_SELECT);
                setReadingResult(null);
            }}>再次占卜</Button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="h-full overflow-y-auto p-6 pt-24 custom-scrollbar animate-fade-in pb-32">
        <div className="max-w-4xl mx-auto relative">
            {/* Scroll Header Container */}
            <div className="sticky top-0 z-30 py-4 -mx-6 px-6 bg-gradient-to-b from-[#0f0c29] via-[#0f0c29]/90 to-transparent flex justify-center">
                <div className="relative transform hover:scale-105 transition-transform duration-300">
                    {/* The Scroll Graphic */}
                    {/* Left Roll Handle */}
                    <div className="absolute top-1/2 -left-6 w-8 h-[130%] -translate-y-1/2 bg-gradient-to-r from-[#5b21b6] via-[#7c3aed] to-[#4c1d95] rounded-full border-2 border-[#fbbf24] shadow-lg z-20 flex items-center justify-center">
                        <div className="w-4 h-4 bg-[#fbbf24] rounded-full shadow-inner opacity-80"></div>
                    </div>
                    
                    {/* Scroll Body */}
                    <div className="relative bg-[#2e1065] px-12 py-3 border-y-2 border-[#fbbf24] shadow-[0_0_20px_rgba(124,58,237,0.5)] z-10 flex items-center justify-center min-w-[240px]">
                        <h2 className="text-3xl font-mystic text-[#fef3c7] tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            时光卷轴
                        </h2>
                        {/* Texture */}
                         <div className="absolute inset-0 opacity-30 stardust mix-blend-overlay"></div>
                    </div>

                    {/* Right Roll Handle */}
                    <div className="absolute top-1/2 -right-6 w-8 h-[130%] -translate-y-1/2 bg-gradient-to-l from-[#5b21b6] via-[#7c3aed] to-[#4c1d95] rounded-full border-2 border-[#fbbf24] shadow-lg z-20 flex items-center justify-center">
                        <div className="w-4 h-4 bg-[#fbbf24] rounded-full shadow-inner opacity-80"></div>
                    </div>
                </div>
            </div>

        {history.length === 0 ? (
          <div className="text-center py-32 space-y-4 opacity-50">
            <div className="text-6xl grayscale">🕸️</div>
            <p className="text-indigo-300">过去像一张白纸，等待你去书写。</p>
          </div>
        ) : (
          <div className="grid gap-6 mt-4">
            {history.map(reading => (
              <GlassCard key={reading.id} className="group hover:bg-white/10 transition-colors cursor-default">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-purple-400 font-mono mb-1">
                      <span>{new Date(reading.timestamp).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{new Date(reading.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                        {reading.question}
                    </h3>
                  </div>
                  <Badge>{TOPICS.find(t => t.id === reading.topicId)?.icon} {reading.topicLabel}</Badge>
                </div>
                
                {/* Mini Card Preview */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 opacity-80">
                  {reading.cards.map((c, i) => (
                    <div 
                        key={i} 
                        className="shrink-0 text-xs bg-black/40 px-3 py-2 rounded border border-white/5 text-indigo-200 cursor-pointer hover:bg-white/20 hover:border-white/20 transition-all"
                        onClick={() => setInspectingCard(c)}
                    >
                      <span className="mr-1">{c.isReversed ? '🔃' : '⬆️'}</span>
                      {c.name_cn}
                    </div>
                  ))}
                </div>

                {reading.interpretation && (
                  <div className="space-y-2">
                    <p className="text-sm text-indigo-200/80 line-clamp-2 pl-3 border-l-2 border-purple-500/30">
                      {reading.interpretation.mainTheme}
                    </p>
                    {reading.interpretation.fable && (
                        <p className="text-xs text-indigo-400 italic line-clamp-1">
                            寓言: {reading.interpretation.fable}
                        </p>
                    )}
                  </div>
                )}
                
                {reading.userReflection && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-indigo-400 uppercase mb-1">你的记录</p>
                    <p className="text-sm text-white/70 italic font-serif">"{reading.userReflection}"</p>
                  </div>
                )}
                {reading.interpretation && <Button variant="ghost" className="mt-4" onClick={() => { setReadingResult(reading); setLoading(false); setView(AppView.READING); }}>查看完整解读 · {reading.style === 'sharp' ? '犀利喵评' : '温柔指引'}</Button>}
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderLibrary = () => {
      // Group cards by suit/arcana
      const major = TAROT_DECK.filter(c => c.id < 22);
      const wands = TAROT_DECK.filter(c => c.id >= 22 && c.id < 36);
      const cups = TAROT_DECK.filter(c => c.id >= 36 && c.id < 50);
      const swords = TAROT_DECK.filter(c => c.id >= 50 && c.id < 64);
      const pentacles = TAROT_DECK.filter(c => c.id >= 64);

      const renderSection = (title: string, cards: TarotCard[]) => (
          <div className="mb-8">
              <h3 className="text-xl font-mystic text-purple-200 mb-4 pl-4 border-l-4 border-purple-500">{title}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4 px-2">
                  {cards.map(card => (
                      <div key={card.id} className="flex justify-center">
                         <CardDisplay 
                            card={card} 
                            revealed={true} 
                            size="library"
                            preview
                            label={card.name_cn}
                            onClick={() => setInspectingCard(card)}
                         />
                      </div>
                  ))}
              </div>
          </div>
      );

      return (
        <div className="h-full overflow-y-auto p-6 pt-20 custom-scrollbar animate-fade-in pb-32">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10 space-y-2">
                    <h2 className="text-3xl font-mystic text-white">塔罗牌库</h2>
                    <p className="text-indigo-300">78张智慧图腾的完整收录</p>
                </div>

                {renderSection("大阿卡纳 (Major Arcana)", major)}
                {renderSection("权杖 (Wands)", wands)}
                {renderSection("圣杯 (Cups)", cups)}
                {renderSection("宝剑 (Swords)", swords)}
                {renderSection("星币 (Pentacles)", pentacles)}
            </div>
        </div>
      );
  }


  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0f0c29]">
      {/* Toast Notification */}
      <Toast message={toastMessage} show={showToast} />
      
      {/* Card Detail Modal */}
      <CardDetailModal card={inspectingCard} onClose={() => setInspectingCard(null)} />

      {/* Header (Simplified) */}
      <Header 
        onBack={handleBack}
        title={view === AppView.HOME ? "" : (selectedTopic?.label || "喵卜灵")}
        showBack={view !== AppView.HOME && view !== AppView.HISTORY && view !== AppView.LIBRARY && view !== AppView.SPREAD_LIBRARY}
      />

      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/30 rounded-full mix-blend-screen filter blur-[120px] animate-float"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/30 rounded-full mix-blend-screen filter blur-[120px] animate-float" style={{animationDelay: '3s'}}></div>
         <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-pink-900/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse-glow"></div>
      </div>

      <div className="relative z-10 w-full h-full">
        {view === AppView.HOME && renderHome()}
        {view === AppView.TOPIC_SELECT && renderTopicSelect()}
        {view === AppView.QUESTION_SELECT && renderQuestionSelect()}
        {view === AppView.SPREAD_SELECT && renderSpreadSelect()}
        {view === AppView.DRAW && renderDraw()}
        {view === AppView.READING && renderReading()}
        {view === AppView.HISTORY && renderHistory()}
        {view === AppView.LIBRARY && renderLibrary()}
        {view === AppView.SPREAD_LIBRARY && <SpreadLibrary style={readingStyle} onStart={handleDirectStartFromLibrary} />}
      </div>

      {/* Bottom Navigation */}
      <BottomNav 
        activeView={view} 
        onNavigate={(v) => {
            if (v === AppView.HISTORY) setHistory(getHistory());
            setView(v);
        }} 
      />
    </div>
  );
};

export default App;
