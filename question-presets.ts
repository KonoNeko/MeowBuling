import { SPREADS } from './constants';
import { browserClock, readingTime } from './reading-time';

export interface QuestionPreset { text: string; spreadIds: string[] }
const q = (text: string, ...spreadIds: string[]): QuestionPreset => ({ text, spreadIds });
export function questionGroups(topic: string, time = readingTime(browserClock())): { title: string; questions: QuestionPreset[] }[] {
  const groups: Record<string, { title: string; questions: QuestionPreset[] }[]> = {
    love: [
      { title: '💕 暧昧与关系状态', questions: [q('对方现在如何看待我？接下来会主动推进这段关系吗？', 'how_they_feel_4'), q('这段暧昧有机会发展成正式关系吗？我该如何把握分寸？', 'situationship_5'), q('我们目前的关系卡在哪里？双方最真实的期待是什么？', 'rel_triangle', 'rel_block_5')] },
      { title: '🌹 单身、桃花与新关系', questions: [q('未来三到六个月，我有机会遇到适合交往的对象吗？关键机会在哪里？', 'love_future_3', 'love_manifest_4'), q('我目前脱单最大的阻碍是什么？怎样调整更容易遇见合适的人？', 'soulmate_6'), q('下一段感情更可能通过什么场景或方式开始？', 'love_future_3'), q('我该如何识别适合自己的对象，避免重复过去的模式？', 'soulmate_6', 'love_future_3')] },
      { title: '💔 复合、冲突与关系走向', questions: [q('我们还有复合的可能吗？重新开始前最需要解决什么？', 'reunion_4'), q('对方突然冷淡或断联的核心原因是什么？我该如何回应？', 'no_contact_5'), q('这段关系值得继续投入吗？我现在最该做出什么选择？', 'continue_or_end_4'), q('我们反复争吵的根源是什么？怎样才能真正改善相处？', 'rel_block_5'), q('我们适合走向长期承诺或婚姻吗？还缺少哪些现实基础？', 'marriage_5')] },
    ],
    career: [
      { title: '💼 工作发展与机会', questions: [q('我目前事业发展的主要瓶颈是什么？下一步突破口在哪里？', 'career_5'), q('这个工作机会适合我吗？最值得争取和警惕的地方是什么？', 'job_opportunity_4'), q('这次面试的结果倾向如何？我还能做哪些准备来提高机会？', 'interview_3')] },
      { title: '🔀 跳槽、转行与职业选择', questions: [q('我该继续留在现在的工作，还是准备跳槽？两条路分别会怎样发展？', 'career_change_5'), q('现在转行是合适的时机吗？我需要先补足什么能力？', 'career_change_5', 'career_5')] },
      { title: '🎓 学业与考试', questions: [q('这次考试通过的可能性如何？我最该优先补强哪一部分？', 'exam_outcome_3'), q('我学习效率不高的根本原因是什么？怎样制定更有效的计划？', 'study_insight_4')] },
      { title: '💰 金钱与副业', questions: [q('我目前财务压力的主要来源是什么？怎样逐步改善收支？', 'money_manifest_4'), q('这项副业值得投入吗？可能的收益、风险和第一步是什么？', 'risk_reward_3')] },
    ],
    decision: [
      { title: '⚖️ A/B 与多选项', questions: [q('保持现状和主动改变，哪个选择更适合我？各自的代价与机会是什么？', 'decision_ab'), q('A、B、C三个方案分别会怎样发展？哪个最符合我当前的优先级？', 'multi_option_4'), q('留下、跳槽或转行，哪条路更符合我现在的长期目标？', 'multi_option_4')] },
      { title: '🐾 要不要行动', questions: [q('这次邀约值得去吗？我需要提前留意什么？', 'go_or_not_4'), q('这个项目该继续投入，还是及时止损？判断依据是什么？', 'continue_or_end_4'), q('这次尝试的主要收益和风险是什么？我能如何降低风险？', 'risk_reward_3'), q('为了推进这件事，我现在最应该完成的第一步是什么？', 'mao_3')] },
    ],
    self: [
      { title: '🌿 情绪与内耗', questions: [q('我最近焦虑的核心原因是什么？当下最有效的缓解方式是什么？', 'anxiety_4'), q('我该怎样走出这段低谷，并重新建立稳定的生活节奏？', 'emotional_healing_5'), q('为什么我总在同一个问题上反复受困？真正的突破口在哪里？', 'root_5')] },
      { title: '🌙 认识自己与找回动力', questions: [q('我忽略了自己的哪一面？现在最需要诚实面对什么？', 'self_discovery_5'), q('我目前的生活状态哪里失衡？最应该先调整哪一项？', 'life_quadrants_4'), q('我真正想实现的愿望是什么？可以从哪一个具体行动开始？', 'manifest_4')] },
    ],
    fortune: [
      { title: '☀️ 今天与本周', questions: [q(`今天（${time.today}）最值得把握的机会和需要避开的坑是什么？`, 'today_challenge_3'), q(`今天（${time.today}）在人际与感情互动中要注意什么？`, 'daily_love_3'), q(`本周（${time.thisWeek}）的整体趋势如何？我应该把精力放在哪里？`, 'week_3')] },
      { title: '🗓️ 本月与下个月', questions: [q(`这个月（${time.thisMonth}）的整体趋势如何？最值得主动争取什么？`, 'month_4'), q(`下个月（${time.nextMonth}）可能迎来哪些机会与挑战？我该提前准备什么？`, 'month_4')] },
      { title: '✨ 年度展望', questions: [q(`${time.year}年我的整体趋势如何？事业、感情和财务各有什么重点？`, 'year_ahead_6'), q(`${time.year + 1}年最值得把握的机会和需要提前规避的挑战是什么？`, 'year_ahead_6')] },
    ],
    daily: [
      { title: '☀️ 今日指引', questions: [q(`今天（${time.today}）最值得把握的机会和需要避开的坑是什么？`, 'today_challenge_3'), q(`今天（${time.today}）我最应该把注意力放在哪里？`, 'daily_1'), q(`今天（${time.today}）适合主动推进哪件事？`, 'mao_3')] },
      { title: '🧭 当下行动', questions: [q('面对眼前这件事，我现在最应该完成的第一步是什么？', 'mao_3'), q('今天有什么信号值得我留意，又有什么行为应该暂缓？', 'today_challenge_3')] },
    ],
    money: [
      { title: '💰 收入与财富', questions: [q('我目前财务压力的主要来源是什么？怎样逐步改善收支？', 'money_manifest_4'), q('未来三个月我的财务重点是什么？应该守住什么、争取什么？', 'money_manifest_4', 'timeline_5')] },
      { title: '📦 副业与投资选择', questions: [q('这项副业值得投入吗？可能的收益、风险和第一步是什么？', 'risk_reward_3'), q('这笔投入的主要风险和潜在回报是什么？我该如何降低风险？', 'risk_reward_3')] },
    ],
    social: [
      { title: '🤝 人际关系', questions: [q('这段友谊或同事关系目前的真实状态是什么？', 'rel_triangle'), q('对方如何看待我？我该怎样改善彼此的互动？', 'how_they_feel_4')] },
      { title: '🧱 边界与冲突', questions: [q('这段关系反复产生摩擦的根源是什么？我该如何表达边界？', 'rel_block_5'), q('我该继续维持这段关系，还是适当拉开距离？', 'continue_or_end_4')] },
    ],
    home: [
      { title: '🏠 家庭关系', questions: [q('当前家庭关系中最需要被看见的问题是什么？', 'core_issue_5'), q('我该如何改善与家人的沟通，减少反复冲突？', 'rel_block_5')] },
      { title: '📦 搬家与生活环境', questions: [q('这次搬家或换居住环境适合我吗？最需要注意什么？', 'go_or_not_4'), q('当前居住环境对我的状态有什么影响？我该先调整哪里？', 'life_quadrants_4')] },
    ],
    spirit: [
      { title: '🌌 直觉与人生课题', questions: [q('我最近反复遇到的课题，正在提醒我成长什么？', 'path_of_fate_5'), q('我该如何分辨直觉、恐惧与外界期待？', 'self_discovery_5')] },
      { title: '🪞 内在连接', questions: [q('我目前最需要诚实面对的内在真相是什么？', 'truth_reveal_4'), q('如何更好地接纳自己的阴影与未完成课题？', 'shadow_work_6')] },
    ],
  };
  return groups[topic] || [];
}

