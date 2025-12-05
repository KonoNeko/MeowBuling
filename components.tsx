import React from 'react';
import { SpreadDefinition, TarotCard, AppView } from './types';
import { getCardEducation } from './constants';

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

interface Particle {
    id: number;
    x: number;
    y: number;
    tx: number;
    ty: number;
    color: string;
    size: number;
    icon?: string;
}

export const EnergyLoading = () => {
    const [energy, setEnergy] = React.useState(0);
    const [isOvercharged, setIsOvercharged] = React.useState(false);
    const [particles, setParticles] = React.useState<Particle[]>([]);

    // Auto increment progress slowly to simulate connection
    React.useEffect(() => {
        const timer = setInterval(() => {
            setEnergy(prev => {
                if (prev >= 95) return prev; 
                return prev + 0.2;
            });
        }, 100);
        return () => clearInterval(timer);
    }, []);

    const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
        // Boost energy on click
        setEnergy(prev => Math.min(prev + 5, 100));

        // Get coordinates
        let clientX, clientY;
        if ('touches' in e) {
             clientX = e.touches[0].clientX;
             clientY = e.touches[0].clientY;
        } else {
             clientX = (e as React.MouseEvent).clientX;
             clientY = (e as React.MouseEvent).clientY;
        }
        
        // Trigger overcharge animation if full
        if (energy >= 95) {
            setIsOvercharged(true);
            setTimeout(() => setIsOvercharged(false), 200);
        }

        // Generate Explosion Particles
        const newParticles: Particle[] = [];
        const colors = ['#fcd34d', '#a78bfa', '#ffffff', '#f472b6', '#60a5fa']; 
        const starIcons = ['✨', '⭐', '✦', '·', '⭑'];
        const particleCount = 12 + Math.random() * 8; // Random count between 12-20

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 120; // Explosion radius
            const tx = Math.cos(angle) * speed;
            const ty = Math.sin(angle) * speed;
            const isIcon = Math.random() > 0.7; // 30% chance to be a star icon instead of dot
            
            newParticles.push({
                id: Date.now() + Math.random(),
                x: clientX,
                y: clientY,
                tx,
                ty,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: isIcon ? 12 + Math.random() * 10 : 4 + Math.random() * 6,
                icon: isIcon ? starIcons[Math.floor(Math.random() * starIcons.length)] : undefined
            });
        }
        
        setParticles(prev => [...prev, ...newParticles]);

        // Cleanup this batch of particles after animation
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
             {/* Background Stars/Particles */}
             <div className="absolute inset-0 pointer-events-none opacity-50">
                 <div className="absolute top-[20%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse"></div>
                 <div className="absolute top-[60%] right-[20%] w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                 <div className="absolute bottom-[30%] left-[40%] w-1 h-1 bg-blue-300 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                 <div className="absolute top-[10%] right-[40%] w-0.5 h-0.5 bg-yellow-200 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
                 <div className="absolute bottom-[20%] right-[10%] w-1 h-1 bg-pink-300 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
             </div>

            {/* Central Interactive Element */}
            <div className={`relative cursor-pointer transition-transform duration-100 mt-[-10vh] ${isOvercharged ? 'animate-shake' : 'active:scale-95'}`}>
                {/* Glow Effect */}
                <div 
                    className="absolute inset-0 bg-purple-600 rounded-full blur-[60px] transition-all duration-300"
                    style={{ 
                        opacity: 0.3 + (energy / 150),
                        transform: `scale(${1 + energy/100})`
                    }}
                ></div>
                
                {/* Icon */}
                <div className="relative z-10 text-8xl md:text-9xl animate-float filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                    🔮
                </div>
            </div>

            {/* Text & Progress */}
            <div className="mt-16 text-center space-y-6 relative z-10 px-8 w-full max-w-md pointer-events-none">
                 <h2 className="text-2xl md:text-3xl font-mystic text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 animate-pulse tracking-wide">
                    正在连接星界...
                </h2>
                <div className="space-y-3">
                    <p className="text-indigo-300 text-sm md:text-base font-medium animate-bounce">
                        {energy < 100 ? "👆 点击屏幕注入灵力" : "⚡ 能量充盈！正在破译..."}
                    </p>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-200 ease-out shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                            style={{ width: `${Math.min(energy, 100)}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-indigo-400/60 font-mono">{Math.floor(Math.min(energy, 100))}% 能量汇聚中</p>
                </div>
            </div>

            {/* Particle Explosions */}
            {particles.map(p => (
                <div 
                    key={p.id}
                    className="absolute rounded-full animate-particle-explode pointer-events-none flex items-center justify-center font-bold"
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
                        boxShadow: p.icon ? 'none' : `0 0 ${p.size}px ${p.color}`
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
            {/* Left: Back Button */}
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

            {/* Center: Title / Logo */}
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

            {/* Right: Spacer for balance */}
            <div className="w-20 flex justify-end"></div>
        </div>
    );
}

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
  const sizeClasses = size === "sm" ? "w-20 h-32 md:w-24 md:h-40" : "w-48 h-80"; 
  const displaySize = size === "xs" ? "w-16 h-24" : sizeClasses; 
  
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
          {/* Card Back - The Mystery */}
          <div 
            className="absolute w-full h-full bg-indigo-950 rounded-xl border border-purple-400/20 shadow-xl overflow-hidden flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
             {/* Back Pattern */}
             <div className="w-full h-full opacity-40 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
             <div className="absolute inset-2 border border-dashed border-purple-300/20 rounded-lg"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl md:text-3xl opacity-50 filter drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">🔮</span>
             </div>
          </div>

          {/* Card Front - The Real Card */}
          <div 
            className="absolute w-full h-full bg-slate-900 rounded-xl border-2 border-amber-500/30 overflow-hidden shadow-2xl"
            style={{ 
                backfaceVisibility: 'hidden', 
                transform: 'rotateY(180deg)' 
            }}
          >
             {/* Image Container - Rotates if reversed, independent of text */}
             <div className={`w-full h-full transition-transform duration-0 ${card.isReversed ? 'rotate-180' : ''}`}>
                 <img 
                   src={card.image} 
                   alt={card.name} 
                   className="w-full h-full object-cover"
                   loading="lazy"
                 />
             </div>
             
             {/* Text Overlay - Always at bottom, always upright, consistent format */}
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
    if (!card) return null;

    const education = getCardEducation(card.id);

    return (
        // Changed to allow scrolling the entire modal container
        <div className="fixed inset-0 z-[100] overflow-y-auto custom-scrollbar animate-fade-in">
            {/* Fixed Backdrop */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />
            
            {/* Layout Container - Click here to close */}
            <div 
                className="min-h-full flex items-center justify-center p-4 md:p-8 relative" 
                onClick={onClose}
            >
                {/* Modal Card - Stop propagation */}
                <div 
                    className="relative w-full max-w-4xl bg-indigo-950/90 border border-purple-500/30 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                     {/* Close Button - Floats top right */}
                     <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-full transition-all backdrop-blur-sm">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                         </svg>
                     </button>

                     {/* Left: Big Image */}
                     <div className="w-full md:w-1/2 bg-black/40 p-8 flex items-center justify-center relative shrink-0">
                         <div className={`relative w-48 h-72 md:w-80 md:h-[500px] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-transform duration-500 ${card.isReversed ? 'rotate-180' : ''}`}>
                             <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                         </div>
                         {/* Reversed Indicator */}
                         {card.isReversed && (
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 px-4 py-2 rounded-full border border-red-500/50 backdrop-blur-sm rotate-180">
                                 <span className="text-red-300 font-bold tracking-widest">逆位 REVERSED</span>
                             </div>
                         )}
                     </div>

                     {/* Right: Info - No internal scroll, flows naturally */}
                     <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col bg-gradient-to-br from-transparent to-purple-900/20">
                         <div className="mb-6 pt-2">
                             <h2 className="text-3xl md:text-4xl font-mystic text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
                                 {card.name_cn}
                             </h2>
                             <p className="text-indigo-400 font-serif italic text-lg">{card.name}</p>
                         </div>

                         <div className="space-y-6">
                             {/* Educational Badges */}
                             <div className="flex flex-wrap gap-2">
                                 <Badge className="bg-indigo-600/30 text-indigo-200 border-indigo-400/30 px-3 py-1">
                                     {education.archetype}
                                 </Badge>
                                 <Badge className="bg-amber-600/30 text-amber-200 border-amber-400/30 px-3 py-1">
                                     {education.element}
                                 </Badge>
                             </div>
                             
                             {/* Meanings */}
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 <div className={`p-4 rounded-xl border ${card.isReversed === true ? 'bg-white/5 border-white/10 opacity-50' : 'bg-emerald-900/30 border-emerald-500/30'}`}>
                                     <h4 className="text-xs uppercase tracking-widest mb-1 text-emerald-300">正位含义</h4>
                                     <p className="text-emerald-100 font-bold text-sm md:text-base">{card.meaningUpright}</p>
                                 </div>
                                 <div className={`p-4 rounded-xl border ${card.isReversed === false ? 'bg-white/5 border-white/10 opacity-50' : 'bg-red-900/30 border-red-500/30'}`}>
                                     <h4 className="text-xs uppercase tracking-widest mb-1 text-red-300">逆位含义</h4>
                                     <p className="text-red-100 font-bold text-sm md:text-base">{card.meaningReversed}</p>
                                 </div>
                             </div>

                             {/* Description */}
                             <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                 <h3 className="text-lg font-bold text-purple-200 mb-2 flex items-center gap-2">
                                     <span>📖</span> 牌面科普
                                 </h3>
                                 <p className="text-indigo-100/90 leading-relaxed text-sm md:text-base">
                                     {education.description}
                                 </p>
                             </div>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

// --- Spread Visuals ---

// Mini Card style for preview
const MiniCard = ({ style }: { style: React.CSSProperties }) => (
    <div className="absolute w-2 h-3 bg-purple-400/80 rounded-[1px] shadow-sm shadow-purple-500/50" style={style}></div>
);

// Container for preview
const Container = ({ children }: { children?: React.ReactNode }) => (
    <div className="relative w-16 h-16 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center shrink-0">
        {children}
    </div>
);

export const SpreadPreview = ({ spread }: { spread: SpreadDefinition }) => {
    const { layout_type, cardCount } = spread;

    // 1. Single
    if (layout_type === 'single' || cardCount === 1) {
        return (
            <Container>
                <MiniCard style={{ }} />
            </Container>
        )
    }

    // 2. Triangle / Pyramid
    if (layout_type === 'triangle') {
        return (
            <Container>
                <MiniCard style={{ top: '60%', left: '30%' }} />
                <MiniCard style={{ top: '60%', right: '30%' }} />
                <MiniCard style={{ top: '25%', left: '50%', transform: 'translateX(-50%)' }} />
            </Container>
        )
    }

    // 3. Square / Quadrant
    if (layout_type === 'square' || layout_type === 'quadrant') {
        return (
            <Container>
                 <MiniCard style={{ top: '25%', left: '25%' }} />
                 <MiniCard style={{ top: '25%', right: '25%' }} />
                 <MiniCard style={{ bottom: '25%', left: '25%' }} />
                 <MiniCard style={{ bottom: '25%', right: '25%' }} />
            </Container>
        )
    }

    // 4. Cross (5 cards)
    if (layout_type === 'cross' && cardCount === 5) {
        return (
             <Container>
                 <MiniCard style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }} />
                 <MiniCard style={{ top: '50%', left: '15%', transform: 'translateY(-50%)' }} />
                 <MiniCard style={{ top: '50%', right: '15%', transform: 'translateY(-50%)' }} />
                 <MiniCard style={{ top: '15%', left: '50%', transform: 'translateX(-50%)' }} />
                 <MiniCard style={{ bottom: '15%', left: '50%', transform: 'translateX(-50%)' }} />
             </Container>
        )
    }

    // 5. Diamond (4 cards)
    if (layout_type === 'diamond') {
        return (
             <Container>
                 <MiniCard style={{ top: '15%', left: '50%', transform: 'translateX(-50%)' }} />
                 <MiniCard style={{ top: '50%', left: '15%', transform: 'translateY(-50%)' }} />
                 <MiniCard style={{ top: '50%', right: '15%', transform: 'translateY(-50%)' }} />
                 <MiniCard style={{ bottom: '15%', left: '50%', transform: 'translateX(-50%)' }} />
             </Container>
        )
    }

    // 6. Celtic Cross
    if (layout_type === 'celtic_cross') {
         return (
             <Container>
                 {/* Cross */}
                 <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-8 h-8">
                    <MiniCard style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                    <div className="absolute w-3 h-0.5 bg-purple-300 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90"></div>
                    <MiniCard style={{ top: '0', left: '50%', transform: 'translateX(-50%)' }} />
                    <MiniCard style={{ bottom: '0', left: '50%', transform: 'translateX(-50%)' }} />
                    <MiniCard style={{ top: '50%', left: '0', transform: 'translateY(-50%)' }} />
                    <MiniCard style={{ top: '50%', right: '0', transform: 'translateY(-50%)' }} />
                 </div>
                 {/* Staff */}
                 <div className="absolute right-[15%] top-1/2 -translate-y-1/2 h-10 w-2 flex flex-col justify-between">
                     <div className="w-1.5 h-0.5 bg-purple-400/50"></div>
                     <div className="w-1.5 h-0.5 bg-purple-400/50"></div>
                     <div className="w-1.5 h-0.5 bg-purple-400/50"></div>
                     <div className="w-1.5 h-0.5 bg-purple-400/50"></div>
                 </div>
             </Container>
         )
    }
    
    // 7. Hexagram
    if (layout_type === 'hexagram') {
         return (
             <Container>
                 <MiniCard style={{ top: '5%', left: '50%', transform: 'translateX(-50%)' }} />
                 <MiniCard style={{ bottom: '5%', left: '50%', transform: 'translateX(-50%)' }} />
                 <MiniCard style={{ top: '25%', left: '10%' }} />
                 <MiniCard style={{ top: '25%', right: '10%' }} />
                 <MiniCard style={{ bottom: '25%', left: '10%' }} />
                 <MiniCard style={{ bottom: '25%', right: '10%' }} />
             </Container>
         )
    }

    // Default Linear or unknown
    return (
        <Container>
            <div className="flex gap-0.5 justify-center flex-wrap px-2">
                 {Array.from({length: Math.min(cardCount, 5)}).map((_,i) => (
                     <div key={i} className="w-1.5 h-2.5 bg-purple-400/60 rounded-[1px]"></div>
                 ))}
                 {cardCount > 5 && <span className="text-[6px] text-white">..</span>}
            </div>
        </Container>
    )

}

// --- Drag & Drop Spread Components ---

export const SpreadSlot = ({ 
    index, 
    positionName, 
    card, 
    onDrop, 
    isNext,
    isRevealed = true, // Default to true if not specified
    onCardClick
}: { 
    index: number, 
    positionName: string, 
    card?: TarotCard, 
    onDrop: (cardId: number, index: number) => void,
    isNext: boolean,
    isRevealed?: boolean,
    onCardClick?: (card: TarotCard) => void
}) => {
    const handleDragOver = (e: React.DragEvent) => {
        if (!card) {
            e.preventDefault(); // Allow drop only if empty
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const cardId = parseInt(e.dataTransfer.getData("cardId"));
        if (!isNaN(cardId)) {
            onDrop(cardId, index);
        }
    };
    
    // Only allow clicking if there is a card and it is revealed
    const handleClick = () => {
        if (card && isRevealed && onCardClick) {
            onCardClick(card);
        }
    }

    return (
        <div 
            className={`relative flex flex-col items-center gap-2 transition-all duration-300 ${isNext && !card ? 'scale-105' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {card ? (
                <div className="animate-fly-in">
                    <CardDisplay card={card} revealed={isRevealed} size="sm" label={positionName} onClick={handleClick} />
                </div>
            ) : (
                <div className={`
                    w-20 h-32 md:w-24 md:h-40 rounded-xl border-2 border-dashed flex items-center justify-center text-center p-2 transition-all
                    ${isNext ? 'border-purple-400 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse' : 'border-white/10 bg-white/5 opacity-50'}
                `}>
                    <span className="text-xs md:text-sm text-indigo-300/70">{positionName}</span>
                </div>
            )}
        </div>
    );
};

export const SpreadLayout = ({ 
    spread, 
    drawnCards, 
    onDrop,
    isRevealed = true,
    onCardClick
}: { 
    spread: SpreadDefinition, 
    drawnCards: TarotCard[], 
    onDrop?: (cardId: number, index: number) => void,
    isRevealed?: boolean,
    onCardClick?: (card: TarotCard) => void
}) => {
    
    // Safety check function for onDrop
    const handleDrop = (cardId: number, index: number) => {
        if (onDrop) onDrop(cardId, index);
    };

    // Helper to render a specific slot
    const renderSlot = (idx: number) => (
        <React.Fragment key={idx}>
            <SpreadSlot 
                index={idx}
                positionName={spread.positions[idx]?.name || `Pos ${idx+1}`}
                card={drawnCards[idx]}
                onDrop={handleDrop}
                isNext={drawnCards.length === idx} // Highlight the next available slot
                isRevealed={isRevealed}
                onCardClick={onCardClick}
            />
        </React.Fragment>
    );

    // --- Layout Geometries ---

    // 1. Celtic Cross (10 Cards)
    if (spread.layout_type === 'celtic_cross' && spread.cardCount === 10) {
        return (
            <div className="flex flex-col md:flex-row gap-8 items-center justify-center scale-90 md:scale-100">
                {/* Cross Section (Left) */}
                <div className="relative w-[300px] h-[300px] md:w-[350px] md:h-[400px]">
                    {/* 1. Center & 2. Crossing */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">{renderSlot(0)}</div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 rotate-90 opacity-90 pointer-events-none">{drawnCards[1] ? <CardDisplay card={drawnCards[1]} revealed={isRevealed} size="sm" /> : null}</div>
                    {/* Invisible Drop Target for Pos 2 needs to be handled carefully or just auto-filled. 
                        For simplicity in DnD, we might list Pos 2 slightly offset if empty, or just rely on the center slot logic.
                        Actually, let's place Pos 2 visually offset slightly if empty so it can be dropped onto. 
                    */}
                    {!drawnCards[1] && <div className="absolute top-1/2 left-1/2 translate-x-4 translate-y-4 z-20">{renderSlot(1)}</div>}

                    {/* 3. Bottom */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2">{renderSlot(2)}</div>
                    {/* 4. Left */}
                    <div className="absolute top-1/2 left-0 -translate-y-1/2">{renderSlot(3)}</div>
                    {/* 5. Top */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2">{renderSlot(4)}</div>
                    {/* 6. Right */}
                    <div className="absolute top-1/2 right-0 -translate-y-1/2">{renderSlot(5)}</div>
                </div>

                {/* Staff Section (Right) */}
                <div className="flex flex-col-reverse gap-2 md:gap-4">
                    {renderSlot(6)}
                    {renderSlot(7)}
                    {renderSlot(8)}
                    {renderSlot(9)}
                </div>
            </div>
        );
    }

    // 2. Hexagram (6 Cards)
    if (spread.layout_type === 'hexagram') {
        return (
            <div className="relative w-[320px] h-[320px] md:w-[400px] md:h-[400px] mx-auto scale-90 md:scale-100">
                <div className="absolute top-0 left-1/2 -translate-x-1/2">{renderSlot(0)}</div>
                <div className="absolute bottom-0 right-0">{renderSlot(1)}</div>
                <div className="absolute top-[25%] left-0">{renderSlot(2)}</div>
                <div className="absolute bottom-0 left-0">{renderSlot(3)}</div>
                <div className="absolute top-[25%] right-0">{renderSlot(4)}</div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2">{renderSlot(5)}</div>
                {/* Center visual connector lines could go here */}
            </div>
        );
    }

    // 3. Cross (5 Cards) - Used for Core Issue, etc.
    if (spread.layout_type === 'cross') {
        return (
            <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] mx-auto">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">{renderSlot(0)}</div>
                 <div className="absolute top-1/2 left-0 -translate-y-1/2">{renderSlot(1)}</div>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2">{renderSlot(2)}</div>
                 <div className="absolute top-1/2 right-0 -translate-y-1/2">{renderSlot(3)}</div>
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2">{renderSlot(4)}</div>
            </div>
        );
    }
    
    // 4. Triangle (3 Cards) - Pyramid Style
    if (spread.layout_type === 'triangle') {
        return (
            <div className="flex flex-col items-center gap-4">
                <div className="flex gap-8 md:gap-16">
                    {renderSlot(0)}
                    {renderSlot(1)}
                </div>
                <div>
                    {renderSlot(2)}
                </div>
            </div>
        )
    }

    // 5. Square / Quadrant (4 Cards)
    if (spread.layout_type === 'square' || spread.layout_type === 'quadrant') {
        return (
            <div className="grid grid-cols-2 gap-8 md:gap-12 mx-auto max-w-md">
                {spread.positions.map((_, i) => renderSlot(i))}
            </div>
        );
    }

    // 6. Two Columns
    if (spread.layout_type === 'two_columns') {
        return (
            <div className="flex justify-center gap-12 md:gap-24">
                <div className="flex flex-col gap-4">
                     {/* Assume even split */}
                     {spread.positions.filter((_,i) => i % 2 === 0).map((_, i) => renderSlot(i*2))}
                </div>
                <div className="flex flex-col gap-4 mt-8">
                     {spread.positions.filter((_,i) => i % 2 !== 0).map((_, i) => renderSlot(i*2+1))}
                </div>
            </div>
        )
    }
    
    // 7. Diamond (4 Cards)
    if (spread.layout_type === 'diamond') {
        return (
            <div className="relative w-[300px] h-[400px] mx-auto">
                <div className="absolute top-1/2 left-0 -translate-y-1/2">{renderSlot(0)}</div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2">{renderSlot(1)}</div>
                <div className="absolute top-1/2 right-0 -translate-y-1/2">{renderSlot(2)}</div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2">{renderSlot(3)}</div>
            </div>
        )
    }

    // Default: Linear Flex Row
    return (
        <div className="flex flex-wrap justify-center gap-2 md:gap-8 max-w-5xl mx-auto">
            {spread.positions.map((_, i) => renderSlot(i))}
        </div>
    );
};