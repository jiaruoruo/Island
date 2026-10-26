import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chat } from '../src/ai/client';
import { cosine, embed } from '../src/ai/embed';
import { retrieveMemories } from '../src/ai/memory';
import { handleUserMessage } from '../src/services/chatService';
import { getStore } from '../src/store';

test('embed: 相似文本余弦相似度更高', async () => {
  const a = await embed('我们下个月周年纪念日');
  const b = await embed('我们的周年纪念日快到了');
  const c = await embed('今天天气不错想去跑步');
  assert.ok(cosine(a, b) > cosine(a, c), '相似文本应比无关文本得分更高');
});

test('chat mock: 识别纪念日并给出回复', async () => {
  const r = await chat({
    persona: 'sweet',
    history: [],
    memories: [],
    userText: '下个月是我们的周年纪念日',
  });
  assert.ok(r.reply.length > 0, '应返回 AI 回复');
  assert.ok(
    r.memoryWrites.some((w) => w.type === 'anniversary'),
    '应抽取到纪念日记忆',
  );
});

test('memory store: 增删查', async () => {
  const store = getStore();
  const mem = await store.addMemory({
    id: '',
    coupleId: 't1',
    type: 'preference',
    value: 'A 喜欢奶茶',
    embedding: await embed('奶茶'),
    confirmedBy: ['a'],
    createdAt: Date.now(),
  });
  assert.equal((await store.listMemories('t1')).length, 1);
  await store.deleteMemory(mem.id);
  assert.equal((await store.listMemories('t1')).length, 0);
});

test('handleUserMessage: 完整闭环（消息→AI→记忆）', async () => {
  const store = getStore();
  const cid = 't2_' + Date.now();
  await store.createUser({ id: 'a', openid: 'oa', nickname: 'A', adult: true, minorMode: false });
  await store.createCouple({
    id: cid,
    name: 't',
    memberA: 'a',
    memberB: null,
    persona: 'reliable',
    inviteCode: '12345678',
    createdAt: Date.now(),
  });
  const r = await handleUserMessage(cid, 'a', '我喜欢吃火锅');
  assert.ok(!('error' in r), '不应返回错误');
  assert.ok(r.octopusMessage, '应有 AI 回复');
  assert.ok(r.memoryWrites.length > 0, '应写入喜好记忆');
  assert.ok((await store.listMemories(cid)).length > 0, '记忆应落库');
});

test('retrieveMemories: 语义检索返回最相关', async () => {
  const store = getStore();
  const cid = 't3_' + Date.now();
  await store.addMemory({ id: '', coupleId: cid, type: 'preference', value: 'A 喜欢喝奶茶', embedding: await embed('奶茶'), confirmedBy: ['a'], createdAt: Date.now() });
  await store.addMemory({ id: '', coupleId: cid, type: 'wish', value: '想去海边旅行', embedding: await embed('海边旅行'), confirmedBy: ['a'], createdAt: Date.now() });
  const r = await retrieveMemories(cid, '海边');
  assert.equal(r[0].type, 'wish', '应优先召回海边相关记忆');
});
