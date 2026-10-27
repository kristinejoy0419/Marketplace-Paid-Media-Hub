# Marketplace Paid Media Hub

The Paid Media Hub, rebuilt for a two-sided wholesale marketplace where independent retailers buy and independent brands sell. It starts from a GTM brief, like the original hub, and turns it into a full paid media plan: line items, BOM, spec sheets, flighting, buy details, a test plan and agency tagging. On top of that it plans both sides of the marketplace and judges spend on **incremental** customers, GMV and lifetime contribution.

The example plan is a Faire-style wholesale marketplace. **Every number in it is an illustrative assumption, not company data.**

## Inputs (left pane)

The same ten sections as the original hub:

1. **GTM brief**: upload a PDF, DOCX or TXT (or paste text); an AI agent, or a rules-based fallback, fills the inputs below.
2. **Budget & flight**: Low, Medium and High budgets ($20M, $50M and $100M by default) and flight dates, plus the **marketplace split**: the brand (supply) share of acquisition and the retargeting & win-back share of total. The default is 20% brands and 10% win-back, based on the JD. Every media line is rescaled to land on the split.
3. **Markets**: weights, budgets and languages (North America, Europe & UK, Australia & NZ by default).
4. **Audiences**: retailers (demand), brands (supply), and existing & lapsed retailers.
5. **Initiatives & pillars**: retailer awareness, retailer first order, win-back & reorders, brand acquisition, brand awareness.
6. **Launch moments**: market weeks, trade shows, win-back waves, holiday ordering.
7. **Channels**: search & PMax, Meta, TikTok, Pinterest, YouTube, CTV, LinkedIn, Reddit, partners & affiliates, newsletters & creators, retail trade press, trade shows, retargeting & CRM audiences (WeChat, Baidu and Naver are available but off). Every placement belongs to one side: retailers, brands or win-back.
8. **Creative volume**, 9. **Creative units** (now including PMax, Advantage+ catalog, TikTok, Pinterest, CTV and partner kits) and 10. **Messaging & ad copy**.

## Tabs

| Tab | What it shows |
| --- | --- |
| **Paid Media Summary** | Budget by marketplace side, channel, market, stage and initiative; incremental retailers and brands, GMV, network balance and LTV : iCAC. |
| **Growth Plan** | The two-sided plan: incremental CAC and LTV on each side, network effect, the best supply share, where the next $1M goes, Low vs Medium vs High, editable unit economics. |
| **Channel Incrementality** | Per channel and side: platform CAC, MMM / lift reads, incremental customers, iCAC, marginal iCAC, and the mix that equalizes marginal returns. |
| **Retargeting & Win-back** | Holdout-read win-back segments and the win-back media lines. |
| **International** | Spend, customers, iCAC, GMV and payback by market, plus a launch checklist. |
| **BOM**, **Spec Sheet for Creative Studio**, **Assets**, **Flighting & Projected Outcomes**, **Buy Details**, **Test Plan**, **Spec Sheet & Tagging for Agency** | The original hub tabs, with marketplace channels, funnel (sign-up → approved → first order → repeat), tests and tags. |

Exports: **Download PDF** (every tab, landscape A4), **.xlsx** (this version or all three, including the marketplace tabs), CSV and copy for any tab. Plans save in the browser under Projects, with JSON backups.

## How the marketplace model works (js/model.js)

- CAC at spend = base CAC × (spend ÷ reference spend) ^ elasticity; incremental = attributed × incrementality (a lift test read overrides MMM).
- Marginal iCAC = iCAC ÷ (1 − elasticity). The rebalancer moves budget to the lowest marginal iCAC, capped at 3× reference spend.
- Retailer LTV from first and repeat orders, retention and take rates; brand LTV from net-new GMV plus the retailers each brand brings.
- Network effect: new brands relative to the active base lower retailer CAC; a balance band flags supply-heavy or demand-heavy plans.
- Win-back: reach saturates with spend, and only exposed − holdout orders count.

## Run it

Open `index.html` in a browser, or the GitHub Pages site. `npm test` runs the model tests; `npm run build` writes a single-file `dist/hub.html`.

Files: `js/hub.js` (the original hub with marketplace data), `js/marketplace.js` (split sliders, marketplace tabs, PDF), `js/model.js`, `css/hub.css`, `css/marketplace.css`.
