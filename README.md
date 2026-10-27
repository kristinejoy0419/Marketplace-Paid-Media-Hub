# Marketplace Paid Media Hub

A paid media planning tool for a two-sided wholesale marketplace, where independent retailers buy and brands sell. It plans both sides of acquisition and judges every dollar on **incremental** customers, GMV and lifetime contribution, not on platform-reported conversions.

The example plan is built around a wholesale marketplace like Faire. **Every number in it is an illustrative assumption, not company data.** Replace the inputs with real cohort, MMM and lift data before using the output in a decision.

## What it does

| Tab | What it answers |
| --- | --- |
| **Summary** | What the budget buys: incremental retailers and brands, first-year GMV, incremental CAC, LTV:CAC, payback, marketplace balance, and where the next $1M should go. |
| **Channel mix** | Spend, CAC at spend, attributed vs incremental customers, and marginal incremental CAC per channel, for each side. One click rebalances a side so every channel's marginal iCAC is equal. |
| **Retargeting & win-back** | Paid media against signed-up-but-not-ordered, no-reorder, lapsed, abandoned-cart and dormant-brand segments, measured against a standing holdout. |
| **Measurement** | MMM and lift reads per channel, which one the plan uses, where they disagree, the test calendar and the weekly/monthly/quarterly operating rhythm. |
| **International** | Spend, customers, iCAC, GMV and payback by market, with a Test → Scaling → Core launch sequence. |
| **Unit economics** | Retailer and brand LTV inputs (order size, reorder rate, take rate, retention, margin), the supply-depth network effect, the balance band and the budget versions. |

The controls at the top set the budget version ($20M, $50M or $100M by default), the brand (supply) share of acquisition and the win-back share. The Summary tab also scans for the brand share that returns the most lifetime contribution.

## How the model works

- **Diminishing returns:** CAC at spend = base CAC × (spend ÷ reference spend) ^ elasticity.
- **Incrementality:** incremental customers = attributed × incrementality factor. A lift or geo test read overrides the MMM read when one exists.
- **Marginal iCAC** = iCAC ÷ (1 − elasticity), the cost of the next incremental customer. The rebalancer allocates budget in small steps to the lowest marginal iCAC, capped at 3× each channel's reference spend.
- **Retailer LTV:** first order plus repeat orders in year 1, then retention × growth each later year; net revenue at first-order and repeat take rates; contribution at the margin you set.
- **Brand LTV:** contribution on the share of a new brand's GMV that is net new to the marketplace, plus credit for the retailers each brand brings from its own book.
- **Network effect:** new brands deepen the catalog, which lowers retailer CAC by (1 + new brands ÷ active brands) ^ −strength.
- **Win-back:** reach saturates exponentially with spend; only reactivations above the holdout rate count.

All of the model lives in `js/model.js` as pure functions with no DOM, so it can be tested and reused.

## Run it

Open `index.html` in a browser. No build step and no dependencies. Inputs save in that browser.

`dist/hub.html` is the same tool as one self-contained file for sharing. Rebuild it after changes with:

```sh
npm run build
```

Run the model tests (Node 18+):

```sh
npm test
```

## Files

```
index.html            page shell
css/styles.css        styles, light and dark themes
js/model.js           the planning model (browser + Node)
js/app.js             tabs, inputs, rendering
test/model.test.js    model tests
scripts/build-single.js  builds dist/hub.html
```
