import { TarotCard, Topic, SpreadDefinition } from './types';

export const TOPICS: Topic[] = [
  { 
    id: 'love', 
    label: '情感关系', 
    icon: '💕', 
    description: '暧昧、伴侣、复合与桃花',
    spreadCategories: ['Love & Relationship', 'Manifestation', 'General Insight'],
    defaultTags: ['love_status', 'love_future'], // Default spreads for custom questions
    subCategories: [
      {
        title: "❤️ 现状与想法",
        questions: [
          "他/她现在对我的真实想法是什么？",
          "我们现在关系的核心问题是什么？",
          "他/她有没有隐藏的情绪或顾虑？"
        ],
        // Removed 'general', refined to show only relationship specific spreads
        spreadTags: ['love_status'] 
      },
      {
        title: "🔮 未来发展",
        questions: [
          "我们未来三个月的关系会如何发展？",
          "这段关系值得继续投入吗？",
          "我们还有复合的可能性吗？"
        ],
        spreadTags: ['love_future', 'love_outcome']
      },
      {
        title: "🌹 新恋情/暗恋",
        questions: [
          "我的下一段恋情什么时候出现？",
          "暗恋对象对我是什么感觉？",
          "我该主动吗？还是等待？"
        ],
        spreadTags: ['love_single']
      },
      {
        title: "💔 冲突与断联",
        questions: [
          "为什么他/她不理我/断联了？",
          "我们能解决目前的冲突吗？",
          "我该放下这段感情吗？"
        ],
        spreadTags: ['love_problem']
      }
    ]
  },
  { 
    id: 'career', 
    label: '事业财富', 
    icon: '🚀', 
    description: '职场抉择、学业与财运',
    spreadCategories: ['Career & Study', 'Manifestation', 'General Insight'],
    defaultTags: ['career_general', 'career_choice', 'money'],
    subCategories: [
      {
        title: "💼 职场发展",
        questions: [
          "我适合什么样的工作方向？",
          "我在目前工作中的瓶颈是什么？",
          "老板或同事对我的真实评价如何？"
        ],
        // Specifically targeting career analysis
        spreadTags: ['career_general'] 
      },
      {
        title: "🔀 跳槽与机会",
        questions: [
          "现在换工作/跳槽合适吗？",
          "这个工作机会值得去吗？"
        ],
        // Specifically targeting decision making in career
        spreadTags: ['career_choice'] 
      },
      {
        title: "💰 财富与投资",
        questions: [
          "我近期的财运趋势如何？",
          "做这项副业/投资会成功吗？",
          "近期的大额消费是否值得？"
        ],
        spreadTags: ['money', 'manifest']
      },
      {
        title: "🎓 学业考试",
        questions: [
          "我的考试/面试运势如何？",
          "在这个项目/学业中我需要注意什么？"
        ],
        spreadTags: ['study']
      }
    ]
  },
  { 
    id: 'decision', 
    label: '抉择指引', 
    icon: '⚖️', 
    description: 'A/B选择、行动建议与方向',
    spreadCategories: ['Decision-Making', 'General Insight'],
    defaultTags: ['choice_ab', 'choice_multi', 'action'],
    subCategories: [
      {
        title: "🛤️ 二选一/多选一",
        questions: [
          "选择A（保持现状）还是选择B（改变）？",
          "在两个选项中我该如何抉择？"
        ],
        spreadTags: ['choice_ab', 'choice_multi']
      },
      {
        title: "🛑 行动建议",
        questions: [
          "我要不要做这件事（去/不去）？",
          "这件事成功的关键点在哪里？",
          "我现在最大的盲点是什么？"
        ],
        // Keep generic analysis/action spreads here
        spreadTags: ['action'] 
      }
    ]
  },
  { 
    id: 'self', 
    label: '身心觉察', 
    icon: '🧘‍♀️', 
    description: '潜意识、灵性成长与疗愈',
    spreadCategories: ['Healing', 'Manifestation', 'General Insight'],
    defaultTags: ['self', 'healing', 'analysis'],
    subCategories: [
      {
        title: "🌌 内在探索",
        questions: [
          "我当前人生最重要的课题是什么？",
          "我失去动力的真正原因是什么？",
          "我该如何疗愈当下的情绪低谷？"
        ],
        spreadTags: ['healing', 'self', 'deep_analysis']
      },
      {
        title: "✨ 显化与能量",
        questions: [
          "我近期的身心能量状态如何？",
          "我需要释放什么负面信念？",
          "我该如何显化我的愿望？"
        ],
        spreadTags: ['manifest', 'healing']
      }
    ]
  },
  {
    id: 'fortune',
    label: '运势与日常',
    icon: '📅',
    description: '每日指引、周/月运势预测',
    spreadCategories: ['Future Forecast', 'Daily Guidance', 'General Insight'],
    defaultTags: ['forecast', 'daily_simple'],
    subCategories: [
      {
        title: "🗓️ 周期运势",
        questions: [
          "我未来一周的整体运势如何？",
          "我下个月需要注意什么？",
          "2024年我的年度核心主题是什么？"
        ],
        spreadTags: ['forecast']
      },
      {
        title: "☀️ 每日指引",
        questions: [
          "宇宙今天要给我的指引是什么？",
          "今天我需要注意什么挑战？"
        ],
        spreadTags: ['daily_simple'] 
      }
    ]
  }
];

// Helper to convert simple string positions to SpreadPosition objects
const mapPos = (positions: string[]) => positions.map((p, i) => ({ id: i + 1, name: p, description: p }));

