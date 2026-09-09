#!/usr/bin/env node

// DeepSeek API 测试脚本 (ES Module 版本)
// 使用方法: node test-deepseek.js

import https from 'https';

const API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-1161b39e8e7240a29ef0a2cc475a109a';

if (!API_KEY) {
  console.error('请设置 DEEPSEEK_API_KEY 环境变量');
  process.exit(1);
}

const postData = JSON.stringify({
  model: "deepseek-chat",
  messages: [
    { role: "system", content: "You are a helpful assistant" },
    { role: "user", content: "Hello, please respond in Chinese." }
  ],
  stream: false
});

const options = {
  hostname: 'api.deepseek.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('正在测试 DeepSeek API...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200) {
        console.log('✅ API 调用成功!');
        console.log('响应内容:', response.choices[0].message.content);
      } else {
        console.log('❌ API 调用失败:', res.statusCode);
        console.log('错误详情:', response);
      }
    } catch (error) {
      console.error('❌ 解析响应失败:', error.message);
      console.log('原始响应:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 请求失败:', error.message);
});

req.write(postData);
req.end();