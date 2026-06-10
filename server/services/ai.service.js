const ETHICS_STATEMENT =
  '\n\n---\n*此报告完全基于你日记的匿名化摘要生成，旨在提供自我反思的视角。如果情绪问题持续困扰，请务必寻求专业心理咨询师或医生的帮助。*';

// ========== Core AI call ==========

async function callAI(systemPrompt, userContent, maxTokens = 4096) {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({
    baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  });
  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    model: process.env.AI_MODEL || 'deepseek-chat',
    stream: false,
    temperature: 0.7,
    max_tokens: maxTokens,
  });
  return completion.choices[0].message.content || '';
}

// ========== Stats computation ==========

function computeStats(entries) {
  const avgV = entries.reduce((s, e) => s + e.valence, 0) / entries.length;
  const avgA = entries.reduce((s, e) => s + e.arousal, 0) / entries.length;
  const posCount = entries.filter(e => e.valence > 0).length;
  const negCount = entries.filter(e => e.valence < 0).length;
  const neuCount = entries.filter(e => e.valence === 0).length;
  const days = new Set(entries.map(e => e.date)).size;
  return { avgV: avgV.toFixed(1), avgA: avgA.toFixed(1), posCount, negCount, neuCount, days, total: entries.length };
}

function computeDailyAggregates(entries) {
  const map = {};
  entries.forEach(e => {
    if (!map[e.date]) map[e.date] = { sumV: 0, sumA: 0, count: 0, best: null, worst: null };
    const d = map[e.date];
    d.sumV += e.valence;
    d.sumA += e.arousal;
    d.count++;
    d.best = !d.best || e.valence > d.best.valence ? e : d.best;
    d.worst = !d.worst || e.valence < d.worst.valence ? e : d.worst;
  });
  return Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, d]) => ({
      date,
      avgV: (d.sumV / d.count).toFixed(1),
      avgA: (d.sumA / d.count).toFixed(1),
      count: d.count,
      bestEntry: d.best,
      worstEntry: d.worst,
    }));
}

function computeWeeklyAggregates(entries) {
  const map = {};
  entries.forEach(e => {
    const d = new Date(e.date);
    const monday = new Date(d);
    monday.setDate(d.getDate() - d.getDay() + 1);
    const week = monday.toISOString().split('T')[0];
    if (!map[week]) map[week] = { sumV: 0, sumA: 0, count: 0, days: new Set() };
    map[week].sumV += e.valence;
    map[week].sumA += e.arousal;
    map[week].count++;
    map[week].days.add(e.date);
  });
  return Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, w]) => ({
      week,
      avgV: (w.sumV / w.count).toFixed(1),
      avgA: (w.sumA / w.count).toFixed(1),
      count: w.count,
      days: w.days.size,
    }));
}

// ========== Formatters (tiered truncation) ==========

function formatFull(entries) {
  return entries
    .map(e => `${e.date} ${e.time}: ${e.thought || '(无文字)'} (效价:${e.valence} 唤醒度:${e.arousal})`)
    .join('\n');
}

function formatDailyDigest(entries) {
  const daily = computeDailyAggregates(entries);
  const lines = ['## 每日统计'];
  daily.forEach(d => {
    lines.push(`${d.date} | 均效价${d.avgV} | 均唤醒${d.avgA} | ${d.count}条`);
  });

  // Top 5 most emotionally intense entries (by absolute valence)
  const extreme = [...entries]
    .sort((a, b) => Math.abs(b.valence) - Math.abs(a.valence))
    .slice(0, 5);

  if (extreme.length) {
    lines.push('\n## 最具代表性的日记（按情绪强度）');
    extreme.forEach(e => {
      lines.push(`${e.date} ${e.time}: ${e.thought || '(无文字)'} (效价:${e.valence} 唤醒度:${e.arousal})`);
    });
  }
  return lines.join('\n');
}

function formatWeeklyDigest(entries) {
  const weekly = computeWeeklyAggregates(entries);
  const lines = ['## 每周统计'];
  weekly.forEach(w => {
    lines.push(`周${w.week} | 均效价${w.avgV} | 均唤醒${w.avgA} | ${w.count}条 | ${w.days}天`);
  });

  // Top 10 most emotionally significant entries
  const extreme = [...entries]
    .sort((a, b) => Math.abs(b.valence) - Math.abs(a.valence))
    .slice(0, 10);

  if (extreme.length) {
    lines.push('\n## 最具代表性的日记（按情绪强度）');
    extreme.forEach(e => {
      lines.push(`${e.date}: ${e.thought || '(无文字)'} (效价:${e.valence} 唤醒度:${e.arousal})`);
    });
  }
  return lines.join('\n');
}

// ========== Rule-based fallback ==========

