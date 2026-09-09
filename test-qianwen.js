#!/usr/bin/env node

// 千问 API 测试脚本 (ES Module 版本)
// 使用方法: node test-qianwen.js

import https from 'https';

const API_KEY = process.env.DASHSCOPE_API_KEY || 'sk-79d4e3cff2fa4402b780b5daec2adfae';

if (!API_KEY) {
  console.error('请设置 DASHSCOPE_API_KEY 环境变量');
  process.exit(1);
}

const postData = JSON.stringify({
  model: "qwen-max",
  input: {
    messages: [
      { role: "user", content: "你好，请用中文回复。" }
    ]
  },
  parameters: {
    result_format: "message"
  }
});

const options = {
  hostname: 'dashscope.aliyuncs.com',
  port: 443,
  path: '/api/v1/services/aigc/text-generation/generation',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('正在测试千问 API...');

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
        console.log('响应内容:', response.output.choices[0].message.content);
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