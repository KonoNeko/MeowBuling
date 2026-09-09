import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readingTime } from '../reading-time';
import { questionGroups, spreadQuestions } from '../question-presets';
import { SPREADS } from '../constants';

test('device timezone controls calendar day and December rolls into next year', () => {
  const iso = '2026-12-31T20:00:00Z';
  const west = readingTime({ iso, timeZone: 'America/Los_Angeles' });
  const china = readingTime({ iso, timeZone: 'Asia/Shanghai' });
  assert.equal(west.today, '2026年12月31日');
  assert.equal(west.nextMonth, '2027年1月');
  assert.equal(china.today, '2027年1月1日');
  assert.equal(china.nextMonth, '2027年2月');
});
test('fallback uses China time and leap-year calendar boundaries', () => {
  const time = readingTime({ iso: 'invalid', timeZone: 'invalid' }, new Date('2028-02-28T20:00:00Z'));
  assert.equal(time.today, '2028年2月29日');
  assert.equal(time.timeZone, 'Asia/Shanghai');
  assert.equal(time.thisMonthRange, '2028年2月1日至2028年2月29日');
  assert.equal(time.thisWeek, '2028年2月28日至2028年3月5日');
  assert.equal(time.nextMonthRange, '2028年3月1日至2028年3月31日');
});
test('all curated questions map to existing spreads; forecast periods stay distinct', () => {
  const time = readingTime({ iso: '2030-12-15T12:00:00Z', timeZone: 'Asia/Shanghai' });
  for (const topic of ['love', 'career', 'decision', 'self', 'fortune']) {
    for (const question of questionGroups(topic, time).flatMap(group => group.questions)) {
      assert.ok(question.spreadIds.length);
      assert.ok(question.spreadIds.every(id => SPREADS.some(spread => spread.id === id)));
    }
  }
  const fortune = questionGroups('fortune', time).flatMap(group => group.questions);
  assert.deepEqual(fortune.find(q => q.text.includes('下个月'))?.spreadIds, ['month_4']);
  assert.ok(fortune.some(q => q.text.includes('2031年1月')));
  assert.ok(fortune.some(q => q.text.startsWith('2030年') && q.spreadIds[0] === 'year_ahead_6'));
  assert.deepEqual(questionGroups('love', time).flatMap(g => g.questions).find(q => q.text.includes('复合'))?.spreadIds, ['reunion_4']);
  for (const spread of SPREADS) assert.ok(spreadQuestions(spread.id).length);
});
