#!/usr/bin/env node

// Google Gemini API 测试脚本 (ES Module 版本)
// 使用方法: node test-gemini.js

import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

// Keep credentials on the machine; do not embed them in browser bundles.
for (const file of ['.env.local', '.env']) {
  if (existsSync(file)) loadEnvFile(file);
}
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

async function main() {
if (process.argv.includes('--check-network')) {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', { signal: AbortSignal.timeout(15000) });
    await response.arrayBuffer();
    console.log(`Google API 网络可达（HTTP ${response.status}）；本检查未发送 Key，不代表认证或生成成功。`);
    return;
  } catch {
    console.error('Google API 网络不可达或超时，请检查代理。');
    process.exitCode = 1;
    return;
  }
}

if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
  console.error('未配置 Gemini Key。请在 .env.local 中设置 GEMINI_API_KEY 后重新运行（不要把 Key 发到聊天中）。');
  process.exitCode = 1;
  return;
}

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
console.log(`正在测试 Google Gemini API：${model}…`);

try {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: '你好，请用中文回复一个简短的问候。' }] }] }),
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.json();
  if (!response.ok) {
    const hints = { 400: '检查 Key、请求参数及服务支持地区', 401: 'Key 无效或认证失败', 403: 'Key 权限不足或访问受限', 404: '模型不可用，请设置 GEMINI_MODEL', 429: '额度不足或请求过于频繁', 500: 'Google 服务暂时出错', 503: '模型服务暂时繁忙' };
    const detail = String(body.error?.message || '').split(API_KEY).join('[已隐藏]');
    throw new Error(`HTTP ${response.status}：${hints[response.status] || '请求失败'}。${detail}`);
  }
  const output = body.candidates?.[0]?.content?.parts?.filter(part => !part.thought).map(part => part.text || '').join('');
  if (output) {
    console.log('✅ API 调用成功!');
    console.log('响应内容:', output);
  } else {
    throw new Error(`API 没有返回文本：${body.promptFeedback?.blockReason || body.candidates?.[0]?.finishReason || '未知原因'}`);
  }
} catch (error) {
  const network = error.name === 'TimeoutError' || error.message === 'fetch failed';
  console.error('❌ API 调用失败:', network ? '无法连接 Google API 或连接超时，请检查本机网络及代理设置。' : error.message);
  process.exitCode = 1;
}
}
await main();
