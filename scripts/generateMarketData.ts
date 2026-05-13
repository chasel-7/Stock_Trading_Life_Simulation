/**
 * 模拟行情数据生成脚本
 * 运行: npx tsx scripts/generateMarketData.ts
 * 输出: src/data/sampleMarket.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface StockDef {
  id: string;
  sector: string;
  keywords: string[];
  isRecommended: boolean;
  basePrice: number;
  /** 日波动率 */
  dailyVol: number;
  /** 总趋势: >0 看多, <0 看空 */
  trend: number;
}

const TOTAL_DAYS = 15;
const TICKS_PER_DAY = 40;

const STOCK_DEFS: StockDef[] = [
  // 消费板块
  { id: '消费-01', sector: '消费', keywords: ['白酒', '龙头'], isRecommended: true, basePrice: 50, dailyVol: 0.03, trend: 0.005 },
  { id: '消费-02', sector: '消费', keywords: ['乳业', '消费升级'], isRecommended: false, basePrice: 20, dailyVol: 0.02, trend: -0.002 },
  { id: '消费-03', sector: '消费', keywords: ['调味品', '稳健'], isRecommended: false, basePrice: 35, dailyVol: 0.015, trend: 0.001 },
  // 科技板块
  { id: '科技-01', sector: '科技', keywords: ['芯片', '国产替代'], isRecommended: true, basePrice: 30, dailyVol: 0.05, trend: 0.008 },
  { id: '科技-02', sector: '科技', keywords: ['AI', '算力'], isRecommended: false, basePrice: 45, dailyVol: 0.06, trend: 0.01 },
  { id: '科技-03', sector: '科技', keywords: ['面板', '周期'], isRecommended: false, basePrice: 12, dailyVol: 0.04, trend: -0.005 },
  // 制造板块
  { id: '制造-01', sector: '制造', keywords: ['新能源车', '锂电'], isRecommended: true, basePrice: 80, dailyVol: 0.04, trend: 0.003 },
  { id: '制造-02', sector: '制造', keywords: ['光伏', '绿色能源'], isRecommended: false, basePrice: 25, dailyVol: 0.035, trend: -0.003 },
  { id: '制造-03', sector: '制造', keywords: ['机器人', '智造'], isRecommended: false, basePrice: 18, dailyVol: 0.045, trend: 0.006 },
  // 医药板块
  { id: '医药-01', sector: '医药', keywords: ['创新药', '研发'], isRecommended: false, basePrice: 60, dailyVol: 0.04, trend: -0.004 },
  { id: '医药-02', sector: '医药', keywords: ['CXO', '外包'], isRecommended: false, basePrice: 40, dailyVol: 0.035, trend: 0.002 },
  { id: '医药-03', sector: '医药', keywords: ['中药', '国潮'], isRecommended: false, basePrice: 15, dailyVol: 0.02, trend: 0.004 },
  // 金融板块
  { id: '金融-01', sector: '金融', keywords: ['银行', '高股息'], isRecommended: false, basePrice: 5, dailyVol: 0.01, trend: 0.001 },
  { id: '金融-02', sector: '金融', keywords: ['券商', '牛市旗手'], isRecommended: false, basePrice: 22, dailyVol: 0.05, trend: 0.003 },
  { id: '金融-03', sector: '金融', keywords: ['保险', '大金融'], isRecommended: false, basePrice: 35, dailyVol: 0.025, trend: -0.001 },
];

function generateTicks(open: number, close: number, high: number, low: number, count: number): number[] {
  const ticks: number[] = [open];
  const range = high - low;

  for (let i = 1; i < count - 1; i++) {
    const progress = i / (count - 1);
    // 基础路径：从open到close的线性插值
    const base = open + (close - open) * progress;
    // 添加随机波动
    const noise = (Math.random() - 0.5) * range * 0.3;
    const price = Math.max(low, Math.min(high, base + noise));
    ticks.push(Math.round(price * 100) / 100);
  }

  ticks.push(close);
  return ticks;
}

function generateStockData(def: StockDef) {
  const dailyData = [];
  let prevClose = def.basePrice;

  for (let day = 0; day < TOTAL_DAYS; day++) {
    // 日收益率
    const dailyReturn = def.trend + (Math.random() - 0.5) * def.dailyVol * 2;
    const open = Math.round(prevClose * (1 + (Math.random() - 0.5) * 0.01) * 100) / 100;
    const close = Math.round(prevClose * (1 + dailyReturn) * 100) / 100;

    const absChange = Math.abs(close - open);
    const high = Math.round(Math.max(open, close) * (1 + Math.random() * def.dailyVol) * 100) / 100;
    const low = Math.round(Math.min(open, close) * (1 - Math.random() * def.dailyVol) * 100) / 100;

    const ticks = generateTicks(open, close, high, low, TICKS_PER_DAY);

    dailyData.push({ open, close, high, low, ticks });
    prevClose = close;
  }

  return {
    id: def.id,
    sector: def.sector,
    keywords: def.keywords,
    isRecommended: def.isRecommended,
    dailyData,
  };
}

// 生成
const marketData = {
  totalDays: TOTAL_DAYS,
  stocks: STOCK_DEFS.map(generateStockData),
};

const outPath = path.join(__dirname, '..', 'src', 'data', 'sampleMarket.json');
fs.writeFileSync(outPath, JSON.stringify(marketData, null, 2), 'utf-8');
console.log(`✅ Generated market data: ${STOCK_DEFS.length} stocks × ${TOTAL_DAYS} days`);
console.log(`   Output: ${outPath}`);
