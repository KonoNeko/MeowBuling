import React, { useState, useRef, useEffect } from 'react';
import { AppView, ReadingSession, Topic, TarotCard, SpreadDefinition } from './types';
import { TAROT_DECK, TOPICS, SPREADS } from './constants';
import { Button, GlassCard, CardDisplay, Badge, LoadingSkeleton, Toast, SpreadLayout, SpreadPreview, CardDetailModal, Header, BottomNav, EnergyLoading, CategoryQuickNav, SpreadStartModal, ShufflingView } from './components';
import { generateInterpretation, saveReading, getHistory, updateReadingReflection } from './utils';

// Helper for random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mapping for Chinese categories with emojis
const CATEGORY_MAP: Record<string, string> = {
    "General Insight": "🔮 综合洞察",
    "Love & Relationship": "💕 情感关系",
    "Career & Study": "🚀 事业学业",
    "Decision-Making": "⚖️ 抉择指引",
    "Healing": "🌿 疗愈成长",
    "Future Forecast": "📅 运势预测",
    "Daily Guidance": "☀️ 每日指引",
    "Manifestation": "✨ 愿望显化"
};

const App = () => {
  // --- State ---
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSpread, setSelectedSpread] = useState<SpreadDefinition | null>(null);
  const [question, setQuestion] = useState("");
  const [filterTags, setFilterTags] = useState<string[]>([]); // New: Tags to filter spreads
  
  // Home Quick Draw State
  const [homeQuestion, setHomeQuestion] = useState("");

  // Library Interaction State
  const [librarySpreadToStart, setLibrarySpreadToStart] = useState<SpreadDefinition | null>(null);

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

  // --- TOUCH DRAG STATE ---
  const [draggingCard, setDraggingCard] = useState<TarotCard | null>(null);
  const dragOverlayRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  // Reading & AI State
  const [readingResult, setReadingResult] = useState<ReadingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ReadingSession[]>([]);
  
  // UI Feedback
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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
    setView(AppView.QUESTION_SELECT);
  };

  const handleQuestionSelect = (q: string, tags?: string[]) => {
    setQuestion(q);
    setFilterTags(tags || []); // Set tags derived from the subcategory
    setView(AppView.SPREAD_SELECT);
  }

  const handleCustomQuestionConfirm = () => {
    if (!selectedTopic) return;
    // Use default tags for the topic if available, otherwise empty (shows all)
    setFilterTags(selectedTopic.defaultTags || []); 
    setView(AppView.SPREAD_SELECT);
  };

  const handleSpreadSelect = (spread: SpreadDefinition) => {
    setSelectedSpread(spread);
    if (!question.trim()) {
      setQuestion(`关于${selectedTopic?.label}的指引`);
    }
    setDrawStep('init'); 
    setDrawnCards([]);
    setView(AppView.DRAW);
  };

  // Quick Draw Logic (Single Card)
  const handleQuickDraw = () => {
      // 1. Find the Single Card Spread ('daily_1')
      const spread = SPREADS.find(s => s.id === 'daily_1');
      if (!spread) {
          triggerToast("喵？找不到单张牌阵配置。");
          return;
      }
      
      // 2. Find a generic Topic. 'fortune' (运势与日常) covers general questions well.
      const topic = TOPICS.find(t => t.id === 'fortune') || TOPICS[0];
      
      // 3. Set State
      setSelectedTopic(topic);
      setSelectedSpread(spread);
      
      // Use homeQuestion if set, otherwise a default general question
      const q = homeQuestion.trim() || "宇宙此时此刻给我的指引是什么？";
      setQuestion(q);
      
      // 4. Reset Drawing
      setDrawStep('init');
      setDrawnCards([]);
      
      // 5. Navigate to Draw View
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
      setLibrarySpreadToStart(null); // Close modal
      setView(AppView.DRAW);
  };

  const startShuffle = () => {
    setDrawStep('shuffling');
    
    // 1. Prepare Deck
    const rawDeck = [...TAROT_DECK];
    
    // Simulate shuffle duration - Increased to 2.8s to include expand animation
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
    }, 2800); 
  };
  
  // Drag handlers for the scroll container (Container Scroll) - Desktop Mouse Support
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

  // --- TOUCH HANDLERS FOR CARDS ---
  
  const handleTouchStart = (e: React.TouchEvent, card: TarotCard) => {
      // Don't prevent default yet, we might be scrolling
      const touch = e.touches[0];
      dragStartPos.current = { x: touch.clientX, y: touch.clientY };
      isDraggingRef.current = false;
      // We don't set draggingCard state yet to avoid re-renders on simple taps/scrolls
  };

  const handleTouchMove = (e: React.TouchEvent, card: TarotCard) => {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartPos.current.x;
      const dy = touch.clientY - dragStartPos.current.y;

      // Logic: If user moves vertically (Up) more than horizontally, assume dragging card out of deck
      // Threshold of 10px prevents jitter
      if (!isDraggingRef.current) {
          // If upward movement is dominant
          if (dy < -10 && Math.abs(dy) > Math.abs(dx)) {
              isDraggingRef.current = true;
              setDraggingCard(card); // Now we start rendering the overlay
          }
      }

      if (isDraggingRef.current) {
          e.preventDefault(); // Stop page scrolling
          if (dragOverlayRef.current) {
              // Move the overlay directly via DOM for performance
              // Center the card on finger
              const cardWidth = 80; // approx width
              const cardHeight = 128; // approx height
              dragOverlayRef.current.style.transform = `translate(${touch.clientX - cardWidth/2}px, ${touch.clientY - cardHeight/2}px)`;
              dragOverlayRef.current.style.opacity = '1';
          }
      }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (isDraggingRef.current && draggingCard) {
          const touch = e.changedTouches[0];
          // Hide overlay immediately to inspect what's underneath
          if (dragOverlayRef.current) dragOverlayRef.current.style.opacity = '0';
          
          const element = document.elementFromPoint(touch.clientX, touch.clientY);
          const slot = element?.closest('[data-spread-slot]');
          
          if (slot) {
              const index = parseInt(slot.getAttribute('data-spread-slot') || '-1');
              if (index >= 0) handleCardDrop(draggingCard.id, index);
          }
      }
      
      // Reset
      isDraggingRef.current = false;
      setDraggingCard(null);
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

  const generateResult = async (cards: TarotCard[]) => {
    if (!selectedTopic || !selectedSpread) return;
    
    setLoading(true);
    setView(AppView.READING); // Move to reading view to show Skeleton

    const finalQuestion = question.trim() || `关于${selectedTopic.label}的指引`;

    try {
      const interpretation = await generateInterpretation(
        selectedTopic.label, 
        finalQuestion, 
        selectedSpread.id, 
        cards
      );

      const newReading: ReadingSession = {
        id: generateId(),
        timestamp: Date.now(),
        topicId: selectedTopic.id,
        topicLabel: selectedTopic.label,
        spreadId: selectedSpread.id,
        spreadName: selectedSpread.name,
        question: finalQuestion,
        cards,
        interpretation
      };

      saveReading(newReading);
      setReadingResult(newReading);
      // NOTE: We do NOT set loading to false here. 
      // The EnergyLoading component handles the exit animation when readingResult is ready.
    } catch (error) {
      console.error(error);
      alert("喵？星象连接中断了，请重试。");
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
    <div className="h-full w-full overflow-y-auto custom-scrollbar relative z-10">
      <div className="min-h-full flex flex-col items-center justify-center p-6 space-y-8 animate-fade-in text-center pb-32 pt-20">
        
        {/* Header Section */}
        <div className="space-y-4 flex flex-col items-center">
          {/* Cat Wizard Design */}
          <div className="relative w-40 h-40 flex items-center justify-center group scale-90 md:scale-100">
              {/* Hat (SVG) */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-28 h-28 z-20 animate-float" style={{ animationDuration: '5s' }}>
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] filter">
                      {/* Hat Cone */}
                      <path d="M50 5 L85 75 H15 L50 5Z" fill="#6d28d9" />
                      {/* Hat Brim */}
                      <ellipse cx="50" cy="75" rx="45" ry="15" fill="#5b21b6" />
                      {/* Gradient Overlay for 3D effect */}
                      <path d="M50 5 L85 75 H15 L50 5Z" fill="url(#hatGradient)" fillOpacity="0.6" />
                      <defs>
                          <linearGradient id="hatGradient" x1="50" y1="0" x2="50" y2="100">
                              <stop offset="0%" stopColor="#a78bfa" />
                              <stop offset="100%" stopColor="#4c1d95" />
                          </linearGradient>
                      </defs>
                      {/* Decorations */}
                      <text x="35" y="50" fontSize="15" fill="#fbbf24">✨</text>
                      <text x="55" y="30" fontSize="10" fill="#fcd34d">⭐</text>
                  </svg>
              </div>
              
              {/* Cat Emoji */}
              <div className="text-8xl z-10 animate-float filter drop-shadow-[0_0_20px_rgba(167,139,250,0.6)]" style={{ animationDelay: '1s' }}>
                  🐱
              </div>
              
              {/* Magic Particles */}
              <div className="absolute top-0 right-0 text-2xl animate-pulse-glow text-yellow-300">✨</div>
              <div className="absolute bottom-0 left-0 text-xl animate-pulse text-purple-300" style={{ animationDelay: '0.5s' }}>🌟</div>
              <div className="absolute top-10 -left-4 text-lg animate-float text-blue-300" style={{ animationDelay: '2s' }}>🔮</div>
          </div>

          <div className="space-y-2">
              <h1 className="text-5xl md:text-6xl font-mystic text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-indigo-200 tracking-wider">
                喵卜灵
              </h1>
              {/* Tarot App Hint */}
              <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-bold text-purple-300 uppercase tracking-[0.1em] opacity-80">
                 <span>✦</span> 喵星塔罗 · 心理投射 · 灵魂指引 <span>✦</span>
              </div>
          </div>
        </div>

        {/* --- MAIN ACTION: Full Theme Divination --- */}
        <div className="w-full max-w-sm relative group z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-purple-600/20 rounded-full blur-[40px] pointer-events-none animate-pulse-glow"></div>
            
            <GlassCard 
                onClick={handleStart}
                className="relative w-full p-6 bg-gradient-to-br from-[#2e1065]/80 to-[#1e1b4b]/80 border-purple-500/40 hover:border-purple-400/60 flex flex-col items-center gap-3 cursor-pointer group-hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(109,40,217,0.2)]"
            >
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-3xl filter drop-shadow-glow">🌌</span>
                    <h3 className="text-2xl font-mystic text-white font-bold tracking-wide group-hover:text-yellow-200 transition-colors">
                        开启完整占卜
                    </h3>
                </div>
                <div className="h-px w-3/4 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <p className="text-sm text-indigo-200/80 font-medium">
                    情感 • 事业 • 运势 • 抉择
                </p>
                <div className="mt-2 text-xs bg-white/10 px-3 py-1 rounded-full text-purple-200 group-hover:bg-white/20 transition-colors">
                    探索多维度牌阵解析 →
                </div>
            </GlassCard>
        </div>

        {/* --- SECONDARY ACTION: Quick Draw --- */}
        <div className="w-full max-w-sm relative z-10">
             <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex flex-col gap-3 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                        <span>⚡</span> 灵感一瞬
                    </h3>
                    <span className="text-[10px] text-white/40">快速单张指引</span>
                </div>
                
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="心中默念问题..."
                        className="flex-1 bg-black/40 border border-purple-500/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-400/50 text-sm transition-all focus:bg-black/60 placeholder-white/20"
                        value={homeQuestion}
                        onChange={(e) => setHomeQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickDraw()}
                    />
                    <button 
                        onClick={handleQuickDraw} 
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-900/50 transition-all active:scale-95"
                    >
                        抽牌
                    </button>
                </div>
             </div>
        </div>

         {/* History Link */}
         <button 
            onClick={() => { setHistory(getHistory()); setView(AppView.HISTORY); }} 
            className="text-indigo-400/50 hover:text-indigo-300 text-xs tracking-widest transition-all py-2 flex items-center gap-2 group"
         >
            <span className="group-hover:rotate-12 transition-transform">📜</span> 查看心灵足迹
         </button>
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
        <p className="text-indigo-300">问题越具体，星辰的回应越清晰</p>
      </div>

      <div className="grid gap-6">
        {selectedTopic?.subCategories?.map((cat, idx) => (
          <div key={idx} className="space-y-3">
             <h3 className="text-purple-200 font-bold ml-2 text-sm uppercase tracking-widest opacity-80">{cat.title}</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cat.questions.map((q, qIdx) => (
                   <button 
                     key={qIdx}
                     onClick={() => handleQuestionSelect(q, cat.spreadTags)}
                     className="bg-white/5 hover:bg-purple-600/30 border border-white/10 text-indigo-100 text-left px-5 py-4 rounded-xl transition-all hover:scale-[1.01] hover:shadow-lg text-sm md:text-base flex justify-between items-center group"
                   >
                     <span>{q}</span>
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

    // 2. Granular Tag Filter
    if (filterTags.length > 0) {
        // If the spread has ANY of the required tags, we show it.
        // Special case: 'general' tag is often included in subcategories to allow broad spreads.
        filteredSpreads = filteredSpreads.filter(spread => {
            return spread.tags.some(tag => filterTags.includes(tag));
        });
    }

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col justify-start p-6 space-y-8 animate-fade-in overflow-y-auto custom-scrollbar pt-20 pb-40">
          <div className="text-center space-y-2 shrink-0">
            <h2 className="text-3xl font-mystic text-white">选择你的牌阵</h2>
            <p className="text-indigo-300">为您精选了最适合当前问题的牌阵</p>
          </div>
          
          {/* Show Selected Question */}
          <div className="w-full max-w-2xl mx-auto bg-purple-900/20 border border-purple-500/30 rounded-xl p-6 text-center backdrop-blur-sm shrink-0">
             <p className="text-xs text-purple-300 uppercase tracking-widest mb-2">当前提问</p>
             <div className="text-xl md:text-2xl font-serif text-white italic">
               “ {question} ”
             </div>
             <button 
               onClick={() => setView(AppView.QUESTION_SELECT)}
               className="text-xs text-indigo-400 hover:text-white mt-3 underline decoration-indigo-500/50 hover:decoration-white"
             >
               修改问题
             </button>
          </div>
    
          {/* Spread Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {filteredSpreads.map(spread => (
              <GlassCard 
                key={spread.id} 
                onClick={() => handleSpreadSelect(spread)}
                className="flex flex-col items-center justify-between text-center gap-4 hover:bg-purple-900/30 border-purple-500/20 group cursor-pointer transition-all hover:scale-[1.02]"
              >
                <div className="w-full flex-1">
                  <div className="flex justify-between items-center mb-2">
                     <Badge className="text-[10px]">{spread.category}</Badge>
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
        <div className="h-full flex flex-col items-center animate-fade-in pt-16 pb-6 px-4 relative z-10 overflow-hidden supports-[height:100dvh]:h-[100dvh]">
           
           {/* Background Atmosphere - centered glow */}
           <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] md:w-[600px] md:h-[600px] bg-purple-900/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none"></div>

           {/* 
              CARD SECTION 
              Use flex-1 to take up available vertical space.
              Center align. 
           */}
           <div className="flex-1 flex items-center justify-center w-full min-h-0">
               <div 
                 className="relative group cursor-pointer perspective-1000"
                 onClick={startShuffle}
               >
                  {/* Floating Wrapper with responsive sizing based on viewport height */}
                  {/* Using vh for height to ensure it fits without scrolling on small phones */}
                  <div className="relative h-[40vh] md:h-[45vh] max-h-[420px] w-auto aspect-[2/3] transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2">
                      
                      {/* Card Shadow/Depth Layers */}
                      <div className="absolute top-0 left-0 w-full h-full bg-indigo-950 rounded-2xl border border-white/5 transform translate-x-3 translate-y-3 opacity-40"></div>
                      <div className="absolute top-0 left-0 w-full h-full bg-indigo-900 rounded-2xl border border-white/5 transform translate-x-1.5 translate-y-1.5 opacity-60"></div>
                      
                      {/* Main Card Face */}
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#2e1065] to-[#0f0c29] rounded-2xl border border-purple-500/30 flex flex-col items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.2)] group-hover:shadow-[0_0_60px_rgba(139,92,246,0.4)] transition-all duration-500">
                          
                          {/* Subtle Pattern */}
                          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                          
                          {/* Inner Border */}
                          <div className="absolute inset-3 border border-dashed border-purple-400/10 rounded-xl"></div>

                          {/* Central Icon */}
                          <div className="text-6xl md:text-8xl filter drop-shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-float mb-6">
                              🔮
                          </div>

                          {/* Interaction Hint (from screenshot) */}
                          <div className="absolute bottom-8 md:bottom-12 w-full flex flex-col items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                              {/* Top Line */}
                              <div className="w-16 md:w-24 h-[1px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>
                              
                              <div className="flex flex-col items-center gap-1">
                                  <span className="text-[10px] tracking-[0.2em] text-purple-200 uppercase font-medium">点击触碰</span>
                                  <div className="w-1 h-1 bg-purple-300 rounded-full animate-ping"></div>
                              </div>
                              
                              {/* Bottom Line */}
                              <div className="w-16 md:w-24 h-[1px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>
                          </div>
                          
                          {/* Scanline Effect */}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-400/5 to-transparent h-[20%] w-full animate-scan pointer-events-none"></div>
                      </div>
                  </div>
               </div>
           </div>
           
           {/* 
              CONTENT SECTION 
              Fixed at bottom area, content shrinks if needed but maintains padding
           */}
           <div className="w-full max-w-sm text-center relative z-20 space-y-4 md:space-y-6 shrink-0">
             
             {/* The Title */}
             <h2 className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-indigo-300/50 uppercase">
                The Universe is Listening
             </h2>

             {/* Instructional Box */}
             <div className="bg-[#1a1638]/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden group">
                {/* Glow effect inside box */}
                <div className="absolute -top-10 -left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-colors"></div>
                
                <p className="text-indigo-100/80 text-xs md:text-sm leading-relaxed md:leading-loose font-light relative z-10">
                   请深呼吸，摒除杂念。<br/>
                   在心中默念你当下的<span className="text-yellow-200/90 font-medium mx-1">困惑</span>与<span className="text-yellow-200/90 font-medium mx-1">期盼</span>。<br/>
                   当你感到内心平静时，注入能量开启指引。
                </p>
             </div>

             {/* Action Button */}
             <Button 
                onClick={startShuffle} 
                className="w-full py-3.5 md:py-4 bg-gradient-to-r from-[#6d28d9] to-[#4f46e5] hover:from-[#7c3aed] hover:to-[#6366f1] shadow-[0_0_20px_rgba(109,40,217,0.4)] hover:shadow-[0_0_30px_rgba(109,40,217,0.6)] border border-white/10 rounded-xl group transition-all duration-300 active:scale-95"
             >
                <div className="flex items-center justify-center gap-3">
                    <span className="text-lg text-purple-200 group-hover:rotate-45 transition-transform duration-500">✨</span> 
                    <span className="text-sm md:text-base tracking-widest font-bold text-white">注入能量 • 开始洗牌</span>
                    <span className="text-lg text-purple-200 group-hover:-rotate-45 transition-transform duration-500">✨</span>
                </div>
             </Button>

           </div>
        </div>
      )
    }

    // 2. Shuffling Animation State (Interactive)
    if (drawStep === 'shuffling') {
        return <ShufflingView />
    }

    // 3. Picking State
    return (
      <div className="h-full w-full relative overflow-hidden bg-[#0f0c29]">
        
        {/* Custom Back Button for Draw View (No Header) */}
        <div className="absolute top-0 left-0 w-full z-[60] p-4 pointer-events-none">
            <button 
                onClick={handleBack}
                className="pointer-events-auto w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
        </div>

        {/* Spread Area: Takes full space behind, scrollable */}
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar z-0 flex flex-col">
            
            {/* Top Spacer to avoid collision with back button */}
            <div className="h-16 shrink-0"></div> 

            {selectedSpread && (
                <div className="w-full flex-1 flex flex-col items-center min-h-[60vh] pb-72"> {/* Increased bottom padding to clear taller deck */}
                     
                     <div className="text-center mb-6 px-4">
                        <h2 className="text-xl font-mystic text-purple-200 flex items-center justify-center gap-2">
                            {selectedSpread?.name} 
                            <Badge className="text-sm px-2">{drawnCards.length} / {selectedSpread?.cardCount}</Badge>
                        </h2>
                        <p className="text-indigo-400 text-xs mt-1 opacity-80">
                            {drawnCards.length === selectedSpread?.cardCount ? "正在揭示..." : "请从下方拖拽卡牌至槽位"}
                        </p>
                    </div>

                     {/* The Spread Layout */}
                     <div className="w-full max-w-2xl px-4 transform transition-transform origin-top">
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

        {/* Touch Drag Overlay (Ghost Card) */}
        {draggingCard && (
            <div 
                ref={dragOverlayRef}
                className="fixed top-0 left-0 z-[100] pointer-events-none opacity-0 transition-opacity duration-150"
                style={{ width: '80px', height: '128px' }} // Approximate small card size
            >
                <div className="w-full h-full bg-indigo-950/90 rounded-lg border-2 border-purple-400/50 shadow-2xl overflow-hidden relative rotate-6">
                    <div className="w-full h-full opacity-60 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                    <div className="absolute inset-1 border border-dashed border-white/20 rounded"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">🔮</span>
                    </div>
                </div>
            </div>
        )}

        {/* Deck Area: Fixed at bottom, overlays spread */}
        {drawnCards.length < (selectedSpread?.cardCount || 0) && (
            // Increased height to h-60 (15rem/240px) to ensure visibility on mobile browsers
            // Added pb-safe logic via padding-bottom
            <div className="absolute bottom-0 left-0 w-full h-60 md:h-64 z-50 pointer-events-auto">
                 {/* Gradient Backdrop - adjusted gradient start */}
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0f0c29] via-[#0f0c29] to-transparent"></div>
                 
                 {/* Scroll Container */}
                 <div 
                    ref={scrollContainerRef}
                    className="absolute inset-0 flex items-end overflow-x-auto px-4 pb-8 pt-12 scrollbar-hide perspective-1000 cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                >
                    <div className="flex items-end space-x-[-2.5rem] md:space-x-[-4rem] pr-8" style={{ width: 'max-content' }}>
                        {deck.map((card, idx) => (
                            <div 
                                key={card.id}
                                className="draggable-card relative w-20 h-32 md:w-28 md:h-44 transition-all duration-300 hover:-translate-y-8 hover:scale-110 hover:z-50 hover:space-x-0 group select-none origin-bottom mb-2" // Added mb-2 for safety
                                onClick={() => handleCardClick(card)}
                                draggable={true} 
                                onDragStart={(e) => handleDragStart(e, card)}
                                // Touch Events for Mobile Drag
                                onTouchStart={(e) => handleTouchStart(e, card)}
                                onTouchMove={(e) => handleTouchMove(e, card)}
                                onTouchEnd={(e) => handleTouchEnd(e)}
                            >
                                <div className="w-full h-full bg-indigo-950 rounded-lg border border-purple-600/50 shadow-xl overflow-hidden relative">
                                    <div className="w-full h-full opacity-60 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                                    <div className="absolute inset-1 border border-dashed border-white/10 rounded"></div>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    {/* Back Design */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity">
                                        <span className="text-2xl">🔮</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Instruction Overlay - moved up slightly */}
                <div className="absolute bottom-1 left-0 w-full text-center pointer-events-none text-white/30 text-[10px] animate-pulse z-50 py-1">
                    ← 点击卡牌抽取 • 左右滑动选牌 →
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
          </div>

          {/* The Spread Display (Using the Layout Engine now!) */}
          <div className="w-full overflow-x-auto py-8 flex justify-center">
             {selectedSpread && (
                // Removed scale-75 to prevent card shrinkage on mobile
                <div className="w-full max-w-2xl origin-top">
                    <SpreadLayout 
                        spread={selectedSpread} 
                        drawnCards={readingResult.cards} 
                        // No onDrop here, read-only mode
                        isRevealed={true} // Force reveal in result view
                        onCardClick={(card) => setInspectingCard(card)}
                    />
                    <div className="text-center mt-4">
                        <span className="text-xs text-indigo-400 bg-white/5 px-3 py-1 rounded-full animate-pulse">👆 点击卡牌查看详情与科普</span>
                    </div>
                </div>
             )}
          </div>

          {/* Fable Section (New) */}
          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-2xl p-8 border border-white/10 relative overflow-hidden group hover:bg-white/5 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-20 text-6xl rotate-12 pointer-events-none">📖</div>
              <h3 className="text-xl font-bold text-purple-200 mb-4 flex items-center gap-2">
                  <span>📜</span> 命运寓言
              </h3>
              <p className="text-lg text-indigo-100 italic font-serif leading-relaxed opacity-90">
                  "{interpretation.fable}"
              </p>
          </div>

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
            <div className="relative z-30 py-4 -mx-6 px-6 flex justify-center">
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
                         <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
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
                            size="xs" 
                            label={card.name_cn}
                            onClick={() => setInspectingCard(card)}
                         />
                      </div>
                  ))}
              </div>
          </div>
      );

      return (
        <div className="h-full overflow-y-auto p-6 pt-8 custom-scrollbar animate-fade-in pb-32">
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

  const renderSpreadLibrary = () => {
      // Group spreads by category
      const categories = Array.from(new Set(SPREADS.map(s => s.category)));
      
      const scrollToCategory = (cat: string) => {
          const el = document.getElementById(`cat-${cat}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };

      // Map Categories to Objects with Chinese Labels
      const navCategories = categories.map(cat => ({
          id: cat,
          label: CATEGORY_MAP[cat] || cat // Fallback to English if not found
      }));

      return (
        <div className="h-full overflow-y-auto pt-0 custom-scrollbar animate-fade-in pb-32 scroll-smooth">
            {/* Start Modal */}
            {librarySpreadToStart && (
                <SpreadStartModal 
                    spread={librarySpreadToStart} 
                    onClose={() => setLibrarySpreadToStart(null)}
                    onStart={(q) => handleDirectStartFromLibrary(librarySpreadToStart, q)}
                />
            )}

            <CategoryQuickNav categories={navCategories} onSelect={scrollToCategory} />

            <div className="max-w-6xl mx-auto px-6 relative text-center mb-6 space-y-2 mt-8">
                <h2 className="text-3xl font-mystic text-white">牌阵宝典</h2>
                <p className="text-indigo-300">探索古老与现代的占卜几何学</p>
            </div>

            <div className="max-w-6xl mx-auto px-6 relative">
                {categories.map(cat => (
                    <div key={cat} id={`cat-${cat}`} className="mb-12 scroll-mt-32">
                        <div className="flex items-center gap-4 mb-6">
                            <h3 className="text-xl font-mystic text-purple-200">{CATEGORY_MAP[cat] || cat}</h3>
                            <div className="h-px bg-purple-500/30 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {SPREADS.filter(s => s.category === cat).map(spread => (
                                <GlassCard 
                                    key={spread.id} 
                                    className="flex flex-col gap-4 group hover:bg-white/10 cursor-pointer transition-all hover:scale-[1.01] hover:border-purple-500/40 relative overflow-hidden"
                                    onClick={() => setLibrarySpreadToStart(spread)}
                                >
                                    {/* Action hint overlay on hover */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-purple-600 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-lg">
                                        点击占卜 ▶
                                    </div>

                                    <div className="flex justify-between items-start">
                                        <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">{spread.name}</h4>
                                        <Badge className="text-[10px]">{spread.cardCount} 张</Badge>
                                    </div>
                                    <div className="flex justify-center py-4 bg-black/20 rounded-xl group-hover:bg-black/30 transition-colors">
                                        <div className="scale-75">
                                           <SpreadPreview spread={spread} />
                                        </div>
                                    </div>
                                    <p className="text-sm text-indigo-200/80">{spread.description}</p>
                                    <div className="space-y-1 mt-2">
                                        {spread.positions.map(p => (
                                            <div key={p.id} className="text-xs text-indigo-400 flex gap-2">
                                                <span className="font-mono text-purple-400 opacity-70">{p.id}.</span>
                                                <span>{p.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                ))}
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

      {/* Header (Simplified) - Exclude DRAW view */}
      {(view !== AppView.LIBRARY && view !== AppView.SPREAD_LIBRARY && view !== AppView.DRAW) && (
      <Header 
        onBack={handleBack}
        title={view === AppView.HOME ? "" : (selectedTopic?.label || "喵卜灵")}
        showBack={view !== AppView.HOME && view !== AppView.HISTORY}
      />
      )}

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
        {view === AppView.SPREAD_LIBRARY && renderSpreadLibrary()}
      </div>

      {/* Bottom Navigation */}
      {view !== AppView.DRAW && (
        <BottomNav 
          activeView={view} 
          onNavigate={(v) => {
              if (v === AppView.HISTORY) setHistory(getHistory());
              setView(v);
          }} 
        />
      )}
    </div>
  );
};

export default App;