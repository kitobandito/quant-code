// part 1: indicator calculations

function calculateEMA(data, period) {
  if (!Array.isArray(data) || data.length < period) return [];
  const multiplier = 2 / (period + 1);
  let ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push((data[i] - ema[i - 1]) * multiplier + ema[i - 1]);
  }
  return ema;
}

function calculateATR(highs, lows, closes, period = 14) {
  if (!Array.isArray(highs) || highs.length < period + 1) return [];
  let tr = [];
  for (let i = 1; i < highs.length; i++) {
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  }
  let atr = [tr.slice(0, period).reduce((a, b) => a + b) / period];
  for (let i = period; i < tr.length; i++) {
    atr.push((atr[i - 1] * (period - 1) + tr[i]) / period);
  }
  return Array(period).fill(null).concat(atr);
}

function calculateADX(highs, lows, closes, period = 14) {
  if (!Array.isArray(highs) || highs.length < period * 2) return [];
  let plusDM = [], minusDM = [], tr = [];
  for (let i = 1; i < highs.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    plusDM.push((upMove > downMove && upMove > 0) ? upMove : 0);
    minusDM.push((downMove > upMove && downMove > 0) ? downMove : 0);
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  }
  let smoothedTR = tr.slice(0, period).reduce((a, b) => a + b) / period;
  let smoothedPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b) / period;
  let smoothedMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b) / period;
  let adx = [];
  for (let i = period; i < tr.length; i++) {
    smoothedTR = (smoothedTR * (period - 1) + tr[i]) / period;
    smoothedPlusDM = (smoothedPlusDM * (period - 1) + plusDM[i]) / period;
    smoothedMinusDM = (smoothedMinusDM * (period - 1) + minusDM[i]) / period;
    const plusDI = 100 * (smoothedPlusDM / smoothedTR);
    const minusDI = 100 * (smoothedMinusDM / smoothedTR);
    const dx = 100 * (Math.abs(plusDI - minusDI) / (plusDI + minusDI));
    adx.push(i === period ? dx : (adx[adx.length - 1] * (period - 1) + dx) / period);
  }
  return Array(highs.length - adx.length).fill(null).concat(adx);
}

/**
 * calculates on-balance volume (OBV) for volume confirmation
 */
function calculateOBV(closes, volumes) {
  if (!Array.isArray(closes) || closes.length !== volumes.length) return [];
  let obv = [volumes[0]];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) obv.push(obv[i - 1] + volumes[i]);
    else if (closes[i] < closes[i - 1]) obv.push(obv[i - 1] - volumes[i]);
    else obv.push(obv[i - 1]);
  }
  return obv;
}

/**
 * calculates simple moving average (SMA).
 */
function calculateSMA(data, period) {
  if (!Array.isArray(data) || data.length < period) return [];
  let sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return Array(period - 1).fill(null).concat(sma);
}


//  part 2: the portfolio class 

class Portfolio {
  constructor(initialCapital, riskPerTrade, transactionCost, slippage) {
    this.initialCapital = initialCapital;
    this.cash = initialCapital;
    this.equity = initialCapital;
    this.holdings = 0;
    this.riskPerTrade = riskPerTrade;
    this.transactionCost = transactionCost; // e.g., 0.001 for 0.1%
    this.slippage = slippage; // e.g., 0.0005 for 0.05%
    this.openTrade = null;
    this.tradeLog = [];
    this.equityCurve = [initialCapital];
  }

  calculatePositionSize(entryPrice, stopLossPrice) {
    if (entryPrice <= stopLossPrice) return 0;
    const capitalToRisk = this.equity * this.riskPerTrade;
    const riskPerShare = entryPrice - stopLossPrice;
    const costPerShare = entryPrice * (1 + this.transactionCost + this.slippage);
    const maxAffordableShares = this.cash / costPerShare;
    return Math.min(Math.floor(capitalToRisk / riskPerShare), maxAffordableShares);
  }

  buy(price, stopLoss, takeProfit, atr, timestamp) {
    const quantity = this.calculatePositionSize(price, stopLoss);
    if (quantity > 0) {
      const entryPrice = price * (1 + this.slippage);
      const cost = entryPrice * quantity * (1 + this.transactionCost);
      if (this.cash >= cost) {
        this.holdings = quantity;
        this.cash -= cost;
        this.openTrade = {
          entryPrice, quantity, stopLoss, takeProfit,
          atr, entryTime: timestamp, type: 'LONG'
        };
        console.log(`[TRADE] BUY ${quantity} @ ${entryPrice.toFixed(2)} | Stop: ${stopLoss.toFixed(2)} | Target: ${takeProfit.toFixed(2)}`);
      }
    }
  }

  sell(price, reason, timestamp) {
    if (this.holdings > 0) {
      const exitPrice = price * (1 - this.slippage);
      const proceeds = exitPrice * this.holdings * (1 - this.transactionCost);
      this.cash += proceeds;
      const trade = this.openTrade;
      const pnl = proceeds - (trade.entryPrice * trade.quantity * (1 + this.transactionCost));
      const pnlPercent = ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
      console.log(`[TRADE] SELL ${this.holdings} @ ${exitPrice.toFixed(2)} | Reason: ${reason} | PnL: ${pnl.toFixed(2)} (\${pnlPercent.toFixed(2)}%)`);
