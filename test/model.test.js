// Run with: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../js/model.js');

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≉ ${b}`);

test('budget splits add back to the version total', () => {
  const t = M.plan(M.DEFAULTS);
  near(t.winbackBudget + t.sideBudget.retailer + t.sideBudget.brand, t.total);
  near(t.rows.reduce((s, r) => s + r.spend, 0) + t.wb.reduce((s, w) => s + w.spend, 0), t.total);
});

test('retailer LTV matches a hand calculation', () => {
  const r = M.retailerLTV({ firstAOV: 100, repeatAOV: 100, reorder12: 0.5, repeatOrders: 2, retention: 1, growth: 1, takeFirst: 0.2, takeRepeat: 0.1, margin: 1, years: 2 });
  near(r.gmvY1, 200);
  near(r.netY1, 30);  // 100 × 0.2 + 100 × 0.1
  near(r.ltv, 40);    // year 2 adds 100 × 0.1
});

test('CAC rises with spend and marginal iCAC sits above average iCAC', () => {
  const c = M.DEFAULTS.channels[0];
  const lo = M.channelAt(c, c.refSpend / 2, 1), hi = M.channelAt(c, c.refSpend * 2, 1);
  assert.ok(hi.cac > lo.cac);
  assert.ok(hi.marginal > hi.iCAC);
  near(M.channelAt(c, c.refSpend, 1).cac, c.baseCAC);
});

test('a lift read overrides the MMM read', () => {
  assert.equal(M.incrOf({ mmm: 0.6, lift: 0.4 }), 0.4);
  assert.equal(M.incrOf({ mmm: 0.6, lift: null }), 0.6);
});

test('win-back counts only lift above the holdout and saturates', () => {
  const s = { size: 1000, reach: 1, costPerReach: 10, exposed: 0.2, holdout: 0.2, gmv: 100, take: 0.1 };
  assert.equal(M.winbackAt(s, 5000).incr, 0);
  const s2 = Object.assign({}, s, { holdout: 0.1 });
  assert.ok(M.winbackAt(s2, 1e9).reached <= 1000);
});

test('optimizer never does worse than the starting mix', () => {
  for (const side of ['retailer', 'brand']) {
    const before = M.plan(M.DEFAULTS).kpi[side === 'retailer' ? 'newRetailers' : 'newBrands'];
    const after = M.plan(M.optimizeMix(M.DEFAULTS, side)).kpi[side === 'retailer' ? 'newRetailers' : 'newBrands'];
    assert.ok(after >= before * 0.999, `${side}: ${after} < ${before}`);
  }
});

test('more supply makes retailer acquisition cheaper', () => {
  const a = M.plan(M.DEFAULTS, { supplyShare: 0.1 }).netMult, b = M.plan(M.DEFAULTS, { supplyShare: 0.3 }).netMult;
  assert.ok(b < a);
});

test('market customer shares add to the total', () => {
  const t = M.plan(M.DEFAULTS);
  near(t.markets.reduce((s, m) => s + m.retailers, 0), t.kpi.newRetailers);
});
