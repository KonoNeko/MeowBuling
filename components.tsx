import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SpreadDefinition, TarotCard, AppView, ReadingSession } from './types';
import { getCardEducation, SYSTEM_INSTRUCTION } from './constants';

// --- Base Components ---

export const Button = ({ children, onClick, className = "", variant = "primary", disabled = false }: any) => {
  const baseClass = "px-6 py-3 rounded-full font-bold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50",
    secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm",
    ghost: "text-purple-300 hover:text-white hover:bg-white/5",
    outline: "border-2 border-purple-500/50 text-purple-200 hover:bg-purple-500/20"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClass} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};

export const GlassCard = ({ children, className = "", onClick }: any) => (
  <div 
    onClick={onClick}
    className={`glass-panel rounded-2xl p-6 ${className} ${onClick ? 'cursor-pointer transition-transform hover:scale-[1.02]' : ''}`}
  >
    {children}
  </div>
);

export const Badge = ({ children, className = "" }: any) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-200 border border-purple-700/50 ${className}`}>
    {children}
  </span>
);

export const LoadingSkeleton = () => (
  <div className="w-full space-y-6">
    <div className="h-12 bg-white/5 rounded-xl w-3/4 mx-auto animate-pulse"></div>
    <div className="space-y-4">
        {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white/5 rounded-xl border border-white/10 p-6 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                <div className="h-6 bg-purple-500/20 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-3 bg-white/10 rounded w-full"></div>
                    <div className="h-3 bg-white/10 rounded w-11/12"></div>
                    <div className="h-3 bg-white/10 rounded w-4/5"></div>
                </div>
            </div>
        ))}
    </div>
  </div>
);

// --- NAVIGATION COMPONENTS ---

export const CategoryQuickNav = ({ categories, onSelect }: { categories: {id: string, label: string}[], onSelect: (catId: string) => void }) => {
    return (
        <div className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0f0c29]/95 backdrop-blur-xl shadow-2xl">
            <div className="max-w-7xl mx-auto px-2 md:px-6">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3 items-center px-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => onSelect(cat.id)}
                            className="whitespace-nowrap px-4 py-2 rounded-xl text-xs md:text-sm font-bold bg-white/5 border border-white/10 hover:bg-purple-600/20 hover:border-purple-500/50 hover:text-white transition-all text-indigo-200 shrink-0 active:scale-95"
                        >
                            {cat.label}
                        </button>
                    ))}
                    <div className="w-4 shrink-0"></div>
                </div>
            </div>
        </div>
    );
};

export const SpreadStartModal = ({ spread, onClose, onStart }: { spread: SpreadDefinition, onClose: () => void, onStart: (question: string) => void }) => {
    const [inputQuestion, setInputQuestion] = useState("");
    const defaultQuestion = `关于${spread.name}的指引`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-[#1a1638] rounded-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(109,40,217,0.3)] p-6 animate-fade-in-up">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-2">🔮</div>
                    <h3 className="text-2xl font-mystic text-white mb-1">{spread.name}</h3>
                    <Badge className="text-xs">{spread.category}</Badge>
                </div>
                <div className="space-y-6">
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="scale-75 origin-center -my-2 flex justify-center">
                             <SpreadPreview spread={spread} />
                        </div>
                        <p className="text-sm text-indigo-300 mt-2">{spread.description}</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-purple-300 font-bold ml-1">你想问什么？(可选)</label>
                        <textarea 
                            className="w-full bg-black/30 border border-purple-500/30 rounded-xl p-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all text-sm resize-none h-24"
                            placeholder={`默认为：${defaultQuestion}\n例如：我和他未来三个月会如何发展？`}
                            value={inputQuestion}
                            onChange={(e) => setInputQuestion(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" className="flex-1" onClick={onClose}>再看看</Button>
                        <Button 
                            className="flex-1" 
                            onClick={() => onStart(inputQuestion.trim() || defaultQuestion)}
                        >
                            开始占卜
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- VISUAL EFFECTS COMPONENTS ---

interface Particle {
    id: number;
    x: number;
    y: number;
    tx: number;
    ty: number;
    tr: number; // rotation
    color: string;
    size: number;
    icon?: string;
    delay?: number;
}

export const ShufflingView = () => {
    // Phase: 'start' (init hidden) -> 'shuffle' (Chaos) -> 'orbit' (Sphere Order) -> 'expand' (Fan out)
    const [phase, setPhase] = useState<'start' | 'shuffle' | 'orbit' | 'expand'>('start');
    const [textPhase, setTextPhase] = useState(0);

    const TOTAL_CARDS = 30;

    useEffect(() => {
        // 1. Chaos Shuffle
        const tStart = setTimeout(() => setPhase('shuffle'), 50);

        // 2. Harmony (Fibonacci Sphere)
        const t1 = setTimeout(() => setPhase('orbit'), 800);
        
        // 3. Final Reveal
        const t3 = setTimeout(() => setPhase('expand'), 2600);
        
        // Cycle text
        const t2 = setInterval(() => {
            setTextPhase(p => (p + 1) % 2);
        }, 1000);

        return () => {
            clearTimeout(tStart);
            clearTimeout(t1);
            clearTimeout(t3);
            clearInterval(t2);
        };
    }, []);

    const cards = useMemo(() => {
        // Fibonacci Sphere Algorithm
        // Distributes points evenly on a sphere surface
        const phi = Math.PI * (3 - Math.sqrt(5)); // Golden Angle

        return Array.from({ length: TOTAL_CARDS }).map((_, i) => {
            
            // --- ORBIT: FIBONACCI SPHERE ---
            const y = 1 - (i / (TOTAL_CARDS - 1)) * 2; // y goes from 1 to -1
            const radiusAtY = Math.sqrt(1 - y * y); // Radius at y
            const theta = phi * i; // Golden angle increment

            const sphereRadius = 22; // vmin
            
            // Convert to Cartesian coordinates
            const x = Math.cos(theta) * radiusAtY * sphereRadius;
            const z = Math.sin(theta) * radiusAtY * sphereRadius;
            const yPos = y * sphereRadius;

            // Calculate rotation to face roughly outwards/center
            // Simple look-at math approximation for CSS
            const rotY = 90 - (theta * 180 / Math.PI); 
            const rotX = -Math.asin(y) * (180 / Math.PI);

            // --- SHUFFLE: CHAOS ---
            const randX = (Math.random() - 0.5) * 200; 
            const randY = (Math.random() - 0.5) * 200;
            const randZ = (Math.random() - 0.5) * 800;
            const randRotX = Math.random() * 720; 
            const randRotY = Math.random() * 720; 

            // --- EXPAND: FAN OUT ---
            const normalizedIndex = i - (TOTAL_CARDS / 2);
            const expandX = normalizedIndex * 4;

            return {
                id: i,
                startStyle: {
                    transform: `translate3d(0, 0, 0) scale(0)`,
                    opacity: 0
                },
                shuffleStyle: {
                    transform: `translate3d(${randX}vmin, ${randY}vmin, ${randZ}px) rotateX(${randRotX}deg) rotateY(${randRotY}deg) scale(0.6)`,
                    opacity: 1
                },
                orbitStyle: {
                    // Position on sphere
                    transform: `translate3d(${x}vmin, ${yPos}vmin, ${z}vmin) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(0.8)`,
                    opacity: 0.9
                },
                expandStyle: {
                    transform: `translate3d(${expandX}vmin, 35vh, 0px) rotateZ(${normalizedIndex * 2}deg) scale(1)`,
                    opacity: 1
                }
            };
        });
    }, []);

    const messages = ["命运洗牌...", "星轨重组..."];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0c29] overflow-hidden select-none pointer-events-none perspective-1000">
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/60 via-[#0f0c29] to-black"></div>
            
            {/* Center Core Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vmin] h-[40vmin] bg-purple-500/10 rounded-full blur-[60px] animate-pulse-scale transition-opacity duration-500 ${phase === 'expand' ? 'opacity-0' : 'opacity-100'}`}></div>

            {/* --- 3D SCENE CONTAINER --- */}
            <div 
                className="relative w-full h-full flex items-center justify-center transform-style-3d"
                style={{ perspective: '1500px' }}
            >
                {/* 
                   SPHERE CONTAINER
                   Rotates slowly to show the 3D structure
                */}
                <div 
                    className={`
                        relative w-full h-full flex items-center justify-center transform-style-3d
                        ${phase === 'orbit' ? 'animate-[spin_20s_linear_infinite]' : ''}
                    `}
                >
                    {cards.map(card => (
                        <div
                            key={card.id}
                            className="absolute w-[8vmin] h-[12vmin] bg-indigo-950/80 border border-purple-400/40 rounded-lg shadow-[0_0_10px_rgba(168,85,247,0.3)] backface-visible transition-all ease-in-out"
                            style={{
                                transitionDuration: phase === 'shuffle' ? '600ms' : (phase === 'orbit' ? '1200ms' : '800ms'),
                                transitionTimingFunction: phase === 'orbit' ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'ease-out',
                                ...(phase === 'start' ? card.startStyle : 
                                   phase === 'shuffle' ? card.shuffleStyle : 
                                   phase === 'expand' ? card.expandStyle : 
                                   card.orbitStyle)
                            }}
                        >
                            {/* Inner Shimmer */}
                            <div className="w-full h-full bg-gradient-to-tr from-purple-500/20 via-transparent to-blue-500/20 rounded-lg overflow-hidden">
                                 <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                                 <div className="absolute inset-1 border border-dashed border-white/10 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- CORE ENERGY (Appears in Orbit) --- */}
            {/* A small bright star in the very center of the sphere */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${phase === 'orbit' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                <div className="w-[4vmin] h-[4vmin] bg-white rounded-full shadow-[0_0_40px_white] animate-pulse"></div>
            </div>

            {/* --- TEXT OVERLAY --- */}
            <div className={`absolute bottom-[18%] left-0 w-full text-center z-50 transition-opacity duration-300 ${phase === 'expand' ? 'opacity-0' : 'opacity-100'}`}>
                <h2 className="text-2xl md:text-3xl font-mystic tracking-[0.5em] font-light text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200 drop-shadow-lg animate-pulse">
                    {messages[textPhase]}
                </h2>
                <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent mx-auto mt-4"></div>
            </div>
        </div>
    );
};

export const EnergyLoading = ({ onComplete, isReady }: { onComplete: () => void, isReady: boolean }) => {
    const [energy, setEnergy] = useState(0);
    const [showMeowReveal, setShowMeowReveal] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isClicking, setIsClicking] = useState(false);
    
    // Auto increment logic
    useEffect(() => {
        const timer = setInterval(() => {
            if (!showMeowReveal) {
                setEnergy(prev => {
                    // Slow down as we get closer to 100 if not ready
                    const target = isReady ? 100 : 95;
                    if (prev >= target) return prev; 
                    return prev + 0.5;
                });
            }
        }, 100);
        return () => clearInterval(timer);
    }, [showMeowReveal, isReady]);

    // Check for completion
    useEffect(() => {
        if (energy >= 100 && isReady && !showMeowReveal) {
            triggerFinale();
        }
    }, [energy, isReady, showMeowReveal]);

    const triggerFinale = () => {
        // --- 1. THE BIG BANG EXPLOSION ---
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const explosionCount = 60; // More particles for impact
        const newParticles: Particle[] = [];
        
        // Burst of particles
        for (let i = 0; i < explosionCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            // Variable distance for natural look
            const velocity = 150 + Math.random() * 400; 
            const size = 3 + Math.random() * 6;
            
            newParticles.push({
                id: Date.now() + i,
                x: centerX,
                y: centerY,
                tx: Math.cos(angle) * velocity,
                ty: Math.sin(angle) * velocity,
                tr: Math.random() * 360,
                color: ['#fbbf24', '#fcd34d', '#c084fc', '#e879f9', '#ffffff'][Math.floor(Math.random() * 5)],
                size: size,
                icon: Math.random() > 0.8 ? '✨' : undefined,
                delay: 0
            });
        }
        setParticles(prev => [...prev, ...newParticles]);

        setShowMeowReveal(true);
        
        // Clear particles after explosion settles to save memory
        setTimeout(() => {
            setParticles([]);
        }, 1500);

        // Delay onComplete slightly longer to let user absorb the mystical vibe
        setTimeout(() => {
            onComplete();
        }, 5000); 
    };

    const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
        if (showMeowReveal) return;

        // Visual feedback for clicking
        setIsClicking(true);
        setTimeout(() => setIsClicking(false), 150);

        // 1. Boost Energy
        setEnergy(prev => {
            // If ready, we can boost to 100. If not, cap at 98 to indicate waiting.
            const limit = isReady ? 100 : 98;
            return Math.min(prev + 5, limit);
        });

        // 2. Create Particles (User Interaction)
        let clientX, clientY;
        if ('touches' in e) {
             clientX = e.touches[0].clientX;
             clientY = e.touches[0].clientY;
        } else {
             clientX = (e as React.MouseEvent).clientX;
             clientY = (e as React.MouseEvent).clientY;
        }

        const newParticles: Particle[] = [];
        const colors = ['#fcd34d', '#fbbf24', '#ffffff', '#a78bfa']; 
        const starIcons = ['✨', '⭐', '✦'];
        const particleCount = 5 + Math.random() * 5; 

        // Spawn particles at click position
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 150;
            const tx = Math.cos(angle) * speed;
            const ty = Math.sin(angle) * speed;
            const tr = Math.random() * 360;
            const isIcon = Math.random() > 0.4; // Frequent stars
            
            newParticles.push({
                id: Date.now() + Math.random(),
                x: clientX,
                y: clientY,
                tx,
                ty,
                tr,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: isIcon ? 15 + Math.random() * 10 : 4 + Math.random() * 4,
                icon: isIcon ? starIcons[Math.floor(Math.random() * starIcons.length)] : undefined
            });
        }
        
        setParticles(prev => [...prev, ...newParticles]);
        setTimeout(() => {
            setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
        }, 1000);
    };

    return (
        <div 
            className="fixed inset-0 z-[100] bg-[#0f0c29] flex flex-col items-center justify-center overflow-hidden touch-manipulation select-none"
            onClick={handleClick}
            onTouchStart={handleClick}
        >
            {/* Background Atmosphere - Always present */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
                 <div className="absolute top-[20%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse"></div>
                 <div className="absolute top-[60%] right-[20%] w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                 <div className="absolute bottom-[30%] left-[40%] w-1 h-1 bg-blue-300 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            </div>

            {/* MEOW BULING REVEAL - THE MYSTICAL FINALE */}
            {showMeowReveal ? (
                <div className="relative z-20 flex flex-col items-center justify-center w-full h-full animate-fade-in duration-1000">
                    
                    {/* 1. Flash of Light (The Transition) */}
                    <div className="absolute inset-0 bg-white animate-[particle-explode_1s_ease-out_forwards] pointer-events-none z-50 mix-blend-overlay"></div>

                    {/* 2. Deep Nebula Background */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         {/* Large rotating nebula glows */}
                         <div className="w-[100vw] h-[100vw] bg-purple-900/40 rounded-full blur-[120px] animate-[spin_60s_linear_infinite]"></div>
                         <div className="absolute w-[80vw] h-[80vw] bg-indigo-900/40 rounded-full blur-[100px] animate-[spin_40s_linear_infinite_reverse]"></div>
                         <div className="absolute w-[40vw] h-[40vw] bg-pink-900/20 rounded-full blur-[80px] animate-pulse"></div>
                    </div>

                    {/* 3. Sacred Geometry (Elegant Lines) */}
                    <div className="absolute flex items-center justify-center opacity-60">
                        <div className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] border border-white/10 rounded-full animate-[spin_30s_linear_infinite]"></div>
                        <div className="absolute w-[240px] h-[240px] md:w-[400px] md:h-[400px] border border-dashed border-purple-300/20 rounded-full animate-[spin_45s_linear_infinite_reverse]"></div>
                        {/* Thin gold ring */}
                        <div className="absolute w-[280px] h-[280px] md:w-[460px] md:h-[460px] border-[0.5px] border-yellow-200/10 rounded-full scale-110 animate-pulse"></div>
                    </div>
                    
                    {/* 4. The Prophet (Cat) - Slow majestic float */}
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="text-[120px] md:text-[160px] filter drop-shadow-[0_0_80px_rgba(168,85,247,0.6)] animate-float scale-110">
                            🐱
                            {/* Inner glow behind cat */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-white/20 rounded-full blur-2xl -z-10"></div>
                        </div>
                    </div>
                    
                    {/* 5. The Prophecy Text - Immersive Copy */}
                    <div className="relative z-10 mt-16 text-center space-y-6">
                        
                        {/* Primary Title */}
                        <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                             <h2 className="text-4xl md:text-6xl font-mystic text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-purple-100 to-indigo-200 tracking-[0.2em] font-light drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                                星 轨 已 定
                            </h2>
                        </div>

                        {/* Divider */}
                        <div className="flex justify-center items-center gap-4 opacity-0 animate-fade-in" style={{animationDelay: '0.8s'}}>
                            <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-400"></div>
                            <div className="text-xl text-yellow-200">✦</div>
                            <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-400"></div>
                        </div>

                        {/* Secondary Text */}
                        <div className="animate-fade-in-up" style={{animationDelay: '1.2s'}}>
                            <p className="text-indigo-200 text-sm md:text-lg font-serif tracking-widest uppercase">
                                天 机 显 现 · 命 运 回 响
                            </p>
                        </div>

                    </div>
                </div>
            ) : (
                /* LOADING STATE */
                <>
                    {/* Central Crystal Ball */}
                    <div className={`relative cursor-pointer transition-transform duration-100 mt-[-10vh] ${energy >= 95 ? 'animate-shake' : isClicking ? 'scale-95' : 'scale-100'}`}>
                        {/* Energy Glow */}
                        <div 
                            className="absolute inset-0 bg-purple-600 rounded-full blur-[60px] transition-all duration-300 ease-out"
                            style={{ 
                                opacity: 0.2 + (energy / 100),
                                transform: `scale(${1 + energy/80})`,
                                backgroundColor: isClicking ? '#fbbf24' : '#9333ea' // Purple to Gold on click
                            }}
                        ></div>
                        
                        {/* The Ball/Icon */}
                        <div className="relative z-10 text-8xl md:text-9xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-500">
                            🔮
                        </div>
                    </div>

                    {/* Text & Progress */}
                    <div className="mt-16 text-center space-y-6 relative z-10 px-8 w-full max-w-md pointer-events-none">
                        <h2 className="text-2xl md:text-3xl font-mystic text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 animate-pulse tracking-wide">
                            {isReady ? "星象已就绪！" : "正在连接星界..."}
                        </h2>
                        
                        <div className={`space-y-3 transition-all duration-150`}>
                            <p className="text-indigo-300 text-sm md:text-base font-medium animate-bounce">
                                👆 点击屏幕注入灵力加速
                            </p>
                            
                            {/* Cool Progress Bar with Click Feedback */}
                            <div 
                                className={`
                                    w-full h-6 bg-black/40 rounded-full overflow-hidden border transition-all duration-200 relative
                                    ${isClicking 
                                        ? 'border-yellow-400 shadow-[0_0_30px_rgba(251,191,36,0.6)] ring-2 ring-yellow-300/50 scale-[1.02]' 
                                        : 'border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                    }
                                `}
                            >
                                <div 
                                    className={`h-full transition-all duration-200 ease-out animate-progress
                                        ${isClicking 
                                            ? 'bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-300' 
                                            : 'bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500'
                                        }
                                    `}
                                    style={{ width: `${Math.min(energy, 100)}%` }}
                                >
                                    <div className="absolute top-0 right-0 h-full w-2 bg-white/80 blur-[2px] shadow-[0_0_10px_white]"></div>
                                </div>
                            </div>
                            
                            <p className="text-xs text-indigo-400/60 font-mono flex justify-between">
                                <span>{Math.floor(Math.min(energy, 100))}% 能量汇聚</span>
                                <span className={!isReady && energy > 90 ? "animate-pulse text-yellow-300" : ""}>
                                    {isReady ? "READY" : (energy > 95 ? "WAITING FOR STARS..." : "SYNCING...")}
                                </span>
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* Particles Render Layer */}
            {particles.map(p => (
                <div 
                    key={p.id}
                    className="absolute rounded-full animate-particle-explode pointer-events-none flex items-center justify-center font-bold z-50"
                    style={{
                        left: p.x,
                        top: p.y,
                        backgroundColor: p.icon ? 'transparent' : p.color,
                        color: p.color,
                        width: p.size,
                        height: p.size,
                        fontSize: p.size,
                        '--tx': `${p.tx}px`,
                        '--ty': `${p.ty}px`,
                        '--tr': `${p.tr}deg`,
                        boxShadow: p.icon ? 'none' : `0 0 ${p.size}px ${p.color}`,
                        animationDelay: `${p.delay || 0}s`
                    } as React.CSSProperties}
                >
                    {p.icon}
                </div>
            ))}
        </div>
    )
}

export const Toast = ({ message, show }: { message: string, show: boolean }) => (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 transform ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-indigo-600/90 text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-white/20 backdrop-blur-md flex items-center gap-2">
            <span>✨</span>
            <span className="font-medium text-sm tracking-wide">{message}</span>
        </div>
    </div>
);

export const Header = ({ 
    onBack, 
    title,
    showBack
}: { 
    onBack?: () => void, 
    title?: string, 
    showBack: boolean
}) => {
    return (
        <div className="fixed top-0 left-0 right-0 h-16 bg-[#0f0c29]/80 backdrop-blur-md border-b border-white/10 z-[60] flex items-center justify-between px-4 md:px-6 transition-all">
            <div className="w-20 flex justify-start">
                {showBack && (
                    <button 
                        onClick={onBack}
                        className="text-white/80 hover:text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium hidden md:inline">返回</span>
                    </button>
                )}
            </div>

            <div className="flex-1 flex justify-center items-center">
                {title ? (
                    <h1 className="text-lg md:text-xl font-mystic text-purple-100 truncate max-w-[200px] md:max-w-md">{title}</h1>
                ) : (
                    <div className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity" onClick={onBack}>
                        <span className="text-2xl">🐱</span>
                        <span className="font-mystic text-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-indigo-200 hidden md:inline">喵卜灵</span>
                    </div>
                )}
            </div>

            <div className="w-20 flex justify-end"></div>
        </div>
    );
};

export const BottomNav = ({ 
    activeView, 
    onNavigate 
}: { 
    activeView: AppView, 
    onNavigate: (view: AppView) => void 
}) => {
    const navItems = [
        { view: AppView.HOME, label: '首页', icon: '🔮' },
        { view: AppView.LIBRARY, label: '牌库', icon: '🎴' },
        { view: AppView.SPREAD_LIBRARY, label: '牌阵', icon: '✨' },
        { view: AppView.HISTORY, label: '历史', icon: '📜' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f0c29]/95 backdrop-blur-lg border-t border-white/10 z-[60] pb-safe">
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = activeView === item.view;
                    return (
                        <button
                            key={item.view}
                            onClick={() => onNavigate(item.view)}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${isActive ? 'text-purple-300 scale-110' : 'text-indigo-300/60 hover:text-indigo-200'}`}
                        >
                            <span className={`text-2xl filter ${isActive ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'grayscale opacity-70'}`}>
                                {item.icon}
                            </span>
                            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                            {isActive && <div className="w-1 h-1 bg-purple-400 rounded-full absolute bottom-2"></div>}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

// --- Specific UI Components ---

export const CardDisplay = ({ card, revealed, size = "md", label, onClick }: any) => {
  // Enhanced mobile sizes:
  // xs: Boosted to 80px (w-20) from 64px
  // sm: Boosted to 96px (w-24) from 80px
  
  const sizeClasses = size === "sm" 
     ? "w-24 h-40 md:w-32 md:h-52" // Boosted SM for mobile legibility
     : "w-48 h-80"; // MD (Standard)
     
  const displaySize = size === "xs" 
     ? "w-20 h-32 md:w-24 md:h-40" // Boosted XS (was old SM size)
     : sizeClasses; 
  
  return (
    <div className="flex flex-col items-center gap-2 relative z-10">
      <div 
        onClick={onClick}
        className={`relative ${displaySize} cursor-pointer group`}
        style={{ perspective: '1000px' }}
      >
        <div 
            className={`w-full h-full transition-all duration-700 relative`}
            style={{ 
                transformStyle: 'preserve-3d',
                transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
        >
          <div 
            className="absolute w-full h-full bg-indigo-950 rounded-xl border border-purple-400/20 shadow-xl overflow-hidden flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
             <div className="w-full h-full opacity-40 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
             <div className="absolute inset-2 border border-dashed border-purple-300/20 rounded-lg"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl md:text-3xl opacity-50 filter drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">🔮</span>
             </div>
          </div>
          <div 
            className="absolute w-full h-full bg-slate-900 rounded-xl border-2 border-amber-500/30 overflow-hidden shadow-2xl"
            style={{ 
                backfaceVisibility: 'hidden', 
                transform: 'rotateY(180deg)' 
            }}
          >
             <div className={`w-full h-full transition-transform duration-0 ${card.isReversed ? 'rotate-180' : ''}`}>
                 <img 
                   src={card.image} 
                   alt={card.name} 
                   className="w-full h-full object-cover"
                   loading="lazy"
                 />
             </div>
             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-1 md:p-2 md:pt-6 flex flex-col items-center">
               <div className="text-[8px] md:text-[10px] font-bold text-amber-100 tracking-wider shadow-black drop-shadow-md text-center leading-tight">
                  {card.name_cn}
               </div>
               {card.isReversed !== undefined && (
                   <div className={`text-[8px] md:text-[9px] uppercase font-bold tracking-widest mt-0.5 scale-90 ${card.isReversed ? 'text-red-300' : 'text-emerald-300'}`}>
                      {card.isReversed ? '逆位' : '正位'}
                   </div>
               )}
             </div>
          </div>
        </div>
      </div>
      {label && (
        <span className={`text-[10px] md:text-xs font-medium text-purple-200 text-center uppercase tracking-wider bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/5 transition-opacity duration-500 max-w-[120px] ${revealed ? 'opacity-100' : 'opacity-80'}`}>
          {label}
        </span>
      )}
    </div>
  );
};

export const CardDetailModal = ({ card, onClose }: { card: TarotCard | null, onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'upright' | 'reversed'>('upright');

    useEffect(() => {
        if (card) {
            setActiveTab(card.isReversed ? 'reversed' : 'upright');
        }
    }, [card]);

    if (!card) return null;

    const education = getCardEducation(card.id);
    const detail = activeTab === 'upright' ? card.upright : card.reversed;
    const isUpright = activeTab === 'upright';

    const DetailSection = ({ icon, title, content, colorClass }: any) => (
        <div className={`p-4 rounded-xl border bg-white/5 border-white/10 hover:bg-white/10 transition-colors`}>
            <h4 className={`text-xs uppercase tracking-widest mb-2 flex items-center gap-2 ${colorClass}`}>
                <span>{icon}</span> {title}
            </h4>
            <p className="text-indigo-100/90 text-sm leading-relaxed whitespace-pre-wrap">
                {content || "暂无详细解读，请参考综合指引。"}
            </p>
        </div>
    );

    return (
        <div className={`fixed inset-0 z-[100] custom-scrollbar animate-fade-in md:flex md:items-center md:justify-center overflow-y-auto md:overflow-visible`}>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div 
                className={`
                    relative z-10 
                    min-h-full md:min-h-0
                    flex items-center justify-center 
                    p-4 md:p-0
                    md:w-full md:max-w-5xl md:h-auto
                `} 
                onClick={onClose}
            >
                <div 
                    className={`
                        relative w-full bg-indigo-950/90 border border-purple-500/30 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden
                        ${'md:max-h-[85vh]'}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                     <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-full transition-all backdrop-blur-sm">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                         </svg>
                     </button>

                     <div className="w-full md:w-2/5 bg-black/40 p-8 flex items-center justify-center shrink-0">
                         <div className={`relative w-48 h-72 md:w-64 md:h-96 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-transform duration-500 ${isUpright ? '' : 'rotate-180'}`}>
                             <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                         </div>
                     </div>

                     <div className={`
                        w-full md:w-3/5 p-6 md:p-8 flex flex-col bg-gradient-to-br from-transparent to-purple-900/20
                        ${'md:overflow-y-auto md:custom-scrollbar'}
                     `}>
                         <div className="mb-4 pt-2">
                             <h2 className="text-3xl md:text-4xl font-mystic text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
                                 {card.name_cn}
                             </h2>
                             <p className="text-indigo-400 font-serif italic text-lg">{card.name}</p>
                         </div>

                         <div className="flex flex-wrap gap-2 mb-6">
                             <Badge className="bg-indigo-600/30 text-indigo-200 border-indigo-400/30 px-3 py-1">
                                 {education.archetype}
                             </Badge>
                             <Badge className="bg-amber-600/30 text-amber-200 border-amber-400/30 px-3 py-1">
                                 {education.element}
                             </Badge>
                         </div>

                         <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/20 mb-6">
                             <h3 className="text-sm font-bold text-purple-200 mb-2 flex items-center gap-2">
                                 <span>📖</span> 牌面科普
                             </h3>
                             <p className="text-indigo-100/80 leading-relaxed text-xs">
                                 {education.description}
                             </p>
                         </div>

                         <div className="flex p-1 bg-white/5 rounded-lg border border-white/10 mb-6">
                            <button 
                                onClick={() => setActiveTab('upright')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-300 ${activeTab === 'upright' ? 'bg-emerald-600 text-white shadow-lg' : 'text-indigo-300 hover:bg-white/5'}`}
                            >
                                正位 (Upright)
                            </button>
                            <button 
                                onClick={() => setActiveTab('reversed')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-300 ${activeTab === 'reversed' ? 'bg-red-600 text-white shadow-lg' : 'text-indigo-300 hover:bg-white/5'}`}
                            >
                                逆位 (Reversed)
                            </button>
                         </div>

                         <div className="space-y-6 animate-fade-in pb-10">
                             <div className="flex flex-wrap gap-2">
                                {detail.keywords.map((kw, i) => (
                                    <span key={i} className={`text-xs px-2 py-1 rounded border ${isUpright ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-200' : 'bg-red-900/30 border-red-500/30 text-red-200'}`}>
                                        {kw}
                                    </span>
                                ))}
                             </div>

                             <div className={`p-5 rounded-xl border ${isUpright ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                                 <h4 className={`text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${isUpright ? 'text-emerald-300' : 'text-red-300'}`}>
                                     <span>🔮</span> 综合指引
                                 </h4>
                                 <p className={`font-medium leading-relaxed ${isUpright ? 'text-emerald-100' : 'text-red-100'}`}>
                                     {detail.general}
                                 </p>
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 <DetailSection icon="❤️" title="情感与关系" content={detail.love} colorClass="text-pink-300" />
                                 <DetailSection icon="💼" title="事业与财富" content={detail.career} colorClass="text-blue-300" />
                                 <DetailSection icon="🎓" title="学业与成长" content={detail.study} colorClass="text-cyan-300" />
                                 <DetailSection icon="🤝" title="人际与社交" content={detail.social} colorClass="text-orange-300" />
                                 <DetailSection icon="🏠" title="家庭与居住" content={detail.family} colorClass="text-yellow-300" />
                                 <DetailSection icon="🌿" title="健康与身心" content={detail.health} colorClass="text-green-300" />
                                 <DetailSection icon="🧘" title="内在与自我" content={detail.self} colorClass="text-purple-300" />
                                 <DetailSection icon="🌌" title="灵性与命运" content={detail.spirit} colorClass="text-indigo-300" />
                                 <DetailSection icon="⚔️" title="决策与行动" content={detail.action} colorClass="text-red-300" />
                                 <DetailSection icon="⏳" title="时间与趋势" content={detail.trend} colorClass="text-gray-300" />
                             </div>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

// --- Spread Layout Logic ---

const getPositionStyle = (layout: string, index: number, total: number): React.CSSProperties => {
    let style: React.CSSProperties = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    
    const getLinear = () => {
            const step = 100 / (total + 1);
            const x = step * (index + 1);
            const y = (total > 4 && index % 2 === 1) ? 60 : 40; 
            const top = total > 4 ? `${y}%` : '50%';
            return { left: `${x}%`, top: top, transform: 'translate(-50%, -50%)' };
    };

    switch (layout) {
        case 'single': return style;
        case 'linear': return getLinear();
        case 'triangle':
            if (index === 0) return { left: '50%', top: '30%', transform: 'translate(-50%, -50%)' };
            if (index === 1) return { left: '30%', top: '70%', transform: 'translate(-50%, -50%)' };
            if (index === 2) return { left: '70%', top: '70%', transform: 'translate(-50%, -50%)' };
            return getLinear();
        case 'square':
            if (index === 0) return { left: '35%', top: '35%', transform: 'translate(-50%, -50%)' };
            if (index === 1) return { left: '65%', top: '35%', transform: 'translate(-50%, -50%)' };
            if (index === 2) return { left: '35%', top: '65%', transform: 'translate(-50%, -50%)' };
            if (index === 3) return { left: '65%', top: '65%', transform: 'translate(-50%, -50%)' };
            return getLinear();
        case 'diamond':
            if (index === 0) return { left: '50%', top: '15%', transform: 'translate(-50%, -50%)' };
            if (index === 1) return { left: '15%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 2) return { left: '85%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 3) return { left: '50%', top: '85%', transform: 'translate(-50%, -50%)' };
            return getLinear();
        case 'cross':
            if (index === 0) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 1) return { left: '50%', top: '15%', transform: 'translate(-50%, -50%)' };
            if (index === 2) return { left: '15%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 3) return { left: '85%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 4) return { left: '50%', top: '85%', transform: 'translate(-50%, -50%)' };
            return getLinear();
        case 'hexagram':
                const angle = (index * 60 - 30) * (Math.PI / 180);
                const radius = 40; 
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);
                return { left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' };
        case 'two_columns':
                const col = index % 2;
                const row = Math.floor(index / 2);
                const rows = Math.ceil(total / 2);
                const rowStep = 80 / rows;
                return { left: col === 0 ? '25%' : '75%', top: `${15 + row * rowStep + (rowStep/2)}%`, transform: 'translate(-50%, -50%)' };
        case 'celtic_cross':
            if (index === 0) return { left: '32%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 1) return { left: '32%', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' };
            if (index === 2) return { left: '32%', top: '82%', transform: 'translate(-50%, -50%)' };
            if (index === 3) return { left: '12%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 4) return { left: '32%', top: '18%', transform: 'translate(-50%, -50%)' };
            if (index === 5) return { left: '52%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 6) return { left: '80%', top: '85%', transform: 'translate(-50%, -50%)' };
            if (index === 7) return { left: '80%', top: '65%', transform: 'translate(-50%, -50%)' };
            if (index === 8) return { left: '80%', top: '45%', transform: 'translate(-50%, -50%)' };
            if (index === 9) return { left: '80%', top: '25%', transform: 'translate(-50%, -50%)' };
            return getLinear();
        default:
            return getLinear();
    }
}

export const SpreadPreview = ({ spread }: { spread: SpreadDefinition }) => {
    return (
        <div className="relative w-24 h-24 bg-white/5 rounded-lg border border-white/10 mx-auto">
             {spread.positions.map((pos: any, index: number) => {
                 const style = getPositionStyle(spread.layout_type || 'linear', index, spread.cardCount);
                 return (
                     <div 
                        key={index}
                        className="absolute w-4 h-6 bg-purple-500/30 border border-purple-400/50 rounded-sm"
                        style={{
                            ...style,
                            transform: style.transform?.toString().replace('rotate(90deg)', '') + ' scale(0.8)',
                        }}
                     />
                 )
             })}
        </div>
    )
}

export const SpreadLayout = ({ spread, drawnCards = [], onDrop, isRevealed, onCardClick }: any) => {
    const isLargeSpread = spread.cardCount > 6;
    const cardSize = isLargeSpread ? 'xs' : 'sm';
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData("cardId");
        if (cardId && onDrop) {
            onDrop(parseInt(cardId), index);
        }
    };

    return (
        <div className="relative w-full h-[50vh] md:h-[600px] mx-auto select-none">
             {spread.positions.map((pos: any, index: number) => {
                 const style = getPositionStyle(spread.layout_type || 'linear', index, spread.cardCount);
                 const card = drawnCards[index];
                 
                 return (
                     <div 
                        key={index}
                        data-spread-slot={index}
                        className={`absolute flex flex-col items-center justify-center transition-all duration-500 ${!card ? 'animate-pulse-slow' : ''}`}
                        style={style}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                     >
                        {!card && (
                            <div className="absolute -top-6 text-[10px] text-indigo-300/70 whitespace-nowrap bg-black/40 px-2 py-0.5 rounded">
                                {index + 1}. {pos.name}
                            </div>
                        )}

                        {card ? (
                            <CardDisplay 
                                card={card} 
                                revealed={isRevealed || true} 
                                size={cardSize}
                                label={isRevealed ? pos.name : undefined}
                                onClick={() => onCardClick && onCardClick(card)}
                            />
                        ) : (
                            <div className={`
                                border-2 border-dashed border-white/20 rounded-lg bg-white/5 
                                flex items-center justify-center text-white/20
                                ${cardSize === 'xs' ? 'w-20 h-32 md:w-24 md:h-40' : 'w-24 h-40 md:w-32 md:h-52'}
                            `}>
                                <span className="text-xl font-bold">{index + 1}</span>
                            </div>
                        )}
                     </div>
                 )
             })}
        </div>
    )
}