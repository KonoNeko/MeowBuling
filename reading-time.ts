export interface ReadingClock { iso: string; timeZone: string }

export function browserClock(): ReadingClock {
  let timeZone = 'Asia/Shanghai';
  try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || timeZone; } catch {}
  return { iso: new Date().toISOString(), timeZone };
}

export function readingTime(clock?: Partial<ReadingClock>, now = new Date()) {
  let timeZone = clock?.timeZone || 'Asia/Shanghai';
  try { new Intl.DateTimeFormat('en', { timeZone }).format(now); } catch { timeZone = 'Asia/Shanghai'; }
  const candidate = new Date(clock?.iso || '');
  const date = Number.isFinite(candidate.getTime()) ? candidate : now;
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date);
  const value = (name: string) => Number(parts.find(part => part.type === name)?.value);
  const year = value('year'), month = value('month'), day = value('day');
  const next = new Date(Date.UTC(year, month, 1));
  const format = (date: Date) => `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
  const today = new Date(Date.UTC(year, month - 1, day));
  const monday = new Date(today); monday.setUTCDate(day - (today.getUTCDay() + 6) % 7);
  const sunday = new Date(monday); sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    timeZone, today: format(today), year, month,
    thisMonth: `${year}年${month}月`, nextMonth: `${next.getUTCFullYear()}年${next.getUTCMonth() + 1}月`,
    thisWeek: `${format(monday)}至${format(sunday)}`,
    thisMonthRange: `${format(new Date(Date.UTC(year, month - 1, 1)))}至${format(new Date(Date.UTC(year, month, 0)))}`,
    nextMonthRange: `${format(next)}至${format(new Date(Date.UTC(year, month + 1, 0)))}`,
  };
}

export const timeInstructions = '按时间参考解释今天、本周（周一至周日）、本月、下个月、今年。月份与年度指自然月和自然年；未来30天或未来一年指从今天起的滚动区间。用户明确写出的日期优先，不改为当前日期；已经过去的部分只作回顾，未来部分才作趋势分析。牌阵中的周期位置以用户所问时间为准。回答写清具体年月，不虚构确定发生时间。';
