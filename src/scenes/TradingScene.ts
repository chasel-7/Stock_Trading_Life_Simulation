import Phaser from 'phaser';
import { getGameManager } from '../managers/GameManager';
import { PriceTickEngine } from '../managers/PriceTickEngine';
import { StockListPanel } from '../ui/StockListPanel';
import { HoldingsPanel } from '../ui/HoldingsPanel';
import { TabBar } from '../ui/TabBar';
import { StockDetailPanel } from '../ui/StockDetailPanel';
import { OrderDialog } from '../ui/OrderDialog';
import { GAME_CONSTANTS } from '../config/constants';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import type { StockRowData } from '../ui/StockRow';

export class TradingScene extends Phaser.Scene {
  private tickEngine!: PriceTickEngine;
  private stockList!: StockListPanel;
  private holdingsPanel!: HoldingsPanel;
  private detailPanel!: StockDetailPanel;
  private orderDialog!: OrderDialog;
  private tickTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'TradingScene' });
  }

  create(): void {
    const gm = getGameManager(this);
    const state = gm.state.getState();
    const day = state.currentDay - 1;

    // 顶部信息栏
    const topBar = this.add.container(0, 0);
    const topBg = this.add.rectangle(0, 0, GAME_WIDTH, 50, 0x16213e, 1).setOrigin(0, 0);
    topBar.add(topBg);
    const dayTxt = this.add.text(12, 25, `📈 Day ${state.currentDay}/${state.totalDays}`, {
      fontSize: '14px', color: '#ffd700', fontFamily: 'sans-serif',
    }).setOrigin(0, 0.5);
    topBar.add(dayTxt);
    const cashTxt = this.add.text(GAME_WIDTH - 12, 25, `💰 ¥${state.cash.toLocaleString()}`, {
      fontSize: '14px', color: '#e0e0e0', fontFamily: 'monospace',
    }).setOrigin(1, 0.5);
    topBar.add(cashTxt);

    // Tab栏
    const tabY = 50;
    new TabBar(this, 0, tabY, GAME_WIDTH, ['自选股', '持仓'], (idx) => {
      this.stockList.setVisible(idx === 0);
      this.holdingsPanel.setVisible(idx !== 0);
    });

    // 准备股票数据
    const stockIds = gm.stocks.getStockIds();
    const ticksByStock: Record<string, number[]> = {};
    const stockRowData: StockRowData[] = [];

    for (const id of stockIds) {
      const dd = gm.stocks.getDailyData(id, day);
      ticksByStock[id] = dd.ticks;
      const prevClose = day > 0 ? gm.stocks.getClosePrice(id, day - 1) : dd.open;
      stockRowData.push({
        stockId: id,
        name: id,
        price: dd.open,
        changePercent: ((dd.open - prevClose) / prevClose) * 100,
        isRecommended: gm.stocks.isRecommended(id),
      });
    }

    // 自选股列表
    const listY = tabY + 44;
    const listH = GAME_HEIGHT - listY - 60;
    this.stockList = new StockListPanel(this, 0, listY, GAME_WIDTH, listH, stockRowData,
      (stockId) => this.showDetail(stockId, day));

    // 持仓面板
    this.holdingsPanel = new HoldingsPanel(this, 0, listY, GAME_WIDTH, listH);
    this.holdingsPanel.setVisible(false);

    // 个股详情
    this.detailPanel = new StockDetailPanel(this, 0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 下单弹窗
    this.orderDialog = new OrderDialog(this, GAME_WIDTH, GAME_HEIGHT);

    // 价格引擎
    this.tickEngine = new PriceTickEngine(ticksByStock);
    this.tickEngine.onTick((stockId, price, _idx) => {
      const dd = gm.stocks.getDailyData(stockId, day);
      const changePercent = ((price - dd.open) / dd.open) * 100;
      this.stockList.updateStockPrice(stockId, price, changePercent);
      this.holdingsPanel.refresh(gm.state.getState().holdings, this.tickEngine.getCurrentPrices());

      // 更新顶部资金显示
      cashTxt.setText(`💰 ¥${gm.state.getState().cash.toLocaleString()}`);
    });
    this.tickEngine.onFinish(() => this.onMarketClose());

    // 收盘按钮
    const closeBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 30, 160, 40, 0xd94a4a, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '🔔 收盘', {
      fontSize: '16px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    closeBg.on('pointerup', () => this.onMarketClose());

    // 启动价格步进
    this.tickTimer = this.time.addEvent({
      delay: GAME_CONSTANTS.PRICE_TICK_INTERVAL,
      callback: () => this.tickEngine.step(),
      loop: true,
    });
    // 立即执行第一次
    this.tickEngine.step();
  }

  private showDetail(stockId: string, day: number): void {
    const gm = getGameManager(this);
    const dailyData = [];
    for (let d = 0; d <= day; d++) {
      dailyData.push(gm.stocks.getDailyData(stockId, d));
    }
    this.detailPanel.show(stockId, dailyData, day, {
      onBuy: () => this.showOrder('buy', stockId),
      onSell: () => this.showOrder('sell', stockId),
      onBack: () => this.detailPanel.hide(),
    });
  }

  private showOrder(type: 'buy' | 'sell', stockId: string): void {
    const gm = getGameManager(this);
    const state = gm.state.getState();
    const price = this.tickEngine.getCurrentPrices()[stockId] || 0;
    const holding = state.holdings.find(h => h.stockId === stockId);
    this.orderDialog.show({
      type, stockId, price,
      cash: state.cash,
      holdingValue: holding ? holding.shares * price : 0,
      commissionRate: gm.getCommissionRate(),
      onConfirm: (result) => {
        // 记录交易
        gm.tradeLog.log({
          day: gm.state.getState().currentDay,
          tickIndex: this.tickEngine.getCurrentIndex(),
          stockId: result.stockId,
          type: result.type,
          price,
          amount: result.amount,
          recentTrend: this.getRecentTrend(result.stockId),
          pnl: result.type === 'sell' ? this.calculatePnl(result.stockId, price) : undefined,
        });

        if (result.type === 'buy') {
          gm.state.buyStock(result.stockId, result.amount, price, gm.getCommissionRate());
        } else {
          gm.state.sellStock(result.stockId, result.amount, price, gm.getCommissionRate());
        }
      },
    });
  }

  private getRecentTrend(stockId: string): 'up' | 'down' | 'flat' {
    const gm = getGameManager(this);
    const day = gm.state.getState().currentDay - 1;
    const dd = gm.stocks.getDailyData(stockId, day);
    const idx = this.tickEngine.getCurrentIndex();
    if (idx < 3) return 'flat';
    const recent = dd.ticks.slice(Math.max(0, idx - 3), idx + 1);
    const first = recent[0], last = recent[recent.length - 1];
    if (last > first * 1.01) return 'up';
    if (last < first * 0.99) return 'down';
    return 'flat';
  }

  private calculatePnl(stockId: string, sellPrice: number): number {
    const gm = getGameManager(this);
    const holding = gm.state.getState().holdings.find(h => h.stockId === stockId);
    if (!holding) return 0;
    const avgCost = holding.costBasis / holding.shares;
    return (sellPrice - avgCost) * holding.shares;
  }

  private onMarketClose(): void {
    if (this.tickTimer) this.tickTimer.destroy();
    this.scene.start('PostMarketScene');
  }
}