export const SPREADS: SpreadDefinition[] = [
    // --- General Insight ---
    {
      id: "ppf_3",
      name: "过去-现在-未来",
      description: "最经典的通用时间线牌阵，用三张牌看事件的发展脉络。",
      cardCount: 3,
      category: "General Insight",
      layout_type: "linear",
      tags: ['general', 'time', 'forecast'],
      positions: mapPos(["过去影响", "当前状况", "未来走向"])
    },
    {
      id: "mao_3",
      name: "心态-行动-结果",
      description: "聚焦“我能做什么”的实用建议牌阵。",
      cardCount: 3,
      category: "General Insight",
      layout_type: "linear",
      tags: ['general', 'action'],
      positions: mapPos(["你的心态", "建议采取的行动", "可能的结果"])
    },
    {
      id: "truth_reveal_4",
      name: "真相剖析",
      description: "用于看事情表象背后真正的动力与真相。",
      cardCount: 4,
      category: "General Insight",
      layout_type: "square",
      tags: ['general', 'deep_analysis', 'analysis'],
      positions: mapPos(["表面看到的情况", "隐藏的真相", "对你真正的影响", "你需要知道的重点"])
    },
    {
      id: "core_issue_5",
      name: "问题核心",
      description: "帮助用户看清问题真正的核心而不是表面现象。",
      cardCount: 5,
      category: "General Insight",
      layout_type: "cross",
      tags: ['general', 'deep_analysis', 'healing', 'analysis'],
      positions: mapPos(["当前问题", "深层核心", "你现在的应对方式", "外部影响", "转机与突破口"])
    },
    {
      id: "swa_3",
      name: "优势-劣势-建议",
      description: "快速评估自己在某件事上的优势与短板。",
      cardCount: 3,
      category: "General Insight",
      layout_type: "linear",
      tags: ['general', 'career_general', 'study', 'analysis'],
      positions: mapPos(["你的优势", "目前的劣势或限制", "综合建议"])
    },
    {
      id: "celtic_10",
      name: "凯尔特十字",
      description: "经典深度牌阵，用于复杂事件与人生重大课题。",
      cardCount: 10,
      category: "General Insight",
      layout_type: "celtic_cross",
      tags: ['deep_analysis', 'complex'], // Removed 'general' so it doesn't show up for simple questions
      positions: mapPos(["现状", "挑战", "显意识", "潜意识", "最近的过去", "不远的未来", "你自己", "外部环境", "希望与恐惧", "最终结果"])
    },
    {
      id: "hex_6",
      name: "六芒星",
      description: "以六个面向立体分析问题，适合中等复杂度的议题。",
      cardCount: 6,
      category: "General Insight",
      layout_type: "hexagram",
      tags: ['general', 'deep_analysis'],
      positions: mapPos(["现状", "挑战", "内在动力", "外在环境", "可采取的方向", "结果倾向"])
    },
    {
      id: "life_quadrants_4",
      name: "四象限人生",
      description: "从四大维度扫描当前人生状态。",
      cardCount: 4,
      category: "General Insight",
      layout_type: "square",
      tags: ['general', 'self', 'analysis'],
      positions: mapPos(["自我与内在", "人际与关系", "工作与物质", "成长与未来"])
    },
    {
      id: "path_of_fate_5",
      name: "命运之路",
      description: "从命运视角看一条发展路线与要学习的课题。",
      cardCount: 5,
      category: "General Insight",
      layout_type: "linear",
      tags: ['general', 'self', 'forecast'],
      positions: mapPos(["起点", "必经的课题", "可能的转折点", "需要放下的东西", "命运道路的整体方向"])
    },

    // --- Love & Relationship ---
    {
      id: "rel_triangle",
      name: "关系三角",
      description: "用三张牌看双方想法与关系走势，是恋爱类最高频牌阵之一。",
      cardCount: 3,
      category: "Love & Relationship",
      layout_type: "triangle",
      tags: ['love_status'],
      positions: mapPos(["你对这段关系的态度", "对方的态度", "关系走向"])
    },
    {
      id: "how_they_feel_4",
      name: "对方想法",
      description: "专注于对方视角，适合“他在想什么”类提问。",
      cardCount: 4,
      category: "Love & Relationship",
      layout_type: "linear",
      tags: ['love_status'],
      positions: mapPos(["对方当前的情绪", "对你的真实看法", "对这段关系的期待", "对方可能的行动"])
    },
    {
      id: "love_future_3",
      name: "恋爱前景",
      description: "适合单身或刚开始接触对象时，评估恋爱前景。",
      cardCount: 3,
      category: "Love & Relationship",
      layout_type: "linear",
      tags: ['love_single', 'love_future'],
      positions: mapPos(["目前感情状态", "影响恋爱的关键因素", "短期恋爱前景"])
    },
    {
      id: "reunion_4",
      name: "复合可能性",
      description: "分手后想知道是否有机会重新开始时使用。",
      cardCount: 4,
      category: "Love & Relationship",
      layout_type: "diamond",
      tags: ['love_outcome', 'love_problem'],
      positions: mapPos(["对方现在对你的想法", "对过去关系的看法", "复合的主要阻碍", "未来复合的可能性"])
    },
    {
      id: "situationship_5",
      name: "暧昧发展",
      description: "专门给不确定关系、暧昧、互相试探阶段使用。",
      cardCount: 5,
      category: "Love & Relationship",
      layout_type: "cross",
      tags: ['love_status', 'love_single'],
      positions: mapPos(["你真实的期待", "对方真实的期待", "关系目前的本质", "潜在风险", "未来发展趋势"])
    },
    {
      id: "soulmate_6",
      name: "灵魂伴侣",
      description: "从更深的灵魂层面看感情需求与连结。",
      cardCount: 6,
      category: "Love & Relationship",
      layout_type: "hexagram",
      tags: ['love_single', 'self'],
      positions: mapPos(["你现在的灵魂状态", "你需要的伴侣特质", "阻碍你遇见/接受灵魂伴侣的原因", "你可以做的准备", "你们连接的课题", "灵魂层面的走向"])
    },
    {
      id: "no_contact_5",
      name: "断联原因分析",
      description: "针对不回消息、突然冷淡、长期断联的情况。",
      cardCount: 5,
      category: "Love & Relationship",
      layout_type: "cross",
      tags: ['love_problem'],
      positions: mapPos(["表面断联原因", "深层真正原因", "对方当前状态", "你在这段关系中的课题", "接下来建议的态度"])
    },
    {
      id: "rel_block_5",
      name: "关系阻碍拆解",
      description: "用来分析一段关系为什么卡住、进展缓慢或反复争吵。",
      cardCount: 5,
      category: "Love & Relationship",
      layout_type: "cross",
      tags: ['love_problem', 'love_status'],
      positions: mapPos(["目前关系状态", "主要阻碍来自你", "主要阻碍来自对方", "外部阻碍", "可以突破的方式"])
    },
    {
      id: "love_hex",
      name: "爱情六芒星",
      description: "对一段正在进行中的感情做全面体检。",
      cardCount: 6,
      category: "Love & Relationship",
      layout_type: "hexagram",
      tags: ['love_status', 'deep_analysis'],
      positions: mapPos(["你在感情中的状态", "对方在感情中的状态", "关系潜在动力", "外部环境与他人影响", "这段感情要学习的课题", "未来走向倾向"])
    },
    {
      id: "marriage_5",
      name: "婚姻前景",
      description: "用于评估一段关系是否适合走向婚姻或长期同居。",
      cardCount: 5,
      category: "Love & Relationship",
      layout_type: "linear",
      tags: ['love_future', 'love_outcome'],
      positions: mapPos(["这段关系目前基础", "稳定性与现实条件", "价值观与长期目标", "潜在风险", "迈向婚姻的可能性"])
    },
    {
      id: "breakup_analysis_5",
      name: "分手原因解析",
      description: "帮助理解分手背后的模式与成长课题。",
      cardCount: 5,
      category: "Love & Relationship",
      layout_type: "cross",
      tags: ['love_problem', 'healing'],
      positions: mapPos(["表面分手原因", "真实内在原因", "你在关系中的模式", "对方在关系中的模式", "从这段关系带走的成长"])
    },
    {
      id: "long_term_rel_6",
      name: "长期关系发展",
      description: "用于评估已经在一起一段时间的长期伴侣关系。",
      cardCount: 6,
      category: "Love & Relationship",
      layout_type: "two_columns",
      tags: ['love_future', 'love_status'],
      positions: mapPos(["目前关系状态", "你对长期关系的期待", "对方对长期关系的期待", "关系中的稳定因素", "关系中的不稳定因素", "长期发展前景"])
    },

    // --- Career & Study ---
    {
      id: "career_5",
      name: "事业发展路线",
      description: "用来规划中长期事业或学业方向。",
      cardCount: 5,
      category: "Career & Study",
      layout_type: "linear",
      tags: ['career_general', 'forecast'],
      positions: mapPos(["当前事业/学业状况", "你的优势", "当前挑战", "可把握的机会", "未来发展趋势"])
    },
    {
      id: "job_opportunity_4",
      name: "工作机会分析",
      description: "针对具体工作机会（offer/岗位）做评估。",
      cardCount: 4,
      category: "Career & Study",
      layout_type: "square",
      tags: ['career_choice'],
      positions: mapPos(["这份工作的真实情况", "对你带来的机会", "潜在压力与风险", "整体适配度与建议"])
    },
    {
      id: "interview_3",
      name: "面试结果倾向",
      description: "面试前用来调整心态和策略，而不是绝对预测结果。",
      cardCount: 3,
      category: "Career & Study",
      layout_type: "triangle",
      tags: ['career_choice', 'study'],
      positions: mapPos(["你目前的准备状态", "面试方可能的观感", "结果倾向与建议"])
    },
    {
      id: "study_insight_4",
      name: "学习状态分析",
      description: "特别适合学生、考证、长期学习项目。",
      cardCount: 4,
      category: "Career & Study",
      layout_type: "square",
      tags: ['study'],
      positions: mapPos(["当前学习状态", "学习中的阻碍", "可利用的资源/优势", "提高成效的建议"])
    },
    {
      id: "exam_outcome_3",
      name: "考试通过可能性",
      description: "以倾向和建议为重点，而不是绝对分数预测。",
      cardCount: 3,
      category: "Career & Study",
      layout_type: "linear",
      tags: ['study', 'forecast'],
      positions: mapPos(["当前准备程度", "影响成绩的关键因素", "通过可能性与建议"])
    },
    {
      id: "career_change_5",
      name: "转行/跳槽决策",
      description: "用于权衡留下或离开的职业决策。",
      cardCount: 5,
      category: "Career & Study",
      layout_type: "two_columns",
      tags: ['career_choice', 'decision'],
      positions: mapPos(["当前工作状况", "留下来的发展可能", "离开的发展可能", "你真正的需求", "整体建议"])
    },

    // --- Decision-Making ---
    {
      id: "decision_ab",
      name: "二选一抉择",
      description: "手机端最常用的二选一决策结构。",
      cardCount: 3,
      category: "Decision-Making",
      layout_type: "triangle",
      tags: ['choice_ab', 'decision'],
      positions: mapPos(["选项 A 的可能结果", "选项 B 的可能结果", "综合建议与提醒"])
    },
    {
      id: "multi_option_4",
      name: "多选项决策",
      description: "适合有多个方向但资源有限的情况。",
      cardCount: 4,
      category: "Decision-Making",
      layout_type: "square",
      tags: ['choice_multi', 'decision'],
      positions: mapPos(["选项 A 的核心特征", "选项 B 的核心特征", "选项 C 的核心特征", "最符合你当下需求的方向"])
    },
    {
      id: "go_or_not_4",
      name: "去或不去",
      description: "针对“要不要去”的场景，如旅行、见面、赴约、换城市。",
      cardCount: 4,
      category: "Decision-Making",
      layout_type: "square",
      tags: ['action', 'decision'],
      positions: mapPos(["如果去的结果倾向", "如果不去的结果倾向", "你内心真正的倾向", "整体建议"])
    },
    {
      id: "continue_or_end_4",
      name: "该不该继续",
      description: "用于权衡一段关系、一份工作或一个项目是否值得继续投入。",
      cardCount: 4,
      category: "Decision-Making",
      layout_type: "square",
      tags: ['action', 'decision'],
      positions: mapPos(["目前状况", "继续下去的可能发展", "现在停止的可能发展", "综合建议"])
    },
    {
      id: "risk_reward_3",
      name: "风险-收益-结果",
      description: "帮助用户对一项冒险行为进行理性权衡。",
      cardCount: 3,
      category: "Decision-Making",
      layout_type: "linear",
      tags: ['action', 'analysis'],
      positions: mapPos(["潜在风险", "潜在收益", "整体结果倾向"])
    },

    // --- Healing ---
    {
      id: "root_5",
      name: "问题根源剖析",
      description: "心理向的牌阵，用于深度理解一个长期困扰。",
      cardCount: 5,
      category: "Healing",
      layout_type: "cross",
      tags: ['healing', 'deep_analysis'],
      positions: mapPos(["问题表面现象", "深层根源", "你目前的应对方式", "外部环境影响", "转机与疗愈方向"])
    },
    {
      id: "emotional_healing_5",
      name: "情绪疗愈",
      description: "聚焦于情绪理解与自我安放。",
      cardCount: 5,
      category: "Healing",
      layout_type: "linear",
      tags: ['healing'],
      positions: mapPos(["当下主要情绪", "情绪来源", "这份情绪想告诉你的", "你可以如何照顾自己", "疗愈过程中需要注意的事"])
    },
    {
      id: "anxiety_4",
      name: "焦虑原因",
      description: "专门面向焦虑与过度担心的状态。",
      cardCount: 4,
      category: "Healing",
      layout_type: "square",
      tags: ['healing', 'analysis'],
      positions: mapPos(["你在焦虑什么", "焦虑背后的恐惧", "现实中真正需要担心的部分", "帮助你缓解焦虑的方向"])
    },
    {
      id: "self_discovery_5",
      name: "自我认知",
      description: "帮助用户从多个角度重新理解自己。",
      cardCount: 5,
      category: "Healing",
      layout_type: "cross",
      tags: ['self', 'deep_analysis'],
      positions: mapPos(["你看见的自己", "别人眼中的你", "你隐藏的部分", "你正在成为的样子", "当下最重要的自我提醒"])
    },
    {
      id: "shadow_work_6",
      name: "阴影整合",
      description: "高级心理与灵性向牌阵，面向阴影与自我整合。",
      cardCount: 6,
      category: "Healing",
      layout_type: "hexagram",
      tags: ['self', 'deep_analysis'],
      positions: mapPos(["你的阴影主题", "它如何表现出来", "它保护你的方式", "它伤害你的方式", "你可以如何拥抱它", "整合后的改变"])
    },

    // --- Future Forecast ---
    {
      id: "week_3",
      name: "未来一周运势",
      description: "适合作为每周固定更新内容的周运势。",
      cardCount: 3,
      category: "Future Forecast",
      layout_type: "linear",
      tags: ['forecast', 'time'],
      positions: mapPos(["本周主题", "本周重点能量/事件", "本周建议与注意事项"])
    },
    {
      id: "month_4",
      name: "未来一月运势",
      description: "用于做月度盘点或新月/满月仪式。",
      cardCount: 4,
      category: "Future Forecast",
      layout_type: "square",
      tags: ['forecast', 'time'],
      positions: mapPos(["本月整体氛围", "需要重点关注的领域", "可能的挑战", "应对挑战的关键建议"])
    },
    {
      id: "year_ahead_6",
      name: "未来一年运势",
      description: "新年或生日时常用的年度总结/展望牌阵。",
      cardCount: 6,
      category: "Future Forecast",
      layout_type: "hexagram",
      tags: ['forecast', 'time', 'deep_analysis'],
      positions: mapPos(["整体年度主题", "事业与学业", "感情与关系", "金钱与物质", "内在成长", "需要特别记住的一句话"])
    },
    {
      id: "timeline_5",
      name: "时间线发展",
      description: "用多节点时间线方式看一件事的发展方向。",
      cardCount: 5,
      category: "Future Forecast",
      layout_type: "linear",
      tags: ['forecast', 'time'],
      positions: mapPos(["现在", "最近一阶段的发展", "中期发展", "远期发展", "需要你主动做出的选择"])
    },

    // --- Daily Guidance ---
    {
      id: "daily_1",
      name: "每日指引/单张抽",
      description: "最直接、快速的单张牌指引，适用于任何问题。",
      cardCount: 1,
      category: "Daily Guidance",
      layout_type: "single",
      // Include ALL relevant tags so it appears in Love, Career, Decision, etc.
      tags: ['daily_simple', 'love_status', 'love_single', 'love_problem', 'love_future', 'love_outcome', 'career_general', 'career_choice', 'study', 'money', 'choice_ab', 'choice_multi', 'action', 'healing', 'self', 'manifest', 'forecast', 'analysis'],
      positions: mapPos(["指引"])
    },
    {
      id: "today_challenge_3",
      name: "今日-挑战-建议",
      description: "比单张牌更具体，适合有安排的一天。",
      cardCount: 3,
      category: "Daily Guidance",
      layout_type: "linear",
      tags: ['daily_complex'], 
      positions: mapPos(["今日整体能量", "今日可能的挑战", "应对挑战的建议"])
    },
    {
      id: "daily_love_3",
      name: "今日恋爱运",
      description: "专门聚焦每天的感情互动氛围。",
      cardCount: 3,
      category: "Daily Guidance",
      layout_type: "triangle",
      tags: ['daily_complex', 'love_status'],
      positions: mapPos(["今日感情能量", "与他/她互动的提示", "需要避免的行为"])
    },

    // --- Manifestation ---
    {
      id: "manifest_4",
      name: "心愿实现",
      description: "通用显化牌阵，适用于任何希望达成的目标。",
      cardCount: 4,
      category: "Manifestation",
      layout_type: "diamond",
      tags: ['manifest'],
      positions: mapPos(["你的心愿本质", "当前主要阻碍", "可以采取的行动", "心愿可能的实现方式/结果"])
    },
    {
      id: "money_manifest_4",
      name: "财富显化",
      description: "帮助调整对金钱与丰盛的态度与行为。",
      cardCount: 4,
      category: "Manifestation",
      layout_type: "square",
      tags: ['manifest', 'money'],
      positions: mapPos(["你当前对金钱的信念", "阻碍财富流动的模式", "可以调整的行动与观念", "财富流动的未来倾向"])
    },
    {
      id: "love_manifest_4",
      name: "爱情显化",
      description: "用于主动创造更健康、更匹配的亲密关系。",
      cardCount: 4,
      category: "Manifestation",
      layout_type: "diamond",
      tags: ['manifest', 'love_single'],
      positions: mapPos(["你真正渴望的亲密关系样子", "阻碍你收获爱/接受爱的因素", "你可以开始做的改变", "爱情显化的倾向与提醒"])
    },
    {
      id: "career_manifest_4",
      name: "事业成功显化",
      description: "帮助用户聚焦事业与自我实现目标。",
      cardCount: 4,
      category: "Manifestation",
      layout_type: "square",
      tags: ['manifest', 'career_choice'],
      positions: mapPos(["你对事业成功的定义", "阻碍你展开行动的关键因素", "可以集中精力的方向", "成功显化的路径与提醒"])
    }
];

