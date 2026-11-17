// Dip-Buy Mean Reversion — cbBTC 1-minute bars (bars-replay/v1).
//
// Idea: on a choppy, range-bound day the trend-following bots bleed out
// through the ~26 bps round-trip cost (4 bps fee + 2 bps slippage + ~11 bps
// price impact at full size). The only edge that survives is buying a dip
// and selling the snap-back, few trades, wide targets.
//
// Rule (long only, one position at a time, full size):
//   - Track the trailing 6-hour high (360 bars) of CBBTC closes.
//   - BUY all cash when the latest close prints at least 1.5% below that
//     trailing high (a real dip, not noise: the dev window's 1-minute
//     returns have sd ~6 bps, so 150 bps is a genuine pullback).
//   - SELL all when the position is up 1.2% over its cost (take-profit),
//     or down 1.5% under its cost (stop-loss, caps the falling-knife risk
//     on a trending-down day).
//   - Never trade during warm-up; never hold more than one position.
//
// All decisions are integer (bigint) arithmetic on raw price units — no
// floats, no clock, no randomness, no network — so two runs on the same
// bars produce byte-identical orders.

import { runBars, type BarsState, type OrderInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';

// Trailing-high window in bars (6 hours of 1-minute bars).
const WINDOW_BARS = 360;
// Entry: close at least this far below the trailing high (basis points).
const DIP_BPS = 150;
// Exit: take-profit / stop-loss vs position cost (basis points).
const TAKE_PROFIT_BPS = 120;
const STOP_LOSS_BPS = 150;
// Slippage tolerance on every order (basis points). 1-minute moves are
// ~6 bps sd, so 150 bps is generous headroom without ever binding.
const MAX_SLIPPAGE_BPS = 150;

// Past closes, oldest first; only fresh bars are appended.
const closes: bigint[] = [];
// Time of the last fresh bar we decided on (-1 before the first).
let lastBarT = -1;

function trailingHigh(): bigint | null {
  if (closes.length < WINDOW_BARS) return null;
  let hi = closes[closes.length - WINDOW_BARS];
  for (let i = closes.length - WINDOW_BARS + 1; i < closes.length; i++) {
    if (closes[i] > hi) hi = closes[i];
  }
  return hi;
}

await runBars({
  onBatch(state: BarsState): OrderInput[] {
    if (state.warmingUp) return [];
    const bar = state.latest.get(SYMBOL);
    // No fresh bar for our symbol in this batch: nothing new to decide.
    if (bar === undefined || bar.t === lastBarT) return [];
    lastBarT = bar.t;
    const close = BigInt(bar.c);
    const orders: OrderInput[] = [];
    const held = state.positions.get(SYMBOL);

    if (held === undefined) {
      const hi = trailingHigh();
      if (hi !== null && close * 10000n <= hi * (10000n - BigInt(DIP_BPS))) {
        const notional = state.cash;
        if (notional > 0n) {
          orders.push({
            side: 'buy',
            symbol: SYMBOL,
            notional_quote_units: notional,
            max_slippage_bps: MAX_SLIPPAGE_BPS,
          });
        }
      }
    } else {
      const value = state.value(SYMBOL, held.qty);
      const cost = held.cost;
      // Basis points: TP when value is 120 bps over cost, stop when 150 bps under.
      const takeProfit = value * 10000n >= cost * (10000n + BigInt(TAKE_PROFIT_BPS));
      const stopLoss = value * 10000n <= cost * (10000n - BigInt(STOP_LOSS_BPS));
      if (takeProfit || stopLoss) {
        orders.push({
          side: 'sell',
          symbol: SYMBOL,
          qty: held.qty,
          max_slippage_bps: MAX_SLIPPAGE_BPS,
        });
      }
    }

    closes.push(close);
    return orders;
  },
});
