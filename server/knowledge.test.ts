import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { KnowledgeStore, chunkText, tokens } from './knowledge';
import { interpretationSchema, readingInput, validateCardReadings } from './agent';

test('Chinese chunking keeps overlapping context and supports Chinese keywords', () => {
  const text = '情感关系中的界限和沟通。'.repeat(160);
  const chunks = chunkText(text);
  assert.ok(chunks.length > 1);
  assert.equal(chunks[0].slice(-100), chunks[1].slice(0, 100));
  assert.ok(chunks.every(c => c.length <= 700));
  assert.ok(tokens('愚者 正位 The Fool').includes('愚者'));
});

test('imports persist, deduplicate and disappear from retrieval after deletion', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'meowbuling-test-'));
  try {
    const store = await new KnowledgeStore(dir).load();
    const initial = store.status();
    assert.ok(initial.documents.length >= 156);
    const id = await store.add('紫晶猫测试笔记', '紫晶猫仪式：先写下三件能控制的小事，再选择一件今天完成。');
    assert.equal(await store.add('紫晶猫测试笔记', '紫晶猫仪式：先写下三件能控制的小事，再选择一件今天完成。'), id);
    assert.equal(store.status().documents.length, initial.documents.length + 1);
    assert.equal((await store.search('紫晶猫仪式')).sources[0].documentId, id);
    const loaded = await new KnowledgeStore(dir).load();
    assert.ok(loaded.status().documents.some(doc => doc.id === id));
    await loaded.remove(id);
    assert.ok(!(await loaded.search('紫晶猫仪式')).sources.some(source => source.documentId === id));
    const reloaded = await new KnowledgeStore(dir).load();
    assert.ok(!reloaded.status().documents.some(doc => doc.id === id));
    await assert.rejects(() => loaded.remove('card-0-upright'));
  } finally {
    assert.ok(path.resolve(dir).startsWith(path.resolve(tmpdir()) + path.sep + 'meowbuling-test-'));
    await rm(dir, { recursive: true });
  }
});

test('request and generation validation reject malformed data', () => {
  assert.equal(readingInput.safeParse({ question: 'test', topicLabel: 'daily', spreadId: 'daily_1', cards: [{ id: 999 }] }).success, false);
  assert.equal(interpretationSchema.safeParse({ mainTheme: 'incomplete' }).success, false);
});

test('reading styles default for old clients and per-card output cannot omit or swap positions', () => {
  const request = { question: '职业选择', topicLabel: '事业', spreadId: 'test', cards: [{ id: 0 }, { id: 1 }] };
  assert.equal(readingInput.parse(request).style, 'sharp');
  assert.equal(readingInput.parse({ ...request, style: 'gentle' }).style, 'gentle');
  assert.equal(readingInput.parse({ ...request, style: 'sharp' }).style, 'sharp');
  assert.equal(readingInput.safeParse({ ...request, style: 'unknown' }).success, false);
  const value = { mainTheme: '主题', fable: '猫咪寓言', detailedAnalysis: [{ title: '整体', content: '分析' }], advice: '行动', reflectionQuestions: ['问题'], outcome: '可能走向',
    cardReadings: request.cards.map((card, positionIndex) => ({ positionIndex, cardId: card.id, assessment: '好坏并存', interpretation: '结合位置和问题说明当前的阻碍，以及如何通过具体行动改变未来的走向，提醒留意现实中的反馈。', advice: '今天花十分钟写出第一步计划。' })) };
  assert.equal(validateCardReadings(value, request.cards).cardReadings.length, 2);
  assert.throws(() => validateCardReadings({ ...value, cardReadings: value.cardReadings.slice(0, 1) }, request.cards));
  assert.throws(() => validateCardReadings({ ...value, cardReadings: [...value.cardReadings].reverse() }, request.cards));
  assert.throws(() => validateCardReadings({ ...value, cardReadings: [value.cardReadings[0], value.cardReadings[0]] }, request.cards));
});
