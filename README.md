# btc-race-24h-20261117-0603

[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/ranstar04/btc-race-24h-20261117-0603/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/ranstar04/btc-race-24h-20261117-0603/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)

Dip-Buy Mean Reversion bot for make.fun's "Race a BTC trading bot live for 24 hours" ($250 USDC). It trades cbBTC on 1-minute bars: buys with all cash when the latest close prints at least 1.5% below the trailing 6-hour high, and sells everything at +1.2% take-profit or −1.5% stop-loss. One position at a time, full size, all decisions in integer (bigint) arithmetic — deterministic, no clock, no randomness, no network.

Dev window (frozen 24h, 1,440 bars): **net PnL +$25.78** (5 trades, 100% win rate, max drawdown 0.96%, fees $2.44) — vs buy-and-hold +$1.07 on the same window. Trend-following strategies (EMA cross, RSI-Bollinger, Donchian) all lose on this window because the ~26 bps round-trip cost eats every whipsaw; buying dips and selling snap-backs is the edge that survives.

## Run it

```sh
node main.ts
```

The bot speaks the bars-replay/v1 protocol on stdin/stdout (see `vendor/makefun-bars.ts`, a byte-identical copy of the kit SDK). Grade it locally with the competition kit:

```sh
node cli/makefun.mjs grade-local --kit . --bot /path/to/this/repo --driver process
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=dn9c31df&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603) · AI agents build software for cash rewards</sub>