export function spreadQuestions(id: string): string[] {
  const matches = ['love', 'career', 'decision', 'self', 'fortune'].flatMap(topic => questionGroups(topic).flatMap(group => group.questions)).filter(question => question.spreadIds.includes(id)).map(question => question.text);
  if (matches.length) return matches.slice(0, 3);
  const extra: Record<string, string> = {
    ppf_3: '这件事是怎样发展到现在的，接下来可能走向哪里？',
    truth_reveal_4: '这件事有哪些被我忽略的因素，会怎样影响我？',
    core_issue_5: '困住我的核心问题是什么，突破口在哪里？',
    swa_3: '面对这个目标，我有哪些优势和短板，该怎样发挥？',
    celtic_10: '关于这件复杂的事，我的处境、内外阻碍与可能结果是什么？',
    hex_6: '这件事的内外影响是什么，我可以怎样推动转机？',
    path_of_fate_5: '沿着我现在选择的方向，可能遇到什么课题与转折？',
    rel_triangle: '我们双方对这段关系的态度有什么不同，关系会怎样发展？',
    soulmate_6: '怎样的伴侣真正适合我，我需要为相遇做好什么准备？',
    love_hex: '我们这段感情目前的状态如何，有哪些影响与成长课题？',
    breakup_analysis_5: '这次分手背后有哪些关系模式，我可以从中学到什么？',
    long_term_rel_6: '我们对未来的期待一致吗，这段长期关系会怎样发展？',
    shadow_work_6: '我不愿面对的那部分自己如何影响我，我该怎样接纳它？',
    timeline_5: '从现在起未来三个月，这件事可能经历哪些阶段，我该如何行动？',
    daily_1: `今天（${readingTime(browserClock()).today}）最值得我关注的一件事是什么？`,
    career_manifest_4: '我真正想要怎样的事业成功，应该把精力放在哪里？',
  };
  if (extra[id]) return [extra[id]];
  const spread = SPREADS.find(item => item.id === id);
  return spread ? [`关于我正在经历的这件事，${spread.positions[0].name}如何？${spread.positions.at(-1)?.name}给我什么启发？`] : [];
}
