
can a code substitute a trader? ☆

algorithmic trading involves complexities beyond this code's limits, 
such as latency, liquidity issues, and unforeseen market events

## what the code includes:

1. volume filter
replaces the single-candle check with a two-part confirmation

2. sustained volume expansion
checks if the average volume over the last 3-5 periods is significantly higher than the longer-term average

3. OBV confirmation
uses the obv indicator to confirm that the volume is supporting the price direction (i.e., volume is flowing into the asset during a price rise)

4. ATR-based exits
replaces the percentage-based stop-loss with levels based on the atr. this adjusts risk and reward targets to the current market volatility

5. performance report
calculates and displays metrics such as net Profit, win Rate, profit Factor, and max drawdown

6. intrabar risk simulation- 
a basic intrabar simulation to check if stop-losses were hit during the candle, not just at the close
