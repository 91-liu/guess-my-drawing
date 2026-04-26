/**
 * OpenAI API 配置
 */

import OpenAI from 'openai';

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// 缓存配置
const CACHE_TTL = 3600000; // 1小时（毫秒）
const wordCache = new Map();

/**
 * 使用 OpenAI 生成词汇
 * @param {number} count - 词汇数量
 * @returns {Promise<string[]>} 生成的词汇数组
 */
export async function generateWordsWithAI(count = 20) {
  // 如果 API key 未配置，返回 null
  if (!process.env.OPENAI_API_KEY) {
    console.log('[OpenAI] API key not configured, using predefined words');
    return null;
  }

  // 检查缓存
  const cacheKey = `words_${count}`;
  const cached = wordCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[OpenAI] Using cached words');
    return cached.words;
  }

  try {
    console.log(`[OpenAI] Generating ${count} words...`);

    const prompt = `请生成${count}个适合绘画猜词游戏的中文词汇，要求：
1. 词汇应为常见的名词，易于通过点线绘画表达
2. 每个词汇2-4个字
3. 词汇之间不重复，不相似
4. 直接输出词汇列表，每行一个，不要编号和其他解释

示例：
太阳
月亮
房子
汽车`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一个中文词汇生成助手，专门为绘画猜词游戏生成合适的词汇。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI response is empty');
    }

    // 解析返回的词汇
    const words = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length >= 2 && line.length <= 4)
      .slice(0, count);

    console.log(`[OpenAI] Generated ${words.length} words:`, words);

    // 存入缓存
    wordCache.set(cacheKey, {
      words,
      timestamp: Date.now(),
    });

    return words;
  } catch (error) {
    console.error('[OpenAI] Generation failed:', error.message);
    return null;
  }
}

/**
 * 清除缓存
 */
export function clearCache() {
  wordCache.clear();
  console.log('[OpenAI] Cache cleared');
}