function ruleBasedWeather(type, entries) {
  if (!entries.length) return '暂无日记数据。';
  const stats = computeStats(entries);

  const moodLabel = parseFloat(stats.avgV) > 2 ? '偏积极'
    : parseFloat(stats.avgV) < -2 ? '偏消极'
    : '平稳';

  const arousalLabel = parseFloat(stats.avgA) > 7 ? '（精神活跃度高）'
    : parseFloat(stats.avgA) < 3 ? '（精神活跃度低）'
    : '';

  switch (type) {
    case 'instant': {
      const today = new Date().toISOString().split('T')[0];
      const todayCount = entries.filter(e => e.date === today).length;
      return [
        `近3天共${stats.total}条记录，情绪整体${moodLabel}${arousalLabel}。`,
        todayCount > 0 ? `今天已记录${todayCount}条。` : '今天暂无记录。',
        parseFloat(stats.avgV) < 0
          ? '今天或许可以给自己一个小小善待——喝杯水、做几次深呼吸、去窗边站一会儿。'
          : '继续保持对自己的觉察。',
        ETHICS_STATEMENT,
      ].join('\n\n');
    }
    case 'period': {
      const days = new Set(entries.map(e => e.date)).size;
      const posDays = new Set(entries.filter(e => e.valence > 0).map(e => e.date)).size;
      return [
        `近14天共${days}天${stats.total}条记录，情绪整体${moodLabel}${arousalLabel}。`,
        `${posDays}天有积极体验，${stats.posCount}条积极记录，${stats.negCount}条消极记录。`,
        `这段时间你记录了${days}天的情绪——每一笔都是对自己的关注。`,
        ETHICS_STATEMENT,
      ].join('\n\n');
    }
    case 'deep': {
      const days = new Set(entries.map(e => e.date)).size;
      const valenceValues = entries.map(e => e.valence);
      const variance = valenceValues.reduce((s, v) => s + Math.pow(v - parseFloat(stats.avgV), 2), 0) / valenceValues.length;
      const fluctuation = Math.sqrt(variance) > 2.5 ? '较大' : Math.sqrt(variance) > 1.2 ? '中等' : '较小';
      const mainTendency = stats.posCount > stats.negCount * 2 ? '积极体验占主导'
        : stats.negCount > stats.posCount * 2 ? '消极体验较多'
        : '积极与消极体验交织';
      return [
        `近6个月共${days}天${stats.total}条记录，情绪整体${moodLabel}，波动幅度${fluctuation}。`,
        `${mainTendency}。平均效价${stats.avgV}，平均唤醒度${stats.avgA}。`,
        `半年的记录是一种持续的自我陪伴——这些数据折射出你情绪世界的丰富层次。`,
        ETHICS_STATEMENT,
      ].join('\n\n');
    }
    default:
      return '未知的报告类型。';
  }
}

// ========== AI-powered report generator ==========

async function generateWeatherReport(type, entries) {
  const stats = computeStats(entries);
  const dates = [...new Set(entries.map(e => e.date))].sort();
  const dateRange = dates.length ? `${dates[0]} 至 ${dates[dates.length - 1]}` : '';

  const configs = {
    instant: {
      systemPrompt:
        '你是一位温暖不评判的情绪陪伴者。用中文回复，150-200字。使用"或许""可以试试""你有没有注意到"等柔和探问。',
      userPrompt: [
        `【即时情绪回顾 — 近3天，${dateRange}】`,
        `\n统计：${stats.days}天${stats.total}条 | 均效价${stats.avgV}(-5~+5) | 均唤醒${stats.avgA}(0~10)`,
        `\n日记全文：`,
        formatFull(entries),
        `\n请：①描述近3天情绪状态 ②如有明显波动或连续性，温和点出 ③以一个开放式反思问题结尾`,
      ].join('\n'),
      maxTokens: 4096,
    },
    period: {
      systemPrompt:
        '你是一位善于叙事的情绪观察者，用中文回复，250-350字。像在讲述关于"你"的故事——温暖、具体、不评判。',
      userPrompt: [
        `【时段情绪报告 — 近14天，${dateRange}】`,
        `\n统计：${stats.days}天${stats.total}条 | 均效价${stats.avgV} | 均唤醒${stats.avgA}`,
        `\n${formatDailyDigest(entries)}`,
        `\n请：①概括两周情绪氛围 ②指出2-3个转折点 ③提取3-5个高频主题词 ④将情绪流动串联成故事弧线`,
      ].join('\n'),
      maxTokens: 8192,
    },
    deep: {
      systemPrompt:
        '你是一位温和而深刻的观察者，用中文回复，400-500字。使用"或许你倾向于""可能你在面对……时"的推测语气，不做诊断、不贴标签。',
      userPrompt: [
        `【深度情绪洞察 — 近6个月，${dateRange}】`,
        `\n统计：${stats.days}天${stats.total}条 | 均效价${stats.avgV} | 均唤醒${stats.avgA}`,
        `\n${formatWeeklyDigest(entries)}`,
        `\n请：①描述半年情绪起伏特征 ②分析重复主题及其演变 ③基于情境-反应联系，温和推测可能的反应模式 ④推荐一个简单自我探索练习`,
      ].join('\n'),
      maxTokens: 16384,
    },
  };

  const config = configs[type];
  if (!config) throw new Error(`Unknown report type: ${type}`);

  const result = await callAI(config.systemPrompt, config.userPrompt, config.maxTokens);
  return (result || ruleBasedWeather(type, entries)) + ETHICS_STATEMENT;
}

// ========== Public API ==========

export async function generateEmotionWeather(type, entries) {
  if (!entries.length) {
    return '所选时间段内暂无日记记录，开始记录后可以生成分析。';
  }

  if (type === 'period') {
    const days = new Set(entries.map(e => e.date)).size;
    if (days < 7) {
      return `时段报告需要至少7天有效数据才能生成有意义的分析。当前仅有${days}天记录，请再多记录几天后再试。`;
    }
  }

  if (type === 'deep') {
    const days = new Set(entries.map(e => e.date)).size;
    if (days < 30) {
      return `深度洞察需要至少30天有效数据才能生成有意义的分析。当前仅有${days}天记录，请再多记录几天后再试。`;
    }
  }

  if (!['instant', 'period', 'deep'].includes(type)) {
    return '未知的报告类型。';
  }

  try {
    return await generateWeatherReport(type, entries);
  } catch (error) {
    console.error(`[EmotionWeather] AI call failed for type="${type}":`, error.message, error.code || '');
    return ruleBasedWeather(type, entries);
  }
}
