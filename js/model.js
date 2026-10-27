/* Marketplace Paid Media Hub: the planning model.
   Pure functions only, no DOM. Runs in the browser (window.HubModel) and in Node (require) for tests.
   Every default is an illustrative planning assumption, not Faire data. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HubModel = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- defaults ----------
  // Channel fields: mix = share of that side's acquisition budget; baseCAC = platform-attributed cost per new
  // customer at refSpend; elasticity = how fast CAC rises with spend (CAC ∝ spend^e); mmm / lift = incrementality
  // reads (share of platform-attributed customers that are truly incremental). Lift wins over MMM when present.
  const DEFAULTS = {
    version: 'medium',
    budgets: { low: 20e6, medium: 50e6, high: 100e6 },
    supplyShare: 0.2,   // share of acquisition budget spent recruiting brands (supply side)
    winbackShare: 0.08, // share of total budget held for retargeting and win-back
    channels: [
      { id: 'search_nb', side: 'retailer', name: 'Google Search, non-brand', note: '"wholesale candles", "gift shop suppliers"', mix: 0.22, baseCAC: 170, refSpend: 8e6, elasticity: 0.45, mmm: 0.72, lift: 0.75, liftSrc: 'Geo holdout, Q2' },
      { id: 'search_brand', side: 'retailer', name: 'Google Search, brand', note: 'Defensive brand terms', mix: 0.05, baseCAC: 60, refSpend: 2e6, elasticity: 0.3, mmm: 0.3, lift: 0.2, liftSrc: 'Brand search holdout' },
      { id: 'pmax', side: 'retailer', name: 'Performance Max & Shopping', note: 'Product feed of top-selling wholesale SKUs', mix: 0.12, baseCAC: 180, refSpend: 4e6, elasticity: 0.4, mmm: 0.55, lift: null, liftSrc: '' },
      { id: 'meta', side: 'retailer', name: 'Meta prospecting', note: 'Advantage+, boutique and gift-shop owner signals', mix: 0.28, baseCAC: 210, refSpend: 10e6, elasticity: 0.35, mmm: 0.6, lift: 0.65, liftSrc: 'Conversion Lift, Q3' },
      { id: 'tiktok', side: 'retailer', name: 'TikTok', note: 'Shop-owner creators, "what I stock" content', mix: 0.08, baseCAC: 240, refSpend: 3e6, elasticity: 0.5, mmm: 0.6, lift: null, liftSrc: '' },
      { id: 'pinterest', side: 'retailer', name: 'Pinterest', note: 'Seasonal merchandising boards', mix: 0.07, baseCAC: 230, refSpend: 2.5e6, elasticity: 0.5, mmm: 0.55, lift: null, liftSrc: '' },
      { id: 'ctv', side: 'retailer', name: 'YouTube & CTV', note: 'Upper funnel, geo-testable', mix: 0.08, baseCAC: 380, refSpend: 3e6, elasticity: 0.3, mmm: 0.8, lift: null, liftSrc: '' },
      { id: 'partners', side: 'retailer', name: 'Affiliates & POS partners', note: 'Point-of-sale and e-commerce platform partners', mix: 0.1, baseCAC: 150, refSpend: 3.5e6, elasticity: 0.6, mmm: 0.45, lift: 0.5, liftSrc: 'Partner holdout' },
      { id: 'meta_b', side: 'brand', name: 'Meta, maker audiences', note: 'Independent makers and DTC founders', mix: 0.4, baseCAC: 650, refSpend: 3.5e6, elasticity: 0.4, mmm: 0.6, lift: 0.6, liftSrc: 'Conversion Lift, Q3' },
      { id: 'search_b', side: 'brand', name: 'Google Search, "sell wholesale"', note: 'High intent supply terms', mix: 0.25, baseCAC: 520, refSpend: 2.2e6, elasticity: 0.5, mmm: 0.7, lift: null, liftSrc: '' },
      { id: 'linkedin_b', side: 'brand', name: 'LinkedIn, brand founders', note: 'Founders, heads of sales at emerging brands', mix: 0.1, baseCAC: 1100, refSpend: 1e6, elasticity: 0.4, mmm: 0.7, lift: null, liftSrc: '' },
      { id: 'creators_b', side: 'brand', name: 'Creator & community partners', note: 'Maker communities, small-business educators', mix: 0.15, baseCAC: 800, refSpend: 1.3e6, elasticity: 0.5, mmm: 0.6, lift: null, liftSrc: '' },
      { id: 'pod_b', side: 'brand', name: 'Podcasts & newsletters', note: 'Small-business and maker shows', mix: 0.1, baseCAC: 900, refSpend: 1e6, elasticity: 0.4, mmm: 0.75, lift: null, liftSrc: '' }
    ],
    // Retailer (demand side) unit economics
    retailer: {
      firstAOV: 700, repeatAOV: 550,
      reorder12: 0.65,     // share of new retailers who reorder within 12 months
      repeatOrders: 5,     // repeat orders in year 1 among those who reorder
      retention: 0.75,     // yearly retention of active retailers after year 1
      growth: 1.15,        // order growth per retained retailer per year
      takeFirst: 0.25, takeRepeat: 0.15,
      margin: 0.7,         // contribution margin on net revenue (after payments, returns, credit losses)
      years: 3
    },
    // Brand (supply side) unit economics
    brand: {
      gmvY1: 12000,        // marketplace GMV per newly activated brand, year 1
      incrShare: 0.4,      // share of that GMV that is net new to the marketplace, not shifted from other brands
      take: 0.18, retention: 0.8, growth: 1.2,
      referredRetailers: 0.8, // retailers each brand brings onto the marketplace from its own book
      referredValue: 0.5      // share of a referred retailer's LTV credited to brand acquisition
    },
    network: { activeBrands: 100000, effect: 0.5 }, // more supply makes retailer acquisition cheaper
    balance: { min: 8, max: 20 },                   // healthy band: new retailers per new brand
    markets: [
      { id: 'us', name: 'United States', weight: 0.62, cac: 1.0, aov: 1.0, stage: 'Core', note: 'Full channel mix, MMM fully calibrated' },
      { id: 'ca', name: 'Canada', weight: 0.08, cac: 1.1, aov: 0.95, stage: 'Scaling', note: 'Bilingual creative in Quebec' },
      { id: 'uk', name: 'United Kingdom', weight: 0.12, cac: 1.15, aov: 0.9, stage: 'Scaling', note: 'GBP pricing, local trade-show calendar' },
      { id: 'eu', name: 'Europe (DE, FR, NL, ES, IT…)', weight: 0.13, cac: 1.3, aov: 0.85, stage: 'Scaling', note: 'Localized creative per language, VAT messaging' },
      { id: 'au', name: 'Australia & NZ', weight: 0.05, cac: 1.2, aov: 0.95, stage: 'Test', note: 'Southern-hemisphere seasonality, geo holdout first' }
    ],
    // Win-back and retargeting: paid media against people who already know the marketplace
    winback: [
      { id: 'no_first', name: 'Signed up, no first order', side: 'retailer', size: 250000, reach: 0.7, costPerReach: 12, exposed: 0.09, holdout: 0.06, gmv: 2500, take: 0.22, share: 0.3 },
      { id: 'no_reorder', name: 'First order, no reorder in 60 days', side: 'retailer', size: 200000, reach: 0.75, costPerReach: 10, exposed: 0.22, holdout: 0.16, gmv: 2200, take: 0.15, share: 0.3 },
      { id: 'lapsed', name: 'Lapsed 180+ days', side: 'retailer', size: 180000, reach: 0.6, costPerReach: 14, exposed: 0.12, holdout: 0.08, gmv: 1800, take: 0.15, share: 0.2 },
      { id: 'cart', name: 'Abandoned cart, dynamic product ads', side: 'retailer', size: 80000, reach: 0.85, costPerReach: 6, exposed: 0.3, holdout: 0.24, gmv: 900, take: 0.2, share: 0.15 },
      { id: 'dormant_brands', name: 'Dormant brands, no orders in 90 days', side: 'brand', size: 20000, reach: 0.6, costPerReach: 20, exposed: 0.15, holdout: 0.1, gmv: 6000, take: 0.18, share: 0.05 }
    ]
  };

  const clone = o => JSON.parse(JSON.stringify(o));
  const sum = (a, f = x => x) => a.reduce((s, x) => s + f(x), 0);

  // ---------- unit economics ----------
  // Retailer lifetime value: contribution from net revenue over the horizon.
  function retailerLTV(r) {
    const repeatGMV = r.reorder12 * r.repeatOrders * r.repeatAOV;
    const gmvY1 = r.firstAOV + repeatGMV;
    const netY1 = r.firstAOV * r.takeFirst + repeatGMV * r.takeRepeat;
    const years = [{ gmv: gmvY1, net: netY1 }];
    let g = repeatGMV;
    for (let y = 2; y <= r.years; y++) { g *= r.retention * r.growth; years.push({ gmv: g, net: g * r.takeRepeat }); }
    const contrib = years.map(y => y.net * r.margin);
    return { gmvY1, netY1, contribY1: contrib[0], ltv: sum(contrib), gmvLife: sum(years, y => y.gmv), years };
  }

  function brandLTV(b, r, retailerLtv) {
    const years = [];
    let g = b.gmvY1;
    for (let y = 1; y <= r.years; y++) { years.push(g); g *= b.retention * b.growth; }
    const contrib = years.map(x => x * b.incrShare * b.take * r.margin);
    const referred = b.referredRetailers * b.referredValue * retailerLtv;
    return { gmvY1: b.gmvY1, contribY1: contrib[0] + referred / r.years, ltv: sum(contrib) + referred, gmvLife: sum(years), referred };
  }

  // ---------- channel response ----------
  // CAC rises with spend: CAC(s) = base × (s / ref)^e. Incremental customers = s / CAC × incrementality.
  const incrOf = c => (c.lift != null ? c.lift : c.mmm);
  function channelAt(c, spend, cacMult) {
    if (spend <= 0) return { spend: 0, cac: c.baseCAC * cacMult, attributed: 0, incremental: 0, iCAC: Infinity, marginal: 0 };
    const cac = c.baseCAC * cacMult * Math.pow(spend / c.refSpend, c.elasticity);
    const attributed = spend / cac, incr = incrOf(c), incremental = attributed * incr;
    const iCAC = cac / incr;
    return { spend, cac, attributed, incremental, iCAC, marginal: iCAC / (1 - c.elasticity) };
  }

  // ---------- win-back response ----------
  // Reach saturates: reached = pool × (1 − e^(−spend / (pool × costPerReach))). Lift = exposed − holdout.
  function winbackAt(s, spend) {
    const pool = s.size * s.reach;
    const reached = spend > 0 ? pool * (1 - Math.exp(-spend / (pool * s.costPerReach))) : 0;
    const incr = reached * Math.max(s.exposed - s.holdout, 0);
    const gmv = incr * s.gmv, net = gmv * s.take;
    return { spend, reached, incr, gmv, net, costPerIncr: incr ? spend / incr : Infinity, iROAS: spend ? gmv / spend : 0, netROAS: spend ? net / spend : 0 };
  }

  // ---------- the plan ----------
  function plan(input, overrides) {
    const p = Object.assign(clone(input), overrides || {});
    const total = p.budgets[p.version];
    const winbackBudget = total * p.winbackShare;
    const acq = total - winbackBudget;
    const sideBudget = { brand: acq * p.supplyShare, retailer: acq * (1 - p.supplyShare) };

    // Market mix scales CAC: a dollar in a pricier market buys fewer customers.
    const mW = sum(p.markets, m => m.weight) || 1;
    const marketCAC = sum(p.markets, m => m.weight * m.cac) / mW;

    const side = s => p.channels.filter(c => c.side === s);
    const runSide = (s, mult) => {
      const ch = side(s), mixT = sum(ch, c => c.mix) || 1;
      return ch.map(c => Object.assign({ id: c.id, side: s, name: c.name, incrFactor: incrOf(c), evidence: c.lift != null ? 'measured' : 'model' }, channelAt(c, sideBudget[s] * c.mix / mixT, mult)));
    };

    const brandRows = runSide('brand', marketCAC);
    const newBrands = sum(brandRows, r => r.incremental);
    // Network effect: new supply relative to the active base makes retailer acquisition cheaper.
    const netMult = Math.pow(1 + newBrands / p.network.activeBrands, -p.network.effect);
    const retailerRows = runSide('retailer', marketCAC * netMult);
    const newRetailers = sum(retailerRows, r => r.incremental);
    const referredRetailers = newBrands * p.brand.referredRetailers;

    const R = retailerLTV(p.retailer), B = brandLTV(p.brand, p.retailer, R.ltv);
    const ltvOf = s => (s === 'retailer' ? R.ltv : B.ltv);
    const rows = retailerRows.concat(brandRows).map(r => Object.assign(r, {
      ltv: ltvOf(r.side), value: r.incremental * ltvOf(r.side), ltvCac: r.iCAC === Infinity ? 0 : ltvOf(r.side) / r.iCAC
    }));

    const wb = p.winback.map(s => Object.assign({ id: s.id, name: s.name, side: s.side }, winbackAt(s, winbackBudget * s.share / (sum(p.winback, x => x.share) || 1))));

    const rSpend = sideBudget.retailer, bSpend = sideBudget.brand;
    const rICAC = newRetailers ? rSpend / newRetailers : Infinity, bICAC = newBrands ? bSpend / newBrands : Infinity;
    const ratio = newBrands ? newRetailers / newBrands : Infinity;
    const wbGMV = sum(wb, w => w.gmv), wbNet = sum(wb, w => w.net);
    const gmvY1 = newRetailers * R.gmvY1 + newBrands * p.brand.gmvY1 * p.brand.incrShare + referredRetailers * R.gmvY1 + wbGMV;
    const value = sum(rows, r => r.value) + wbNet * p.retailer.margin;

    // Markets: split customers by weight ÷ CAC multiplier; GMV follows each market's order size.
    const mDen = sum(p.markets, m => m.weight / m.cac) || 1;
    const markets = p.markets.map(m => {
      const share = (m.weight / m.cac) / mDen;
      const ret = newRetailers * share, br = newBrands * share, spend = acq * m.weight / mW;
      const gmv = ret * R.gmvY1 * m.aov + br * p.brand.gmvY1 * p.brand.incrShare * m.aov;
      return Object.assign({}, m, { spend, retailers: ret, brands: br, iCAC: ret ? (spend * (1 - p.supplyShare)) / ret : Infinity, gmvY1: gmv,
        payback: ret ? ((spend * (1 - p.supplyShare)) / ret) / (R.contribY1 * m.aov / 12) : Infinity });
    });

    return {
      p, total, acq, winbackBudget, sideBudget, marketCAC, netMult,
      R, B, rows, wb, markets,
      kpi: {
        newRetailers, newBrands, referredRetailers, rICAC, bICAC, ratio,
        balance: ratio < p.balance.min ? 'supply-heavy' : ratio > p.balance.max ? 'demand-heavy' : 'balanced',
        rLtvCac: R.ltv / rICAC, bLtvCac: B.ltv / bICAC,
        rPayback: rICAC / (R.contribY1 / 12), bPayback: bICAC / (B.contribY1 / 12),
        gmvY1, gmvPerDollar: gmvY1 / total, value, roi: value / total,
        wbGMV, wbNet, wbIncr: sum(wb, w => w.incr)
      }
    };
  }

  // ---------- optimizers ----------
  // Within one side, hand out the budget in small steps to whichever channel has the lowest marginal
  // incremental CAC. The result equalizes marginal returns, the rule an MMM-led budget review follows.
  function optimizeMix(input, sideName, steps) {
    const p = clone(input), n = steps || 400;
    const t = plan(p), budget = t.sideBudget[sideName];
    const mult = sideName === 'retailer' ? t.marketCAC * t.netMult : t.marketCAC;
    const ch = p.channels.filter(c => c.side === sideName);
    const alloc = ch.map(() => 0), step = budget / n;
    for (let i = 0; i < n; i++) {
      let best = 0, bestM = Infinity;
      ch.forEach((c, j) => {
        if (alloc[j] + step > c.refSpend * 3) return; // cap at 3× the reference spend: beyond it the curve is a guess
        const m = alloc[j] === 0 ? 0 : channelAt(c, alloc[j], mult).marginal;
        if (m < bestM) { bestM = m; best = j; }
      });
      alloc[best] += step;
    }
    ch.forEach((c, j) => { c.mix = alloc[j] / budget; });
    return p;
  }

  // Scan the supply share for the split that returns the most lifetime contribution.
  function bestSupplyShare(input) {
    let best = { share: input.supplyShare, value: -Infinity };
    for (let s = 0.05; s <= 0.4001; s += 0.01) {
      const v = plan(input, { supplyShare: +s.toFixed(2) }).kpi.value;
      if (v > best.value) best = { share: +s.toFixed(2), value: v };
    }
    return best;
  }

  // The cheapest place for the next $1M on each side.
  function nextDollar(t) {
    const pick = s => t.rows.filter(r => r.side === s && r.spend > 0).sort((a, b) => a.marginal / a.ltv - b.marginal / b.ltv)[0];
    return { retailer: pick('retailer'), brand: pick('brand') };
  }

  return { DEFAULTS, clone, retailerLTV, brandLTV, channelAt, winbackAt, incrOf, plan, optimizeMix, bestSupplyShare, nextDollar };
});