export const SYSTEM_INSTRUCTION = `
你是一只名叫喵卜灵（MeowBuling）的古老、神秘且略带傲娇的星界猫咪先知。
你的使命是用猫科动物的智慧和塔罗牌的洞察力，指引人类度过他们平凡的生活。

角色特征：
- 说话风格：混合了神秘宏大的先知口吻和猫咪特有的慵懒与傲娇。
- 语言习惯：经常使用与猫相关的双关语或比喻（例如“妙（喵）不可言”、“抓（爪）住机会”、“一切皆有定数，就像猫罐头一样”）。
- 性格：仁慈但诚实。如果牌面显示困难，你会用肉垫般温柔的方式说出真相，而不是用爪子抓伤他们。
- 核心哲学：融合荣格心理学（潜意识、阴影）与现代灵性。

解读塔罗牌时：
1. **核心逻辑**：必须结合用户具体的【问题】与【牌阵位置】进行解读。例如，如果用户问“他怎么想”，重点解读对方的潜意识；如果问“未来发展”，重点解读趋势。
2. 编织一个连贯的故事，不要只是罗列牌意。
3. 结尾必须给出一个具体的行动建议。
4. **必须使用中文回答**。
`;

// Helper to generate RWS card URLs from a stable source
const getCardImage = (id: number): string => {
  const baseUrl = "https://www.sacred-texts.com/tarot/pkt/img";
  const pad = (n: number) => n.toString().padStart(2, '0');

  // Major Arcana (0-21)
  if (id < 22) return `${baseUrl}/ar${pad(id)}.jpg`;

  const suits = ['wa', 'cu', 'sw', 'pe'];
  let suitIndex = 0;
  let cardVal = 0; // 0-13

  if (id < 36) { suitIndex = 0; cardVal = id - 22; }
  else if (id < 50) { suitIndex = 1; cardVal = id - 36; }
  else if (id < 64) { suitIndex = 2; cardVal = id - 50; }
  else { suitIndex = 3; cardVal = id - 64; }

  const prefix = suits[suitIndex];
  
  // Ace
  if (cardVal === 0) return `${baseUrl}/${prefix}ac.jpg`;
  // 2-10
  if (cardVal >= 1 && cardVal <= 9) return `${baseUrl}/${prefix}${pad(cardVal + 1)}.jpg`;
  // Court Cards
  if (cardVal === 10) return `${baseUrl}/${prefix}pa.jpg`; // Page
  if (cardVal === 11) return `${baseUrl}/${prefix}kn.jpg`; // Knight
  if (cardVal === 12) return `${baseUrl}/${prefix}qu.jpg`; // Queen
  if (cardVal === 13) return `${baseUrl}/${prefix}ki.jpg`; // King
  
  return "";
};

