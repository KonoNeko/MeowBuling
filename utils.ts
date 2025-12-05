import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION, SPREADS } from "./constants";
import { ReadingSession, AIInterpretation, TarotCard, SpreadDefinition } from "./types";

// --- Local Storage Helpers ---

const STORAGE_KEY = 'meowbuling_history';

export const saveReading = (reading: ReadingSession) => {
  const history = getHistory();
  // Limit history to 50 entries to save space
  const updatedHistory = [reading, ...history].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
};

export const updateReadingReflection = (id: string, reflection: string) => {
  const history = getHistory();
  const index = history.findIndex(r => r.id === id);
  if (index !== -1) {
    history[index].userReflection = reflection;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
};

export const getHistory = (): ReadingSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse history", e);
    return [];
  }
};

// --- AI Helpers ---

// Moved initialization inside the function to prevent white-screen crash on load
export const generateInterpretation = async (
  topicLabel: string,
  question: string,
  spreadId: string,
  cards: TarotCard[]
): Promise<AIInterpretation> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
      throw new Error("喵？能量连接中断（API Key 未配置）。请检查 Vercel 环境变量设置。");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const spreadDef = SPREADS.find(s => s.id === spreadId);
  
  let cardContext = "";
  cards.forEach((card, index) => {
    const positionInfo = spreadDef?.positions[index];
    const posName = positionInfo ? positionInfo.name : `位置 ${index + 1}`;
    const posDesc = positionInfo ? positionInfo.description : "";
    
    cardContext += `
    【位置 ${index + 1}】：${posName}
    - 含义定义：${posDesc}
    - 抽出的牌：${card.name_cn} (${card.name})
    - 正逆位：${card.isReversed ? '逆位 (Reversed) - 能量受阻或内在化' : '正位 (Upright) - 能量顺畅或外显'}
    - 牌面核心意象：${card.isReversed ? card.meaningReversed : card.meaningUpright}
    `;
  });

  const prompt = `
    用户咨询领域：${topicLabel}
    用户具体问题："${question}"
    
    使用的牌阵：${spreadDef?.name} (${spreadDef?.description})
    
    牌面详情：
    ${cardContext}
    
    请作为“喵卜灵”（一只智慧、神秘且略带傲娇的猫咪先知），对上述牌阵进行深度解读。
    
    **重要要求**：
    1. "mainTheme"：用一句话总结目前的整体能量场。
    2. "fable" (寓言故事)：**新增**。请创造一个简短优美的寓言故事或隐喻，来映射用户的现状。这是你作为先知的智慧结晶。
    3. "detailedAnalysis"：
       - 请根据牌阵逻辑进行分析。
       - **必须包含现实生活中的例子 (Real-life examples)**。不要只讲空泛的能量，要举例说明这种能量在工作/感情中具体长什么样。
    4. "advice"：
       - 必须给出 **具体的、可执行的行动建议 (Concrete Actions)**。不要只说“保持耐心”，要说“每天花5分钟冥想”或“在本周五之前发出那封邮件”。
       - 保持猫咪的口吻。
    5. "reflectionQuestions"：2个触动潜意识的问题。
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mainTheme: { type: Type.STRING, description: "整体能量总结" },
          fable: { type: Type.STRING, description: "一个简短的、富有哲理的寓言故事，隐喻用户当前处境" },
          detailedAnalysis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "解读段落标题" },
                content: { type: Type.STRING, description: "详细解读内容，必须包含现实例子" }
              }
            }
          },
          advice: { type: Type.STRING, description: "具体可执行的行动建议" },
          reflectionQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING, description: "反思问题" }
          }
        },
        required: ["mainTheme", "fable", "detailedAnalysis", "advice", "reflectionQuestions"]
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as AIInterpretation;
  }
  
  throw new Error("喵？星象被云层遮住了。（AI 没有响应）");
};