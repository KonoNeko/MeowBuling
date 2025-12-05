import React, { useState, useEffect, useRef } from 'react';
import { SpreadDefinition, TarotCard, AppView, ReadingSession } from './types';
import { getCardEducation, SYSTEM_INSTRUCTION } from './constants';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { base64ToUint8Array, arrayBufferToBase64, decodeAudioData, float32ToInt16 } from './utils';

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

// --- Digital Avatar (Live API) ---

export const DigitalAvatar = ({ context, onClose, minimized = false }: { context?: string, onClose?: () => void, minimized?: boolean }) => {
    const [connected, setConnected] = useState(false);
    const [speaking, setSpeaking] = useState(false); // Model is speaking
    const [listening, setListening] = useState(false); // Mic is active
    const [error, setError] = useState<string | null>(null);
    const [volume, setVolume] = useState(0);

    // Audio Context Refs
    const inputContextRef = useRef<AudioContext | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const outputNodeRef = useRef<GainNode | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    // Clean up function
    const cleanup = () => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
        }
        if (inputSourceRef.current) inputSourceRef.current.disconnect();
        if (inputContextRef.current) inputContextRef.current.close();
        if (outputContextRef.current) outputContextRef.current.close();
        
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        
        sessionPromiseRef.current = null;
        setConnected(false);
        setSpeaking(false);
        setListening(false);
    };

    useEffect(() => {
        return () => cleanup();
    }, []);

    const connect = async () => {
        setError(null);
        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API Key Missing");

            const ai = new GoogleGenAI({ apiKey });
            
            // 1. Setup Audio
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Input (16kHz required by model recommendation usually, but we handle via resampling logic)
            // Note: Standard context is 44.1 or 48kHz. We'll downsample in processor.
            inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputSourceRef.current = inputContextRef.current.createMediaStreamSource(stream);
            
            // Output (24kHz)
            outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputNodeRef.current = outputContextRef.current.createGain();
            outputNodeRef.current.connect(outputContextRef.current.destination);

            // 2. Establish Live Connection
            const config = {
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, // Kore is usually good for mystical
                    },
                    systemInstruction: `${SYSTEM_INSTRUCTION} \n\n (Special Instruction: You are currently chatting via voice. Keep responses concise, mysterious but friendly. Use short sentences. If there is context provided, use it: ${context || "User just started the chat."})`,
                },
            };

            const sessionPromise = ai.live.connect({
                ...config,
                callbacks: {
                    onopen: () => {
                        setConnected(true);
                        setListening(true);
                        
                        // Setup Audio Processor to stream data
                        if (!inputContextRef.current || !inputSourceRef.current) return;
                        
                        // Buffer size 4096 is good balance
                        const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            
                            // Visual Volume Feedback
                            let sum = 0;
                            for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
                            const avg = sum / inputData.length;
                            setVolume(avg * 100);

                            // Convert to 16-bit PCM for API
                            const pcmInt16 = float32ToInt16(inputData);
                            const base64Data = arrayBufferToBase64(pcmInt16.buffer);

                            sessionPromise.then(session => {
                                session.sendRealtimeInput({
                                    media: {
                                        mimeType: 'audio/pcm;rate=16000',
                                        data: base64Data
                                    }
                                });
                            });
                        };

                        inputSourceRef.current.connect(processor);
                        processor.connect(inputContextRef.current.destination); // destination is mute for script processor usually
                        processorRef.current = processor;
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio && outputContextRef.current && outputNodeRef.current) {
                            setSpeaking(true);
                            // Set visual volume for model speaking (simulated)
                            setVolume(Math.random() * 50 + 30);

                            const audioData = base64ToUint8Array(base64Audio);
                            const audioBuffer = await decodeAudioData(audioData, outputContextRef.current, 24000);
                            
                            // Scheduling
                            const ctx = outputContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNodeRef.current);
                            source.start(nextStartTimeRef.current);
                            
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);

                            source.onended = () => {
                                sourcesRef.current.delete(source);
                                if (sourcesRef.current.size === 0) {
                                    setSpeaking(false);
                                    setVolume(0);
                                }
                            };
                        }
                    },
                    onclose: () => {
                        setConnected(false);
                        cleanup();
                    },
                    onerror: (err) => {
                        console.error(err);
                        setError("连接中断");
                        cleanup();
                    }
                }
            });
            sessionPromiseRef.current = sessionPromise;

        } catch (e) {
            console.error(e);
            setError("麦克风或网络错误");
        }
    };

    // --- Render Logic ---

    // Minimized Floating Button Mode (For Result Page)
    if (minimized) {
        return (
            <div className="fixed bottom-20 right-4 z-50">
                 {/* The Avatar Bubble */}
                 <button 
                    onClick={() => connected ? cleanup() : connect()}
                    className={`relative w-16 h-16 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center border-2 
                        ${connected 
                            ? (speaking ? 'bg-purple-600 border-pink-400 scale-110' : 'bg-indigo-600 border-green-400 animate-pulse-glow') 
                            : 'bg-gray-800 border-white/20 hover:scale-105'
                        }`}
                 >
                     <span className={`text-3xl filter drop-shadow-md ${speaking ? 'animate-bounce' : ''}`}>🐱</span>
                     
                     {/* Status Badge */}
                     <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-4 w-4 ${connected ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                     </span>

                     {/* Visual Ring based on volume */}
                     {connected && (
                         <div 
                            className="absolute inset-0 rounded-full border-2 border-white/50 opacity-50 pointer-events-none"
                            style={{ transform: `scale(${1 + volume/50})` }}
                         />
                     )}
                 </button>
                 
                 {/* Error Tooltip */}
                 {error && (
                     <div className="absolute bottom-20 right-0 bg-red-500/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                         {error}
                     </div>
                 )}
                 
                 {/* Label */}
                 {!connected && (
                     <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 bg-black/60 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm pointer-events-none">
                         喵卜灵在线
                     </div>
                 )}
            </div>
        )
    }

    // Full Screen Mode
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 space-y-12 animate-fade-in relative z-20">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-mystic text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
                    星界通话
                </h2>
                <p className="text-indigo-300">与喵卜灵直接对话，倾听命运的回响</p>
            </div>

            {/* Avatar Circle */}
            <div className="relative group">
                 {/* Magic Glow */}
                 <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl transition-opacity duration-500 ${connected ? 'opacity-40' : 'opacity-10'}`}></div>
                 
                 <div 
                    className={`relative w-64 h-64 rounded-full bg-gradient-to-b from-indigo-900 to-black border-4 flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.3)] transition-all duration-300
                        ${connected 
                            ? (speaking ? 'border-pink-500 scale-105' : 'border-green-400') 
                            : 'border-white/10'
                        }`}
                 >
                     {/* Ripples when user speaks */}
                     {listening && !speaking && volume > 5 && (
                         <>
                            <div className="absolute inset-0 rounded-full border border-green-500/30 animate-ping" style={{ animationDuration: '2s' }}></div>
                            <div className="absolute inset-0 rounded-full border border-green-500/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                         </>
                     )}

                     {/* The Cat */}
                     <div className={`text-9xl transition-transform duration-200 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] ${speaking ? 'animate-bounce' : ''}`}
                          style={{ transform: `scale(${1 + Math.min(volume/100, 0.2)})` }}
                     >
                         🐱
                     </div>
                 </div>
            </div>

            {/* Status Text */}
            <div className="h-8 text-center">
                {error ? (
                    <span className="text-red-400 font-bold bg-red-900/30 px-4 py-1 rounded-full">{error}</span>
                ) : connected ? (
                    speaking ? (
                        <span className="text-pink-300 animate-pulse font-mystic tracking-widest">喵卜灵正在诉说...</span>
                    ) : (
                        <span className="text-green-300 animate-pulse font-mystic tracking-widest">正在倾听你的心声...</span>
                    )
                ) : (
                    <span className="text-white/40">点击下方按钮建立连接</span>
                )}
            </div>

            {/* Controls */}
            <div className="flex gap-6">
                {!connected ? (
                    <Button onClick={connect} className="w-48 text-lg py-4 shadow-[0_0_30px_rgba(147,51,234,0.4)]">
                        🔮 呼唤喵卜灵
                    </Button>
                ) : (
                    <Button onClick={cleanup} variant="secondary" className="w-48 border-red-500/50 text-red-300 hover:bg-red-900/20">
                        断开连接
                    </Button>
                )}
            </div>
            
            {onClose && (
                <button onClick={onClose} className="text-white/40 hover:text-white mt-8 text-sm underline">
                    返回
                </button>
            )}
        </div>
    );
}

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
    // Determine initial tab based on card state
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

    // Helper to render a card section
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
                    className="relative w-full max-w-5xl bg-indigo-950/90 border border-purple-500/30 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                     {/* Close Button - Floats top right */}
                     <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-full transition-all backdrop-blur-sm">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                         </svg>
                     </button>

                     {/* Left: Big Image */}
                     <div className="w-full md:w-2/5 bg-black/40 p-8 flex items-center justify-center relative shrink-0">
                         <div className={`relative w-48 h-72 md:w-64 md:h-96 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-transform duration-500 ${isUpright ? '' : 'rotate-180'}`}>
                             <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                         </div>
                     </div>

                     {/* Right: Info */}
                     <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col bg-gradient-to-br from-transparent to-purple-900/20 max-h-[85vh] md:max-h-auto overflow-y-auto custom-scrollbar">
                         {/* Header */}
                         <div className="mb-4 pt-2">
                             <h2 className="text-3xl md:text-4xl font-mystic text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
                                 {card.name_cn}
                             </h2>
                             <p className="text-indigo-400 font-serif italic text-lg">{card.name}</p>
                         </div>

                         {/* Badges */}
                         <div className="flex flex-wrap gap-2 mb-6">
                             <Badge className="bg-indigo-600/30 text-indigo-200 border-indigo-400/30 px-3 py-1">
                                 {education.archetype}
                             </Badge>
                             <Badge className="bg-amber-600/30 text-amber-200 border-amber-400/30 px-3 py-1">
                                 {education.element}
                             </Badge>
                         </div>

                         {/* Educational Description (Moved Up) */}
                         <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/20 mb-6">
                             <h3 className="text-sm font-bold text-purple-200 mb-2 flex items-center gap-2">
                                 <span>📖</span> 牌面科普
                             </h3>
                             <p className="text-indigo-100/80 leading-relaxed text-xs">
                                 {education.description}
                             </p>
                         </div>

                         {/* Tab Switcher - Removed sticky */}
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

                         {/* Dynamic Content Based on Tab */}
                         <div className="space-y-6 animate-fade-in pb-10">
                             {/* Keywords */}
                             <div className="flex flex-wrap gap-2">
                                {detail.keywords.map((kw, i) => (
                                    <span key={i} className={`text-xs px-2 py-1 rounded border ${isUpright ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-200' : 'bg-red-900/30 border-red-500/30 text-red-200'}`}>
                                        {kw}
                                    </span>
                                ))}
                             </div>

                             {/* Main Sections */}
                             <div className={`p-5 rounded-xl border ${isUpright ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                                 <h4 className={`text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${isUpright ? 'text-emerald-300' : 'text-red-300'}`}>
                                     <span>🔮</span> 综合指引
                                 </h4>
                                 <p className={`font-medium leading-relaxed ${isUpright ? 'text-emerald-100' : 'text-red-100'}`}>
                                     {detail.general}
                                 </p>
                             </div>

                             {/* Specific Dimensions Grid */}
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

// ... existing Spread layouts ...
const getPositionStyle = (layout: string, index: number, total: number): React.CSSProperties => {
    // Default center
    let style: React.CSSProperties = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    
    const getLinear = () => {
         const step = 100 / (total + 1);
         return { left: `${step * (index + 1)}%`, top: '50%', transform: 'translate(-50%, -50%)' };
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
            if (index === 0) return { left: '50%', top: '20%', transform: 'translate(-50%, -50%)' };
            if (index === 1) return { left: '20%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 2) return { left: '80%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 3) return { left: '50%', top: '80%', transform: 'translate(-50%, -50%)' };
            return getLinear();

        case 'cross':
            if (index === 0) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 1) return { left: '50%', top: '20%', transform: 'translate(-50%, -50%)' };
            if (index === 2) return { left: '20%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 3) return { left: '80%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 4) return { left: '50%', top: '80%', transform: 'translate(-50%, -50%)' };
            return getLinear();

        case 'hexagram':
             const angle = (index * 60 - 30) * (Math.PI / 180);
             const radius = 35; 
             const x = 50 + radius * Math.cos(angle);
             const y = 50 + radius * Math.sin(angle);
             return { left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' };

        case 'two_columns':
             const col = index % 2;
             const row = Math.floor(index / 2);
             const rows = Math.ceil(total / 2);
             const rowStep = 80 / rows;
             return { 
                 left: col === 0 ? '35%' : '65%', 
                 top: `${15 + row * rowStep + (rowStep/2)}%`, 
                 transform: 'translate(-50%, -50%)' 
             };

        case 'celtic_cross':
            if (index === 0) return { left: '35%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 1) return { left: '35%', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' };
            if (index === 2) return { left: '35%', top: '80%', transform: 'translate(-50%, -50%)' };
            if (index === 3) return { left: '15%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 4) return { left: '35%', top: '20%', transform: 'translate(-50%, -50%)' };
            if (index === 5) return { left: '55%', top: '50%', transform: 'translate(-50%, -50%)' };
            if (index === 6) return { left: '80%', top: '85%', transform: 'translate(-50%, -50%)' };
            if (index === 7) return { left: '80%', top: '65%', transform: 'translate(-50%, -50%)' };
            if (index === 8) return { left: '80%', top: '45%', transform: 'translate(-50%, -50%)' };
            if (index === 9) return { left: '80%', top: '25%', transform: 'translate(-50%, -50%)' };
            return getLinear();

        default:
            return getLinear();
    }
}

export const SpreadLayout = ({ spread, drawnCards = [], onDrop, isRevealed, onCardClick }: any) => {
    const isLargeSpread = spread.cardCount > 6;
    const size = isLargeSpread ? 'xs' : 'sm'; 

    return (
        <div className="relative w-full aspect-square md:aspect-[4/3] max-w-2xl mx-auto rounded-3xl border-2 border-dashed border-white/5 bg-white/5">
            {spread.positions.map((pos: any, index: number) => {
                const card = drawnCards[index];
                const style = getPositionStyle(spread.layout_type || 'linear', index, spread.cardCount);
                
                return (
                    <div 
                        key={pos.id}
                        className="absolute transition-all duration-500"
                        style={style}
                        onClick={() => !card && onDrop && onDrop(null, index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const cardId = e.dataTransfer.getData("cardId");
                            if (cardId && onDrop && !card) {
                                onDrop(parseInt(cardId), index);
                            }
                        }}
                    >
                        {!card && (
                            <div className={`
                                ${isLargeSpread ? 'w-16 h-24' : 'w-20 h-32 md:w-24 md:h-40'} 
                                rounded-lg border-2 border-dashed border-white/20 bg-white/5 
                                flex flex-col items-center justify-center text-center p-1
                                hover:border-purple-400/50 transition-colors
                            `}>
                                <span className="text-white/30 font-bold mb-1">{index + 1}</span>
                                <span className="text-[8px] text-white/30 leading-tight">{pos.name}</span>
                            </div>
                        )}

                        {card && (
                            <div className="animate-fade-in-up">
                                <CardDisplay 
                                    card={card} 
                                    revealed={isRevealed} 
                                    size={size}
                                    label={isRevealed ? undefined : `${index + 1}. ${pos.name}`}
                                    onClick={() => onCardClick && onCardClick(card)}
                                />
                                {isRevealed && (
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/50 px-2 rounded text-[10px] text-white z-50">
                                        {pos.name}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    );
};

export const SpreadPreview = ({ spread }: any) => {
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