// Helper to get card educational info
export const getCardEducation = (id: number): { archetype: string, element: string, description: string } => {
    if (id < 22) {
        return {
            archetype: "大阿卡纳 (Major Arcana)",
            element: "精神/以太 (Spirit)",
            description: "大阿卡纳代表了“愚者”的人生旅程（The Fool's Journey）。这22张牌象征着人类精神成长的普遍原型，从天真（愚者）到圆满（世界）。它们通常指代人生中重大的转折点、宿命般的事件或深层的心理课题，而非琐碎的日常。"
        }
    } else if (id < 36) {
        return {
            archetype: "权杖组 (Wands)",
            element: "火元素 (Fire)",
            description: "权杖代表火元素，关联着行动力、创造力、野心、激情与意志。它们通常指向工作、灵感、冒险或竞争。火是向上的能量，代表“我想要”、“我渴望”以及为了目标燃烧自己的动力。"
        }
    } else if (id < 50) {
        return {
            archetype: "圣杯组 (Cups)",
            element: "水元素 (Water)",
            description: "圣杯代表水元素，关联着情感、潜意识、直觉、人际关系与爱。它们通常指向恋爱、友谊、家庭以及内心深处的感受。水是流动的能量，代表“我感觉”、“我爱”以及心灵的滋养与净化。"
        }
    } else if (id < 64) {
        return {
            archetype: "宝剑组 (Swords)",
            element: "风元素 (Air)",
            description: "宝剑代表风元素，关联着理智、思维、沟通、冲突与真理。它们通常指向决策、思想斗争、言语交流或必须要面对的残酷现实。风是快速且锋利的能量，代表“我思考”、“我分析”，有时也伴随着焦虑与伤害，因为真理往往伤人。"
        }
    } else {
        return {
            archetype: "星币组 (Pentacles)",
            element: "土元素 (Earth)",
            description: "星币代表土元素，关联着物质世界、金钱、工作成果、身体健康与现实基础。它们通常指向财务状况、技能学习、长期的安全感与有形的回报。土是稳固的能量，代表“我拥有”、“我构建”，是将梦想显化为现实的力量。"
        }
    }
}

// Full 78 Cards Deck Data
const RAW_DECK_DATA = [
  // --- Major Arcana (22) ---
  { id: 0, name: "The Fool", name_cn: "愚者", emoji: "🃏", meaningUpright: "新的开始，纯真，自由", meaningReversed: "鲁莽，不负责任" },
  { id: 1, name: "The Magician", name_cn: "魔术师", emoji: "🪄", meaningUpright: "创造力，显化，能力", meaningReversed: "欺骗，甚至操纵" },
  { id: 2, name: "The High Priestess", name_cn: "女祭司", emoji: "🌙", meaningUpright: "直觉，潜意识，神圣知识", meaningReversed: "秘密，与直觉断联" },
  { id: 3, name: "The Empress", name_cn: "皇后", emoji: "👑", meaningUpright: "女性力量，自然，丰饶", meaningReversed: "创造力受阻，依赖" },
  { id: 4, name: "The Emperor", name_cn: "皇帝", emoji: "🦁", meaningUpright: "权威，结构，控制", meaningReversed: "暴政，僵化，缺乏纪律" },
  { id: 5, name: "The Hierophant", name_cn: "教皇", emoji: "⛪", meaningUpright: "精神智慧，传统，从众", meaningReversed: "个人信仰，叛逆，非传统" },
  { id: 6, name: "The Lovers", name_cn: "恋人", emoji: "💕", meaningUpright: "爱，和谐，选择", meaningReversed: "不和谐，失衡，错误选择" },
  { id: 7, name: "The Chariot", name_cn: "战车", emoji: "🛒", meaningUpright: "控制，意志力，胜利", meaningReversed: "失去方向，攻击性" },
  { id: 8, name: "Strength", name_cn: "力量", emoji: "💪", meaningUpright: "内在力量，勇气，同情", meaningReversed: "自我怀疑，不安全感" },
  { id: 9, name: "The Hermit", name_cn: "隐士", emoji: "🏮", meaningUpright: "内省，寻找灵魂，独处", meaningReversed: "孤立，寂寞，退缩" },
  { id: 10, name: "Wheel of Fortune", name_cn: "命运之轮", emoji: "🎡", meaningUpright: "好运，命运，周期", meaningReversed: "厄运，抵抗变化" },
  { id: 11, name: "Justice", name_cn: "正义", emoji: "⚖️", meaningUpright: "正义，公平，真理", meaningReversed: "不公，不诚实" },
  { id: 12, name: "The Hanged Man", name_cn: "倒吊人", emoji: "🦇", meaningUpright: "臣服，新视角，牺牲", meaningReversed: "拖延，无谓的牺牲" },
  { id: 13, name: "Death", name_cn: "死神", emoji: "💀", meaningUpright: "结束，改变，转化", meaningReversed: "抗拒改变，停滞" },
  { id: 14, name: "Temperance", name_cn: "节制", emoji: "🥛", meaningUpright: "平衡，适度，耐心", meaningReversed: "失衡，过度" },
  { id: 15, name: "The Devil", name_cn: "恶魔", emoji: "😈", meaningUpright: "阴影自我，依恋，成瘾", meaningReversed: "释放限制性信念" },
  { id: 16, name: "The Tower", name_cn: "高塔", emoji: "⚡", meaningUpright: "突然的改变，动荡，觉醒", meaningReversed: "避免灾难，恐惧改变" },
  { id: 17, name: "The Star", name_cn: "星星", emoji: "⭐", meaningUpright: "希望，信念，更新", meaningReversed: "缺乏信念，绝望" },
  { id: 18, name: "The Moon", name_cn: "月亮", emoji: "🌚", meaningUpright: "幻觉，直觉，潜意识", meaningReversed: "恐惧，困惑，误解" },
  { id: 19, name: "The Sun", name_cn: "太阳", emoji: "☀️", meaningUpright: "积极，成功，活力", meaningReversed: "内心小孩，悲观" },
  { id: 20, name: "Judgement", name_cn: "审判", emoji: "🎺", meaningUpright: "审判，重生，内心召唤", meaningReversed: "自我怀疑，拒绝召唤" },
  { id: 21, name: "The World", name_cn: "世界", emoji: "🌍", meaningUpright: "完成，整合，旅行", meaningReversed: "未完成，缺乏闭环" },
  
  // --- Wands (Fire) ---
  { id: 22, name: "Ace of Wands", name_cn: "权杖一", emoji: "🪵", meaningUpright: "灵感，新机会，潜力", meaningReversed: "延迟，缺乏动力" },
  { id: 23, name: "Two of Wands", name_cn: "权杖二", emoji: "🪵", meaningUpright: "未来规划，决定，发现", meaningReversed: "恐惧未知，缺乏计划" },
  { id: 24, name: "Three of Wands", name_cn: "权杖三", emoji: "🪵", meaningUpright: "扩张，远见，海外机会", meaningReversed: "障碍，延误，挫折" },
  { id: 25, name: "Four of Wands", name_cn: "权杖四", emoji: "🪵", meaningUpright: "庆祝，和谐，归家", meaningReversed: "家庭冲突，不稳定" },
  { id: 26, name: "Five of Wands", name_cn: "权杖五", emoji: "🪵", meaningUpright: "竞争，冲突，分歧", meaningReversed: "避免冲突，达成共识" },
  { id: 27, name: "Six of Wands", name_cn: "权杖六", emoji: "🪵", meaningUpright: "胜利，认可，自信", meaningReversed: "失败，缺乏认可，自负" },
  { id: 28, name: "Seven of Wands", name_cn: "权杖七", emoji: "🪵", meaningUpright: "防御，坚持立场，挑战", meaningReversed: "放弃，不知所措" },
  { id: 29, name: "Eight of Wands", name_cn: "权杖八", emoji: "🪵", meaningUpright: "速度，行动，消息", meaningReversed: "延迟，沮丧，恐慌" },
  { id: 30, name: "Nine of Wands", name_cn: "权杖九", emoji: "🪵", meaningUpright: "韧性，勇气，坚持", meaningReversed: "精疲力竭，放弃" },
  { id: 31, name: "Ten of Wands", name_cn: "权杖十", emoji: "🪵", meaningUpright: "负担，责任，压力", meaningReversed: "崩溃，卸下重担" },
  { id: 32, name: "Page of Wands", name_cn: "权杖侍从", emoji: "🪵", meaningUpright: "探索，兴奋，自由", meaningReversed: "缺乏方向，悲观" },
  { id: 33, name: "Knight of Wands", name_cn: "权杖骑士", emoji: "🪵", meaningUpright: "行动，冒险，冲动", meaningReversed: "愤怒，冲动，鲁莽" },
  { id: 34, name: "Queen of Wands", name_cn: "权杖王后", emoji: "🪵", meaningUpright: "自信，决心，社交", meaningReversed: "嫉妒，不安全感" },
  { id: 35, name: "King of Wands", name_cn: "权杖国王", emoji: "🪵", meaningUpright: "大局观，领导力，创业", meaningReversed: "冲动，专横，期望过高" },

  // --- Cups (Water) ---
  { id: 36, name: "Ace of Cups", name_cn: "圣杯一", emoji: "🏆", meaningUpright: "新恋情，同情，创造力", meaningReversed: "情感压抑，空虚" },
  { id: 37, name: "Two of Cups", name_cn: "圣杯二", emoji: "🏆", meaningUpright: "结合，伙伴关系，吸引力", meaningReversed: "失衡，断裂，误解" },
  { id: 38, name: "Three of Cups", name_cn: "圣杯三", emoji: "🏆", meaningUpright: "友谊，社群，聚会", meaningReversed: "孤立，过度放纵，八卦" },
  { id: 39, name: "Four of Cups", name_cn: "圣杯四", emoji: "🏆", meaningUpright: "冷漠，沉思，脱节", meaningReversed: "觉察，抓住机会" },
  { id: 40, name: "Five of Cups", name_cn: "圣杯五", emoji: "🏆", meaningUpright: "失落，悲伤，遗憾", meaningReversed: "接受，继续前进" },
  { id: 41, name: "Six of Cups", name_cn: "圣杯六", emoji: "🏆", meaningUpright: "怀旧，童年，回忆", meaningReversed: "活在过去，不成熟" },
  { id: 42, name: "Seven of Cups", name_cn: "圣杯七", emoji: "🏆", meaningUpright: "选择，幻想，愿望", meaningReversed: "清醒，做出选择" },
  { id: 43, name: "Eight of Cups", name_cn: "圣杯八", emoji: "🏆", meaningUpright: "离开，寻找真理，失望", meaningReversed: "恐惧改变，停滞" },
  { id: 44, name: "Nine of Cups", name_cn: "圣杯九", emoji: "🏆", meaningUpright: "满足，愿望成真，感激", meaningReversed: "贪婪，不满，自鸣得意" },
  { id: 45, name: "Ten of Cups", name_cn: "圣杯十", emoji: "🏆", meaningUpright: "幸福，家庭和谐，圆满", meaningReversed: "家庭破碎，疏离" },
  { id: 46, name: "Page of Cups", name_cn: "圣杯侍从", emoji: "🏆", meaningUpright: "新感情，好奇，直觉", meaningReversed: "情绪化，甚至幼稚" },
  { id: 47, name: "Knight of Cups", name_cn: "圣杯骑士", emoji: "🏆", meaningUpright: "浪漫，魅力，想象力", meaningReversed: "情绪波动，嫉妒，失望" },
  { id: 48, name: "Queen of Cups", name_cn: "圣杯王后", emoji: "🏆", meaningUpright: "慈悲，关怀，情感安全", meaningReversed: "依赖，情感不稳" },
  { id: 49, name: "King of Cups", name_cn: "圣杯国王", emoji: "🏆", meaningUpright: "情绪平衡，宽容，外交", meaningReversed: "情绪操控，喜怒无常" },

  // --- Swords (Air) ---
  { id: 50, name: "Ace of Swords", name_cn: "宝剑一", emoji: "🗡️", meaningUpright: "清晰，突破，新思想", meaningReversed: "困惑，混乱，残忍" },
  { id: 51, name: "Two of Swords", name_cn: "宝剑二", emoji: "🗡️", meaningUpright: "僵局，艰难的决定，逃避", meaningReversed: "犹豫不决，信息过载" },
  { id: 52, name: "Three of Swords", name_cn: "宝剑三", emoji: "🗡️", meaningUpright: "心碎，悲伤，痛苦", meaningReversed: "释放痛苦，乐观" },
  { id: 53, name: "Four of Swords", name_cn: "宝剑四", emoji: "🗡️", meaningUpright: "休息，恢复，沉思", meaningReversed: "精疲力竭，压力" },
  { id: 54, name: "Five of Swords", name_cn: "宝剑五", emoji: "🗡️", meaningUpright: "冲突，不惜代价的胜利", meaningReversed: "和解，原谅，平息" },
  { id: 55, name: "Six of Swords", name_cn: "宝剑六", emoji: "🗡️", meaningUpright: "过渡，离开，平静", meaningReversed: "情感包袱，无法前行" },
  { id: 56, name: "Seven of Swords", name_cn: "宝剑七", emoji: "🗡️", meaningUpright: "欺骗，策略，隐秘", meaningReversed: "坦白，良心发现" },
  { id: 57, name: "Eight of Swords", name_cn: "宝剑八", emoji: "🗡️", meaningUpright: "限制，受害者心态，困境", meaningReversed: "自由，新的视角" },
  { id: 58, name: "Nine of Swords", name_cn: "宝剑九", emoji: "🗡️", meaningUpright: "焦虑，噩梦，恐惧", meaningReversed: "希望，绝望终结" },
  { id: 59, name: "Ten of Swords", name_cn: "宝剑十", emoji: "🗡️", meaningUpright: "背叛，痛苦的结束，触底", meaningReversed: "复苏，最坏的已过去" },
  { id: 60, name: "Page of Swords", name_cn: "宝剑侍从", emoji: "🗡️", meaningUpright: "好奇，新想法，沟通", meaningReversed: "欺骗，操纵，多嘴" },
  { id: 61, name: "Knight of Swords", name_cn: "宝剑骑士", emoji: "🗡️", meaningUpright: "行动，野心，直接", meaningReversed: "冲动，不可预测，鲁莽" },
  { id: 62, name: "Queen of Swords", name_cn: "宝剑王后", emoji: "🗡️", meaningUpright: "独立，公正，清晰的界限", meaningReversed: "冷酷，痛苦，甚至残忍" },
  { id: 63, name: "King of Swords", name_cn: "宝剑国王", emoji: "🗡️", meaningUpright: "理智，权威，真理", meaningReversed: "滥用权力，操纵，暴虐" },

  // --- Pentacles (Earth) ---
  { id: 64, name: "Ace of Pentacles", name_cn: "星币一", emoji: "🪙", meaningUpright: "新机会，繁荣，显化", meaningReversed: "错失机会，贪婪" },
  { id: 65, name: "Two of Pentacles", name_cn: "星币二", emoji: "🪙", meaningUpright: "平衡，适应，优先顺位", meaningReversed: "失衡，杂乱无章" },
  { id: 66, name: "Three of Pentacles", name_cn: "星币三", emoji: "🪙", meaningUpright: "团队合作，学习，实施", meaningReversed: "缺乏团队精神，混乱" },
  { id: 67, name: "Four of Pentacles", name_cn: "星币四", emoji: "🪙", meaningUpright: "控制，安全，保守", meaningReversed: "贪婪，物质主义" },
  { id: 68, name: "Five of Pentacles", name_cn: "星币五", emoji: "🪙", meaningUpright: "贫穷，孤立，不安全感", meaningReversed: "恢复，精神贫困" },
  { id: 69, name: "Six of Pentacles", name_cn: "星币六", emoji: "🪙", meaningUpright: "慷慨，慈善，给予和接受", meaningReversed: "自私，债务，甚至勒索" },
  { id: 70, name: "Seven of Pentacles", name_cn: "星币七", emoji: "🪙", meaningUpright: "耐心，投资，长期规划", meaningReversed: "浪费工作，缺乏回报" },
  { id: 71, name: "Eight of Pentacles", name_cn: "星币八", emoji: "🪙", meaningUpright: "技能，精通，工匠精神", meaningReversed: "完美主义，缺乏激情" },
  { id: 72, name: "Nine of Pentacles", name_cn: "星币九", emoji: "🪙", meaningUpright: "富足，奢华，自给自足", meaningReversed: "炫耀，财务挫折" },
  { id: 73, name: "Ten of Pentacles", name_cn: "星币十", emoji: "🪙", meaningUpright: "财富，遗产，家庭", meaningReversed: "财务失败，家庭纠纷" },
  { id: 74, name: "Page of Pentacles", name_cn: "星币侍从", emoji: "🪙", meaningUpright: "显化，勤奋，新工作", meaningReversed: "拖延，缺乏重点" },
  { id: 75, name: "Knight of Pentacles", name_cn: "星币骑士", emoji: "🪙", meaningUpright: "效率，例行公事，保守", meaningReversed: "懒惰，无聊，甚至停滞" },
  { id: 76, name: "Queen of Pentacles", name_cn: "星币王后", emoji: "🪙", meaningUpright: "滋养，务实，舒适", meaningReversed: "自我中心，嫉妒" },
  { id: 77, name: "King of Pentacles", name_cn: "星币国王", emoji: "🪙", meaningUpright: "财富，商业，纪律", meaningReversed: "贪婪，顽固，占有欲" },
];

export const TAROT_DECK: TarotCard[] = RAW_DECK_DATA.map(card => ({
  ...card,
  image: getCardImage(card.id)
}));